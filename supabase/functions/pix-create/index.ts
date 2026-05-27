import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PlanType = "monthly" | "lifetime";

type CouponRow = {
  id: string;
  code: string;
  discount_percent: number;
  active: boolean;
  valid_until: string | null;
};

type AsaasCustomer = {
  id: string;
  name?: string;
  email?: string;
  cpfCnpj?: string;
};

type AsaasListResponse<T> = {
  data?: T[];
};

type AsaasPaymentCreateResponse = {
  id: string;
  status?: string;
  value?: number;
};

type AsaasPixQrCodeResponse = {
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
};

type CreatePixChargeBody = {
  plan: PlanType;
  coupon_code?: string | null;
  cpf?: string | null;
};

function parseExternalReference(externalReference: string): {
  userId: string;
  couponId: string | null;
} {
  if (!externalReference) return { userId: "", couponId: null };
  const parts = externalReference.split("__");
  return { userId: parts[0], couponId: parts.length > 1 ? parts[1] : null };
}

function sendJson(
  status: number,
  body: unknown,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

function toYmd(date: Date): string {
  // YYYY-MM-DD (sem timezone, formato exigido pela Asaas)
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toSecondsUntil(expirationDate: string | null | undefined): number {
  if (!expirationDate) return 3600;
  const expiresAt = new Date(expirationDate).getTime();
  const now = Date.now();
  const diff = Math.floor((expiresAt - now) / 1000);
  return diff > 0 ? diff : 3600;
}

function toQrImageSrc(encodedImage: string | null | undefined): string | null {
  if (!encodedImage) return null;
  if (encodedImage.startsWith("data:image")) return encodedImage;
  return `data:image/png;base64,${encodedImage}`;
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1) Autenticar usuário via Supabase (Bearer token do frontend)
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseKey =
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("ANON_KEY") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      supabaseKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return sendJson(401, { success: false, error: "Não autorizado" });
    }

    // 2) Ler body
    const body = (await req.json()) as Partial<CreatePixChargeBody>;
    const plan = body.plan;
    const couponCode = body.coupon_code?.toString().trim() || "";
    const cpfFromBody = body.cpf?.toString().trim() || "";

    // Busca CPF salvo no perfil, se disponível.
    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("cpf_cnpj")
      .eq("user_id", user.id)
      .maybeSingle<{ cpf_cnpj?: string | null }>();

    const cpfFromSettings = userSettings?.cpf_cnpj?.toString().trim() || "";
    const cpfFromMetadata =
      (user.user_metadata?.cpf_cnpj as string | undefined)?.toString().trim() || "";

    const cpfResolved = cpfFromBody || cpfFromSettings || cpfFromMetadata || "";
    // TODO PRODUÇÃO: substituir CPF fictício pelo CPF real do usuário
    // Exige campo CPF no cadastro (src/pages/SignupPage.tsx ou similar)
    // e armazenamento em user_settings ou auth.user_metadata
    // OBRIGATÓRIO antes de ir para produção
    // Sandbox: se não vier CPF, usa CPF fictício para permitir criação do customer.
    const cpfCnpj = cpfResolved.replace(/\D/g, "") || "52998224725";

    if (plan !== "lifetime" && plan !== "monthly") {
      return sendJson(400, { success: false, error: "Plano inválido" });
    }

    // 3) Calcular valor base e descrição
    const baseAmount = plan === "lifetime" ? 97.0 : 9.9;
    const description = plan === "lifetime" ? "StudyFlow Vitalício" : "StudyFlow Mensal";

    let amount = baseAmount;
    let couponId: string | null = null;

    // 4) Aplicar cupom (se houver) e capturar coupon_id
    if (couponCode) {
      const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .select("id, code, discount_percent, active, valid_until")
        .eq("code", couponCode.toUpperCase())
        .eq("active", true)
        .maybeSingle<CouponRow>();

      if (couponError) {
        console.warn("⚠️  Erro ao validar cupom, ignorando:", couponError.message);
      } else if (coupon) {
        couponId = coupon.id;
        const desconto = amount * ((coupon.discount_percent ?? 0) / 100);
        amount = Math.max(0, Number((amount - desconto).toFixed(2)));
      }
    }

    // 5) Cliente Asaas: recuperar ou criar
    const { headers: asaasHeaders, baseUrl } = getAsaasHeaders();
    if (!asaasHeaders.access_token) {
      return sendJson(500, { success: false, error: "ASAAS_API_KEY não configurada" });
    }

    const email = user.email || "";
    const nameFromMeta =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      "Estudante";

    let customerId = "";

    if (!email) {
      return sendJson(400, { success: false, error: "Usuário sem email" });
    }

    // Buscar por email
    const customerSearch = await fetch(
      `${baseUrl}/customers?email=${encodeURIComponent(email)}`,
      { method: "GET", headers: asaasHeaders }
    );

    if (!customerSearch.ok) {
      const t = await customerSearch.text();
      console.error("❌ Erro ao buscar customer na Asaas:", customerSearch.status, t);
      return sendJson(502, { success: false, error: "Erro ao buscar cliente na Asaas" });
    }

    const searchJson = (await customerSearch.json()) as AsaasListResponse<AsaasCustomer>;
    const existing = Array.isArray(searchJson.data) ? searchJson.data[0] : undefined;

    if (existing?.id) {
      customerId = existing.id;

      // Se o customer existir sem CPF/CNPJ, atualiza com o CPF recebido (ou fictício de teste).
      if (!existing.cpfCnpj) {
        const customerUpdate = await fetch(`${baseUrl}/customers/${customerId}`, {
          method: "PUT",
          headers: asaasHeaders,
          body: JSON.stringify({ cpfCnpj }),
        });

        if (!customerUpdate.ok) {
          const t = await customerUpdate.text();
          console.error("❌ Erro ao atualizar CPF do customer na Asaas:", customerUpdate.status, t);
          return sendJson(502, {
            success: false,
            error: "Erro ao atualizar CPF do cliente na Asaas",
          });
        }
      }
    } else {
      const customerCreate = await fetch(`${baseUrl}/customers`, {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify({ name: nameFromMeta, email, cpfCnpj }),
      });

      if (!customerCreate.ok) {
        const t = await customerCreate.text();
        console.error("❌ Erro ao criar customer na Asaas:", customerCreate.status, t);
        return sendJson(502, { success: false, error: "Erro ao criar cliente na Asaas" });
      }

      const created = (await customerCreate.json()) as AsaasCustomer;
      customerId = created.id;
    }

    if (!customerId) {
      return sendJson(502, { success: false, error: "Não foi possível obter customerId" });
    }

    // 6) Criar cobrança PIX
    const due = new Date();
    due.setDate(due.getDate() + 1);

    const externalReference = couponId ? `${user.id}__${couponId}` : user.id;
    // valida formato esperado (e evita mandar lixo pro webhook)
    parseExternalReference(externalReference);

    const paymentCreate = await fetch(`${baseUrl}/payments`, {
      method: "POST",
      headers: asaasHeaders,
      body: JSON.stringify({
        customer: customerId,
        billingType: "PIX",
        value: amount,
        dueDate: toYmd(due),
        description,
        externalReference,
      }),
    });

    if (!paymentCreate.ok) {
      const t = await paymentCreate.text();
      console.error("❌ Erro ao criar pagamento na Asaas:", paymentCreate.status, t);
      return sendJson(502, { success: false, error: "Erro ao criar cobrança PIX" });
    }

    const payment = (await paymentCreate.json()) as AsaasPaymentCreateResponse;
    const paymentId = payment.id;

    if (!paymentId) {
      return sendJson(502, { success: false, error: "Asaas não retornou payment.id" });
    }

    // 7) Buscar QR Code PIX
    const qrResp = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, {
      method: "GET",
      headers: asaasHeaders,
    });

    if (!qrResp.ok) {
      const t = await qrResp.text();
      console.error("❌ Erro ao buscar QRCode na Asaas:", qrResp.status, t);
      return sendJson(502, { success: false, error: "Erro ao buscar QR Code" });
    }

    const qr = (await qrResp.json()) as AsaasPixQrCodeResponse;

    // 8) Salvar transação pendente (service role)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SB_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: insertError } = await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      txid: paymentId,
      amount,
      plan_type: plan,
      status: "pending",
    });

    if (insertError) {
      console.error("❌ Erro ao inserir transactions:", insertError.message);
      // Se falhar a persistência, ainda assim retornamos o QR para não travar o checkout.
    }

    // 9) Retornar ao frontend no formato esperado pelo PixPaymentModal
    const expiracao = toSecondsUntil(qr.expirationDate);
    const qrcodeImage = toQrImageSrc(qr.encodedImage);

    return sendJson(200, {
      success: true,
      data: {
        txid: paymentId,
        pixCopiaECola: qr.payload ?? "",
        qrcode: qrcodeImage ?? "",
        valor: amount,
        expiracao,
      },
      // Compatibilidade com payload atual da Asaas
      encodedImage: qr.encodedImage ?? null,
      payload: qr.payload ?? null,
      expirationDate: qr.expirationDate ?? null,
      transactionId: paymentId,
    });
  } catch (error) {
    console.error("❌ Erro em pix-create:", error);
    return sendJson(500, { success: false, error: (error as Error).message });
  }
});

