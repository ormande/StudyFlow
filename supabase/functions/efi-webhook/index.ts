import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Função para enviar email via Brevo
async function sendWelcomeEmail(email: string, name: string) {
  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  
  if (!BREVO_API_KEY) {
    console.error("BREVO_API_KEY não configurada");
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        templateId: 1,
        to: [{ email: email, name: name || "Estudante" }],
        params: {
          nome: name || "Estudante",
        },
      }),
    });

    if (response.ok) {
      console.log(`Email de boas-vindas enviado para ${email}`);
    } else {
      const errorData = await response.text();
      console.error("Erro ao enviar email:", errorData);
    }
  } catch (error) {
    console.error("Erro ao chamar API do Brevo:", error);
  }
}

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

    // Extrair user_id e coupon_id do customId (formato: "user_id__coupon_id")
    const customIdParts = (customId || '').split('__');
    const userId = customIdParts[0];
    const couponId = customIdParts.length > 1 ? customIdParts[1] : null;

    console.log("Dados extraídos:", { chargeId, status, customId, userId, couponId, amount });

    // 3. Se pagamento confirmado, atualizar usuário
    if (status === "paid" && userId) {
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

      console.log("Atualizando usuário:", userId, subscriptionData);

      const { error } = await supabaseAdmin
        .from("user_settings")
        .update(subscriptionData)
        .eq("user_id", userId);

      if (error) {
        console.error("Erro ao atualizar user_settings:", error);
      } else {
        console.log("Usuário atualizado com sucesso!");

        // Buscar email do usuário para enviar boas-vindas
        try {
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
          
          if (!userError && userData?.user?.email) {
            const userEmail = userData.user.email;
            const userName = userData.user.user_metadata?.full_name || 
                            userData.user.user_metadata?.name || 
                            "Estudante";
            
            // Enviar email de boas-vindas
            await sendWelcomeEmail(userEmail, userName);
          } else {
            console.error("Erro ao buscar dados do usuário:", userError);
          }
        } catch (emailError) {
          console.error("Erro ao processar envio de email:", emailError);
        }

        // Registrar uso do cupom (apenas quando pagamento confirmado)
        if (couponId) {
          try {
            // Verificar se já não foi registrado (evitar duplicação)
            const { data: existingUse } = await supabaseAdmin
              .from("coupon_uses")
              .select("id")
              .eq("coupon_id", couponId)
              .eq("user_id", userId)
              .single();

            if (!existingUse) {
              // Registrar uso
              const { error: useError } = await supabaseAdmin
                .from("coupon_uses")
                .insert({
                  coupon_id: couponId,
                  user_id: userId,
                });

              if (!useError) {
                // Incrementar contador
                await supabaseAdmin.rpc("increment_coupon_uses", {
                  p_coupon_id: couponId,
                });
                console.log(`Cupom ${couponId} registrado com sucesso para usuário ${userId}`);
              } else {
                console.error("Erro ao registrar uso do cupom:", useError);
              }
            } else {
              console.log(`Cupom ${couponId} já foi registrado para este usuário`);
            }
          } catch (err) {
            console.error("Erro ao processar cupom:", err);
          }
        }
      }
    }

    // 4. Sempre retornar 200
    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("Erro no webhook:", error);
    return new Response("OK", { status: 200 });
  }
});
