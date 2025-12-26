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

    // 2. Buscar assinatura atual
    const { data: settings, error: fetchError } = await supabaseClient
      .from("user_settings")
      .select("subscription_status, subscription_type, next_billing_date")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !settings) {
      return new Response(
        JSON.stringify({ error: "Configurações não encontradas" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Verificar se pode cancelar
    if (settings.subscription_type === "lifetime") {
      return new Response(
        JSON.stringify({ error: "Plano vitalício não pode ser cancelado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (settings.subscription_status !== "active") {
      return new Response(
        JSON.stringify({ error: "Nenhuma assinatura ativa para cancelar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Cancelar assinatura (mantém acesso até next_billing_date)
    const { error: updateError } = await supabaseClient
      .from("user_settings")
      .update({
        subscription_status: "cancelled",
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Erro ao cancelar:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao cancelar assinatura" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: "Assinatura cancelada. Você ainda terá acesso até o fim do período pago.",
        access_until: settings.next_billing_date,
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