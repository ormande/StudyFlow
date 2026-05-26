import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Autenticar usuário
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Buscar dados do usuário
    const { data: userSettings } = await supabaseClient
      .from("user_settings")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .single();

    const customerName = userSettings?.first_name && userSettings?.last_name
      ? `${userSettings.first_name} ${userSettings.last_name}`
      : user.email?.split("@")[0] || "Cliente";

    // 3. Obter token do Efi
    const clientId = Deno.env.get("EFI_CLIENT_ID");
    const clientSecret = Deno.env.get("EFI_CLIENT_SECRET");
    const isSandbox = Deno.env.get("EFI_SANDBOX") === "true";
    
    const baseUrl = isSandbox
      ? "https://cobrancas-h.api.efipay.com.br"
      : "https://cobrancas.api.efipay.com.br";

    const credentials = btoa(`${clientId}:${clientSecret}`);
    
    const tokenResponse = await fetch(`${baseUrl}/v1/authorize`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ grant_type: "client_credentials" }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error("Falha ao obter token Efi");
    }

    // 4. Criar assinatura vinculada ao plano
    const PLAN_ID = isSandbox ? 14354 : 129962; // Sandbox : Produção
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

    const subscriptionBody = {
      items: [
        {
          name: "StudyFlow Mensal",
          value: 990, // R$ 9,90 em centavos
          amount: 1,
        },
      ],
      metadata: {
        custom_id: user.id,
        notification_url: `${SUPABASE_URL}/functions/v1/efi-webhook`,
      },
      settings: {
        payment_method: "all",
        expire_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 dias
        request_delivery_address: false,
      },
    };

    console.log("Criando assinatura:", JSON.stringify(subscriptionBody, null, 2));

    const subscriptionResponse = await fetch(
      `${baseUrl}/v1/plan/${PLAN_ID}/subscription/one-step/link`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscriptionBody),
      }
    );

    const subscriptionData = await subscriptionResponse.json();
    console.log("Resposta Efi:", JSON.stringify(subscriptionData, null, 2));

    if (!subscriptionResponse.ok) {
      throw new Error(subscriptionData.message || "Erro ao criar assinatura");
    }

    // 5. Retornar link de pagamento
    return new Response(
      JSON.stringify({
        subscription_id: subscriptionData.data.subscription_id,
        charge_id: subscriptionData.data.charge?.id,
        link: subscriptionData.data.payment_url,
        status: subscriptionData.data.status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});