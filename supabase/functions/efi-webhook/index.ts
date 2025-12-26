import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // 1. Ler corpo da requisição (pode ser JSON ou URL-encoded)
    const contentType = req.headers.get("content-type") || "";
    let body: any = {};

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
      // Tenta parsear o campo 'notification' se existir
      if (body.notification) {
        try {
          body = JSON.parse(body.notification);
        } catch {
          // mantém como está
        }
      }
    } else {
      // Tenta JSON de qualquer forma
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        const params = new URLSearchParams(text);
        body = Object.fromEntries(params.entries());
      }
    }

    console.log("Webhook recebido:", JSON.stringify(body, null, 2));

    // 2. Extrair dados (Efi pode enviar em diferentes estruturas)
    const notification = body.notification ? JSON.parse(body.notification) : body;
    const chargeId = notification.charge_id || notification.id || body.id;
    const status = notification.status || body.status;
    const customId = notification.custom_id || body.custom_id;
    const amount = notification.value || notification.total || body.value || 0;

    console.log("Dados extraídos:", { chargeId, status, customId, amount });

    // 3. Se pagamento confirmado, atualizar usuário
    if (status === "paid" && customId) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SB_SERVICE_ROLE_KEY") ?? ""
      );

      const isVitalicio = amount >= 9000; // R$ 90+ = vitalício

      const subscriptionData = {
        subscription_status: "active",
        subscription_type: isVitalicio ? "lifetime" : "monthly",
        subscription_id: String(chargeId),
        next_billing_date: isVitalicio
          ? null
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      console.log("Atualizando usuário:", customId, subscriptionData);

      const { error } = await supabaseAdmin
        .from("user_settings")
        .update(subscriptionData)
        .eq("user_id", customId);

      if (error) {
        console.error("Erro ao atualizar user_settings:", error);
      } else {
        console.log("Usuário atualizado com sucesso!");
      }
    }

    // 4. Sempre retornar 200
    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("Erro no webhook:", error);
    return new Response("OK", { status: 200 });
  }
});