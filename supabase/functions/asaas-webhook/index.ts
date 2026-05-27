// @ts-ignore
// supabase-edge-runtime-no-auth
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PlanType = "monthly" | "lifetime";

type AsaasWebhookBody = {
  event?: string;
  payment?: {
    id?: string;
    status?: string;
    value?: number;
    billingType?: string;
    externalReference?: string;
  };
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

function determinePlanFromValue(value: number): PlanType {
  return value >= 90 ? "lifetime" : "monthly";
}

function isPaidStatus(status: string): boolean {
  const s = (status || "").toUpperCase();
  return s === "RECEIVED" || s === "CONFIRMED";
}

serve(async (req) => {
  // Webhook deve sempre responder 200 (Asaas retenta em caso de erro).
  try {
    if (req.method !== "POST") {
      return new Response("OK", { status: 200 });
    }

    // Em sandbox, não validar token para facilitar testes locais/iniciais.
    // Em produção, mantém validação normal.
    const isSandbox = Deno.env.get("ASAAS_SANDBOX") === "true";
    if (!isSandbox) {
      const receivedToken = req.headers.get("asaas-access-token") || "";
      const expectedToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN") ?? "";

      if (!receivedToken || !expectedToken || receivedToken !== expectedToken) {
        console.log("Token inválido");
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const body = (await req.json()) as AsaasWebhookBody;

    const event = body.event || "";
    const paymentId = body.payment?.id || "";
    const status = body.payment?.status || "";
    const value = Number(body.payment?.value ?? 0);
    const externalReference = body.payment?.externalReference || "";

    const acceptedEvents = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"];
    if (!acceptedEvents.includes(event)) {
      return new Response("OK", { status: 200 });
    }

    if (!paymentId || !externalReference || !isPaidStatus(status)) {
      return new Response("OK", { status: 200 });
    }

    const { userId, couponId } = parseExternalReference(externalReference);
    if (!userId) {
      return new Response("OK", { status: 200 });
    }

    const plan: PlanType = determinePlanFromValue(value);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SB_SERVICE_ROLE_KEY") ?? ""
    );

    // 1) Idempotência: usa a nova tabela de assinatura.
    const { data: currentSubscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();

    const alreadyActive = currentSubscription?.status === "active";

    // 2) Atualizar transactions
    await supabaseAdmin
      .from("transactions")
      .update({ status: "completed" })
      .eq("txid", paymentId);

    if (alreadyActive) {
      return new Response("OK", { status: 200 });
    }

    // 3) Ativar assinatura (nova tabela)
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
          user_id: userId,
          ...updateData,
        },
        { onConflict: "user_id" }
      );

    // 4) Registrar uso de cupom (se houver)
    if (couponId) {
      await supabaseAdmin.from("coupon_uses").insert({
        coupon_id: couponId,
        user_id: userId,
      });
    }

    // 5) Buscar email/nome e enviar email
    const { data: userRow } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = userRow?.user?.email || "";
    const name =
      (userRow?.user?.user_metadata?.full_name as string | undefined) ||
      (userRow?.user?.user_metadata?.name as string | undefined) ||
      "Estudante";

    if (email) {
      await sendWelcomeEmail(email, name);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Erro em asaas-webhook:", error);
    return new Response("OK", { status: 200 });
  }
});

