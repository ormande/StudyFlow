import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para obter token de acesso da Efí
async function getEfiAccessToken(): Promise<string> {
  const clientId = Deno.env.get("EFI_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("EFI_CLIENT_SECRET") ?? "";
  const isSandbox = Deno.env.get("EFI_SANDBOX") === "true";
  
  const authUrl = isSandbox
    ? "https://cobrancas-h.api.efipay.com.br/v1/authorize"
    : "https://cobrancas.api.efipay.com.br/v1/authorize";

  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });

  const data = await response.json();
  return data.access_token;
}

// Função para buscar detalhes da notificação na Efí
async function getNotificationDetails(token: string): Promise<any> {
  const accessToken = await getEfiAccessToken();
  const isSandbox = Deno.env.get("EFI_SANDBOX") === "true";
  
  const baseUrl = isSandbox
    ? "https://cobrancas-h.api.efipay.com.br"
    : "https://cobrancas.api.efipay.com.br";

  const response = await fetch(`${baseUrl}/v1/notification/${token}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao buscar notificação: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Função para enviar email de boas-vindas
async function sendWelcomeEmail(email: string, name: string) {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    console.log("BREVO_API_KEY não configurada, pulando envio de email");
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
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
      console.log("Email de boas-vindas enviado para:", email);
    } else {
      const error = await response.text();
      console.error("Erro ao enviar email:", error);
    }
  } catch (error) {
    console.error("Erro ao enviar email de boas-vindas:", error);
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== EFI WEBHOOK RECEBIDO ===");
    
    // 1. Ler o body (pode ser form-urlencoded ou JSON)
    const contentType = req.headers.get("content-type") || "";
    console.log("Content-Type:", contentType);
    
    let notificationToken = "";
    
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      notificationToken = formData.get("notification")?.toString() || "";
      console.log("Token extraído do form-data:", notificationToken);
    } else {
      const body = await req.json();
      notificationToken = body.notification || "";
      console.log("Token extraído do JSON:", notificationToken);
    }

    if (!notificationToken) {
      console.log("Nenhum token de notificação recebido");
      return new Response(JSON.stringify({ message: "OK" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Buscar detalhes da notificação na API da Efí
    console.log("Buscando detalhes da notificação...");
    const notificationData = await getNotificationDetails(notificationToken);
    console.log("Dados da notificação:", JSON.stringify(notificationData, null, 2));

    // 3. Processar os dados (a Efí retorna um array de eventos)
    const events = notificationData.data || [notificationData];
    
    for (const event of events) {
      // Status pode ser objeto { current: "paid" } ou string
      const statusRaw = event.status;
      const status = typeof statusRaw === "object" ? statusRaw?.current : statusRaw || "";
      const customId = event.custom_id || "";
      const txid = event.txid || event.identifiers?.txid || "";
      const chargeId = event.identifiers?.charge_id || event.id || "";
      const value = event.value || 0;

      console.log("Evento processado:", { status, customId, txid, chargeId, value, type: event.type });

      // Extrair user_id e coupon_id
      let userId = "";
      let couponId = null;

      if (customId) {
        // Formato padrão: user_id__coupon_id
        const customIdParts = customId.split("__");
        userId = customIdParts[0];
        couponId = customIdParts.length > 1 ? customIdParts[1] : null;
      } else if (txid && txid.startsWith("SF")) {
        // Formato PIX: SF + user_id sem hifens (34 chars)
        // txid format: SFca72d1b63de4418392b95232ebcd33d1
        const rawId = txid.substring(2);
        if (rawId.length === 32) {
          // Recompor UUID: 8-4-4-4-12
          userId = `${rawId.substring(0, 8)}-${rawId.substring(8, 12)}-${rawId.substring(12, 16)}-${rawId.substring(16, 20)}-${rawId.substring(20, 32)}`;
        }
      }

      console.log("User ID Identificado:", userId, "| Coupon ID:", couponId);

      // 4. Verificar se é um status de pagamento confirmado
      const paidStatuses = ["paid", "active", "settled", "approved", "identified"];
      const statusLower = (status || "").toString().toLowerCase();
      const isPaid = paidStatuses.includes(statusLower);

      // Para CHARGE (vitalício): não exigir value > 0, pois a Efí não envia
      // Para SUBSCRIPTION (mensal): exigir value > 0 para evitar duplicação
      const isCharge = event.type === "charge";
      const isSubscriptionCharge = event.type === "subscription_charge";

      const shouldActivate = isPaid && userId && (isCharge || (isSubscriptionCharge && value > 0));

      if (shouldActivate) {
        console.log("Pagamento confirmado! Ativando usuário:", userId, "Tipo:", event.type, "Valor:", value);

        // Criar cliente Supabase com service role
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SB_SERVICE_ROLE_KEY") ?? ""
        );

        // Verificar se já está ativo para evitar emails duplicados
        const { data: currentSettings } = await supabaseAdmin
          .from("user_settings")
          .select("subscription_status")
          .eq("user_id", userId)
          .single();

        if (currentSettings?.subscription_status === "active") {
          console.log("Usuário já está ativo, pulando atualização e email");
          continue; // Pula para o próximo evento do loop
        }

        // Determinar tipo de plano:
        // - charge = vitalício (cobrança avulsa)
        // - subscription_charge com value >= 9000 = vitalício
        // - subscription_charge com value < 9000 = mensal
        const isVitalicio = isCharge || value >= 9000;

        // Atualizar user_settings
        const updateData: any = {
          subscription_status: "active",
          subscription_type: isVitalicio ? "lifetime" : "monthly",
        };

        if (!isVitalicio) {
          // Plano mensal: definir próxima cobrança
          const nextBilling = new Date();
          nextBilling.setDate(nextBilling.getDate() + 30);
          updateData.next_billing_date = nextBilling.toISOString();
        }

        const { error: updateError } = await supabaseAdmin
          .from("user_settings")
          .update(updateData)
          .eq("user_id", userId);

        if (updateError) {
          console.error("Erro ao atualizar user_settings:", updateError);
        } else {
          console.log("Usuário atualizado com sucesso!");

          // Registrar uso do cupom se houver
          if (couponId) {
            await supabaseAdmin.from("coupon_uses").insert({
              coupon_id: couponId,
              user_id: userId,
              used_at: new Date().toISOString(),
            });
            console.log("Uso do cupom registrado:", couponId);
          }

          // Buscar dados do usuário para enviar email
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (userData?.user?.email) {
            const userName = userData.user.user_metadata?.full_name || 
                           userData.user.user_metadata?.name || 
                           "Estudante";
            await sendWelcomeEmail(userData.user.email, userName);
          }
        }
      } else {
        console.log("Condição de ativação não atendida:", { statusLower, userId, isPaid, value, type: event.type });
      }
    }

    return new Response(JSON.stringify({ message: "OK" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro no webhook:", error);
    // Sempre retornar 200 para a Efí não retentar infinitamente
    return new Response(JSON.stringify({ message: "OK", error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
