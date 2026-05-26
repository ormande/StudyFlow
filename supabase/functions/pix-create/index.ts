import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PIX_SERVER_URL = "https://studyflow-pix-server-production.up.railway.app";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { plan, coupon_code } = await req.json();

    // Definir valor baseado no plano
    let valor = plan === "lifetime" ? 97.0 : 9.9;
    let descricao = plan === "lifetime" ? "StudyFlow Vitalício" : "StudyFlow Mensal";

    // Aplicar cupom se houver
    if (coupon_code) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", coupon_code.toUpperCase())
        .eq("active", true)
        .single();

      if (coupon) {
        const desconto = valor * (coupon.discount_percent / 100);
        valor = valor - desconto;
      }
    }

    // Chamar servidor PIX
    const response = await fetch(`${PIX_SERVER_URL}/pix/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        valor,
        plano: plan === "lifetime" ? "Vitalício" : "Mensal",
        descricao,
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

