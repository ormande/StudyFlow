import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * ============================================================================
 * ASAAS POLLING - CRON JOB
 * ============================================================================
 * Segurança extra: valida pagamentos "pending" que foram pagos mas o webhook
 * não processou. Sempre retorna 200 com um resumo do processamento.
 * ============================================================================
 */

type PlanType = "monthly" | "lifetime";

type TransactionRecord = {
  id: string;
  user_id: string;
  txid: string;
  amount: number;
  plan_type: PlanType;
  status: "pending" | "completed" | "cancelled" | "expired";
  created_at: string;
};

type AsaasPaymentResponse = {
  id?: string;
  status?: string;
  value?: number;
  externalReference?: string;
};

function parseExternalReference(externalReference: string): {
  userId: string;
  couponId: string | null;
} {
  if (!externalReference) return { userId: "", couponId: null };
  const parts = externalReference.split("__");
  return { userId: parts[0], couponId: parts.length > 1 ? parts[1] : null };
}

function getAsaasHeaders() {
  const isSandbox = Deno.env.get("ASAAS_SANDBOX") === "true";
  const apiKey = isSandbox
    ? Deno.env.get("ASAAS_SANDBOX_API_KEY")
    : Deno.env.get("ASAAS_API_KEY");
  const baseUrl = isSandbox
    ? "https://api-sandbox.asaas.com/v3"
    : "https://api.asaas.com/v3";
  return {
    headers: {
      access_token: apiKey ?? "",
      "Content-Type": "application/json",
      "User-Agent": "StudyFlow",
    },
    baseUrl,
  };
}

async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  try {
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      console.log("ℹ️  BREVO_API_KEY não configurada, pulando envio de email");
      return;
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        templateId: 1,
        to: [{ email, name: name || "Estudante" }],
        params: { nome: name || "Estudante" },
      }),
    });

    if (response.ok) {
      console.log(`✅ Email de boas-vindas enviado para: ${email}`);
    } else {
      const errorText = await response.text();
      console.error(`⚠️  Erro ao enviar email para ${email}:`, errorText);
    }
  } catch (error) {
    console.error("❌ Exceção ao enviar email:", error);
  }
}

function isPaidStatus(status: string): boolean {
  const s = (status || "").toUpperCase();
  return s === "RECEIVED" || s === "CONFIRMED";
}

function determinePlanFromValue(value: number): PlanType {
  return value >= 90 ? "lifetime" : "monthly";
}

function olderThanMinutes(iso: string, minutes: number): boolean {
  const created = new Date(iso).getTime();
  const now = Date.now();
  return now - created > minutes * 60 * 1000;
}

serve(async (_req) => {
  const result = {
    success: true,
    processed: 0,
    skipped: 0,
    errors: 0,
    total: 0,
  };

  try {
    const { headers: asaasHeaders, baseUrl } = getAsaasHeaders();
    if (!asaasHeaders.access_token) {
      console.error("❌ ASAAS_API_KEY não configurada");
      result.success = false;
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SB_SERVICE_ROLE_KEY") ?? ""
    );

    // 1) Buscar pendências com +10min
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from("transactions")
      .select("id, user_id, txid, amount, plan_type, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(200)
      .returns<TransactionRecord[]>();

    if (pendingError) {
      console.error("❌ Erro ao buscar transactions pending:", pendingError.message);
      result.success = false;
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const candidates = (pending || []).filter((t) => olderThanMinutes(t.created_at, 10));
    result.total = candidates.length;

    for (const txn of candidates) {
      try {
        // 2) Consultar Asaas
        const resp = await fetch(`${baseUrl}/payments/${encodeURIComponent(txn.txid)}`, {
          method: "GET",
          headers: asaasHeaders,
        });

        if (!resp.ok) {
          const t = await resp.text();
          console.warn("⚠️  Erro ao consultar payment:", txn.txid, resp.status, t);
          result.errors += 1;
          continue;
        }

        const payment = (await resp.json()) as AsaasPaymentResponse;
        const status = payment.status || "";
        if (!isPaidStatus(status)) {
          result.skipped += 1;
          continue;
        }

        // 3) Idempotência (nova tabela)
        const { data: subscription } = await supabaseAdmin
          .from("user_subscriptions")
          .select("status")
          .eq("user_id", txn.user_id)
          .maybeSingle();

        const alreadyActive = subscription?.status === "active";

        // 4) Marcar transação como completed
        await supabaseAdmin
          .from("transactions")
          .update({ status: "completed" })
          .eq("id", txn.id);

        if (alreadyActive) {
          result.processed += 1;
          continue;
        }

        // 5) Ativar assinatura (nova tabela)
        const value = Number(payment.value ?? txn.amount ?? 0);
        const plan = determinePlanFromValue(value);

        const updateData: Record<string, unknown> = {
          status: "active",
          plan_type: plan,
          updated_at: new Date().toISOString(),
        };

        if (plan === "lifetime") {
          updateData.subscription_end_date = null;
          updateData.next_billing_date = null;
          updateData.trial_ends_at = null;
        } else {
          const end = new Date();
          end.setDate(end.getDate() + 30);
          updateData.subscription_end_date = end.toISOString();
          updateData.next_billing_date = end.toISOString();
          updateData.trial_ends_at = null;
        }

        await supabaseAdmin
          .from("user_subscriptions")
          .upsert(
            {
              user_id: txn.user_id,
              ...updateData,
            },
            { onConflict: "user_id" }
          );

        // 6) Registrar cupom se houver
        const externalReference = payment.externalReference || "";
        const { couponId } = parseExternalReference(externalReference);
        if (couponId) {
          await supabaseAdmin.from("coupon_uses").insert({
            coupon_id: couponId,
            user_id: txn.user_id,
          });
        }

        // 7) Email boas-vindas
        const { data: userRow } = await supabaseAdmin.auth.admin.getUserById(txn.user_id);
        const email = userRow?.user?.email || "";
        const name =
          (userRow?.user?.user_metadata?.full_name as string | undefined) ||
          (userRow?.user?.user_metadata?.name as string | undefined) ||
          "Estudante";
        if (email) await sendWelcomeEmail(email, name);

        result.processed += 1;
      } catch (err) {
        console.error("❌ Erro processando transaction:", txn.id, err);
        result.errors += 1;
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Erro em asaas-polling:", error);
    result.success = false;
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});

