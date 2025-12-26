import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verificar autenticação
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Pegar dados do body (incluindo coupon_id)
    const { amount, description, type, coupon_id } = await req.json();
    
    if (!amount) {
      return new Response(
        JSON.stringify({ error: "Valor obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Credenciais Efi Bank
    const clientId = Deno.env.get("EFI_CLIENT_ID");
    const clientSecret = Deno.env.get("EFI_CLIENT_SECRET");
    const isSandbox = Deno.env.get("EFI_SANDBOX") === "true";
    
    const baseUrl = isSandbox 
      ? "https://cobrancas-h.api.efipay.com.br" 
      : "https://cobrancas.api.efipay.com.br";

    // 4. Obter token
    const authString = btoa(`${clientId}:${clientSecret}`);
    
    const tokenResponse = await fetch(`${baseUrl}/v1/authorize`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ grant_type: "client_credentials" }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Erro ao obter token:", errorText);
      return new Response(
        JSON.stringify({ error: "Erro na autenticação com Efi Bank" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { access_token } = await tokenResponse.json();

    // 5. Criar cobrança (etapa 1)
    const chargeBody = {
      items: [{
        name: description || (type === "mensal" ? "StudyFlow Mensal" : "StudyFlow Vitalício"),
        value: Math.round(amount * 100),
        amount: 1,
      }],
      metadata: {
        custom_id: user.id,
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/efi-webhook`,
      },
    };

    const chargeResponse = await fetch(`${baseUrl}/v1/charge`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chargeBody),
    });

    if (!chargeResponse.ok) {
      const errorText = await chargeResponse.text();
      console.error("Erro ao criar cobrança:", errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao criar cobrança", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const charge = await chargeResponse.json();
    const chargeId = charge.data.charge_id;

    // 6. Gerar link de pagamento (etapa 2)
    const linkBody = {
      message: `Obrigado por assinar o StudyFlow! Seu plano: ${type === "mensal" ? "Mensal" : "Vitalício"}`,
      expire_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      request_delivery_address: false,
      payment_method: "all",
    };

    const linkResponse = await fetch(`${baseUrl}/v1/charge/${chargeId}/link`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(linkBody),
    });

    if (!linkResponse.ok) {
      const errorText = await linkResponse.text();
      console.error("Erro ao gerar link:", errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar link de pagamento", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const linkData = await linkResponse.json();

    console.log("Resposta do link:", JSON.stringify(linkData, null, 2));

    // 7. Registrar uso do cupom (se houver)
    if (coupon_id) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SB_SERVICE_ROLE_KEY") ?? ""
      );

      // Registrar uso na tabela coupon_uses
      const { error: useError } = await supabaseAdmin
        .from("coupon_uses")
        .insert({
          coupon_id: coupon_id,
          user_id: user.id,
        });

      if (useError) {
        console.error("Erro ao registrar uso do cupom:", useError);
        // Não bloqueia o pagamento, só loga o erro
      } else {
        // Incrementar contador de usos
        const { error: updateError } = await supabaseAdmin.rpc("increment_coupon_uses", {
          p_coupon_id: coupon_id,
        });

        if (updateError) {
          console.error("Erro ao incrementar usos do cupom:", updateError);
        } else {
          console.log("Cupom registrado com sucesso:", coupon_id);
        }
      }
    }

    // 8. Retornar link
    return new Response(
      JSON.stringify({
        charge_id: chargeId,
        link: linkData.data.payment_url,
        status: charge.data.status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});