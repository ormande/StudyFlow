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

    // 2. Pegar código do cupom
    const { code } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ error: "Código não informado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Buscar cupom
    const { data: coupon, error: couponError } = await supabaseClient
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("active", true)
      .single();

    if (couponError || !coupon) {
      return new Response(JSON.stringify({ valid: false, error: "Cupom inválido" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Verificar validade
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: "Cupom expirado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Verificar limite de usos
    if (coupon.current_uses >= coupon.max_uses) {
      return new Response(JSON.stringify({ valid: false, error: "Cupom esgotado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Verificar se usuário já usou
    const { data: existingUse } = await supabaseClient
      .from("coupon_uses")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("user_id", user.id)
      .single();

    if (existingUse) {
      return new Response(JSON.stringify({ valid: false, error: "Você já usou este cupom" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Cupom válido!
    return new Response(
      JSON.stringify({
        valid: true,
        discount_percent: coupon.discount_percent,
        coupon_id: coupon.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});