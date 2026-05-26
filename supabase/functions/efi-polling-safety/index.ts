import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * ============================================================================
 * EFI POLLING SAFETY - CRON JOB
 * ============================================================================
 * Roda a cada hora e valida boletos/cartões que foram pagos mas não foram
 * processados pelo webhook, garantindo que nenhuma transação seja perdida.
 *
 * Requisitos:
 * - Env vars: EFI_CLIENT_ID, EFI_CLIENT_SECRET, EFI_SANDBOX, SUPABASE_URL, SB_SERVICE_ROLE_KEY
 * - Processa transações com status="pending" criadas há >10 minutos
 * - Chama GET /v1/charge/{charge_id} na API da Efí
 * - Se status for "paid"/"approved" E transação.status for "pending":
 *   - Atualiza transactions.status = "completed"
 *   - Ativa subscription do usuário (status, tipo, datas)
 *   - Registra uso de coupon se aplicável
 *   - Envia email de boas-vindas
 * - Sempre retorna 200 (nunca falha)
 * - Trata idempotência (não processa 2x se webhook já processou)
 * ============================================================================
 */

interface EfiChargeResponse {
  status?:
    | {
        current?: string;
      }
    | string;
  value?: number;
  type?: string;
  custom_id?: string;
  identifiers?: {
    charge_id?: string;
  };
  id?: string;
}

interface TransactionRecord {
  id: string;
  user_id: string;
  txid: string;
  plan_type: "monthly" | "lifetime";
  status: string;
  created_at: string;
}

/**
 * Obter token de acesso OAuth da Efí
 */
async function getEfiAccessToken(): Promise<string | null> {
  try {
    const clientId = Deno.env.get("EFI_CLIENT_ID") ?? "";
    const clientSecret = Deno.env.get("EFI_CLIENT_SECRET") ?? "";
    const isSandbox = Deno.env.get("EFI_SANDBOX") === "true";

    if (!clientId || !clientSecret) {
      console.error(
        "❌ Credenciais Efí não configuradas (EFI_CLIENT_ID, EFI_CLIENT_SECRET)"
      );
      return null;
    }

    const authUrl = isSandbox
      ? "https://cobrancas-h.api.efipay.com.br/v1/authorize"
      : "https://cobrancas.api.efipay.com.br/v1/authorize";

    const credentials = btoa(`${clientId}:${clientSecret}`);

    const response = await fetch(authUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ grant_type: "client_credentials" }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro ao obter token Efí:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("❌ Exceção ao obter token Efí:", error);
    return null;
  }
}

/**
 * Buscar status do boleto/cartão na Efí
 */
async function getEfiChargeStatus(
  chargeId: string,
  accessToken: string
): Promise<EfiChargeResponse | null> {
  try {
    const isSandbox = Deno.env.get("EFI_SANDBOX") === "true";
    const baseUrl = isSandbox
      ? "https://cobrancas-h.api.efipay.com.br"
      : "https://cobrancas.api.efipay.com.br";

    const response = await fetch(`${baseUrl}/v1/charge/${chargeId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        `⚠️  Erro ao buscar status da cobrança ${chargeId}:`,
        response.status
      );
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Exceção ao buscar cobrança ${chargeId}:`, error);
    return null;
  }
}

/**
 * Enviar email de boas-vindas via Brevo
 */
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

/**
 * Extrair user_id e coupon_id do custom_id
 * Formatos suportados:
 * - "user_id__coupon_id" (com cupom)
 * - "user_id" (sem cupom)
 */
function parseCustomId(customId: string): {
  userId: string;
  couponId: string | null;
} {
  if (!customId) {
    return { userId: "", couponId: null };
  }

  const parts = customId.split("__");
  return {
    userId: parts[0],
    couponId: parts.length > 1 ? parts[1] : null,
  };
}

/**
 * Processar uma transação pendente
 */
async function processTransaction(
  transaction: TransactionRecord,
  supabaseAdmin: ReturnType<typeof createClient>,
  accessToken: string
): Promise<boolean> {
  const { id: txnId, user_id: userId, txid, plan_type } = transaction;

  try {
    console.log(`\n📋 Processando transação: ${txnId}`);
    console.log(`   User: ${userId}, Plan: ${plan_type}`);

    // 1. Extrair charge_id do txid
    // txid é o formato da Efí que começa com "SF"
    if (!txid) {
      console.log(`   ⚠️  txid vazio, pulando`);
      return false;
    }

    // Se txid é um charge_id direto, usar como está
    // Senão extrair o ID da cobrança
    const chargeId = txid.includes("-") ? txid.split("-")[0] : txid;

    // 2. Buscar status na Efí
    const chargeData = await getEfiChargeStatus(chargeId, accessToken);
    if (!chargeData) {
      console.log(`   ⚠️  Não conseguiu buscar dados da Efí, pulando`);
      return false;
    }

    // 3. Extrair status
    const statusRaw = chargeData.status;
    const status =
      typeof statusRaw === "object" ? statusRaw?.current : statusRaw;
    const statusLower = (status || "").toString().toLowerCase();
    const value = chargeData.value || 0;

    console.log(`   Status na Efí: ${statusLower}, Valor: ${value}`);

    // 4. Verificar se foi pago
    const paidStatuses = [
      "paid",
      "active",
      "settled",
      "approved",
      "identified",
    ];
    const isPaid = paidStatuses.includes(statusLower);

    if (!isPaid) {
      console.log(`   ⏳ Não foi pago ainda (status: ${statusLower})`);
      return false;
    }

    console.log(`   ✅ Status confirmado como pago!`);

    // 5. Extrair custom_id para obter coupon
    const customId = chargeData.custom_id || "";
    const { couponId } = parseCustomId(customId);

    // 6. Determinar tipo de plano
    // Se foi registrado como "monthly" ou "lifetime" no transactions, usar isso
    // Caso contrário, usar a heurística do valor
    const isVitalicio = plan_type === "lifetime";

    // 7. Atualizar transação como "completed"
    const { error: txnError } = await supabaseAdmin
      .from("transactions")
      .update({ status: "completed" })
      .eq("id", txnId);

    if (txnError) {
      console.error(`   ❌ Erro ao atualizar transação: ${txnError.message}`);
      return false;
    }

    console.log(`   ✅ Transação marcada como completed`);

    // 8. Verificar se usuário já está ativo (idempotência)
    const { data: currentSettings } = await supabaseAdmin
      .from("user_settings")
      .select("subscription_status")
      .eq("user_id", userId)
      .single();

    if (currentSettings?.subscription_status === "active") {
      console.log(
        `   ℹ️  Usuário já ativo, pulando atualização (já processado pelo webhook)`
      );
      return true; // Retorna true pois a transação foi completada
    }

    // 9. Atualizar user_settings com nova subscription
    const updateData: any = {
      subscription_status: "active",
      subscription_type: isVitalicio ? "lifetime" : "monthly",
    };

    if (!isVitalicio) {
      // Plano mensal: definir data de vencimento (+30 dias)
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);
      updateData.subscription_end_date = subscriptionEndDate.toISOString();
    } else {
      // Plano vitalício: sem data de vencimento
      updateData.subscription_end_date = null;
    }

    const { error: settingsError } = await supabaseAdmin
      .from("user_settings")
      .update(updateData)
      .eq("user_id", userId);

    if (settingsError) {
      console.error(
        `   ❌ Erro ao atualizar user_settings: ${settingsError.message}`
      );
      return false;
    }

    console.log(
      `   ✅ Subscription ativada (${isVitalicio ? "lifetime" : "monthly"})`
    );

    // 10. Registrar uso do cupom se houver
    if (couponId) {
      const { error: couponError } = await supabaseAdmin
        .from("coupon_uses")
        .insert({
          coupon_id: couponId,
          user_id: userId,
          used_at: new Date().toISOString(),
        });

      if (couponError) {
        console.warn(
          `   ⚠️  Erro ao registrar uso do cupom: ${couponError.message}`
        );
      } else {
        console.log(`   ✅ Uso do cupom registrado: ${couponId}`);
      }
    }

    // 11. Buscar dados do usuário e enviar email de boas-vindas
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
      userId
    );

    if (userData?.user?.email) {
      const userName =
        userData.user.user_metadata?.full_name ||
        userData.user.user_metadata?.name ||
        "Estudante";
      await sendWelcomeEmail(userData.user.email, userName);
    }

    console.log(`   ✅ TRANSAÇÃO PROCESSADA COM SUCESSO`);
    return true;
  } catch (error) {
    console.error(`   ❌ Exceção ao processar transação:`, error);
    return false;
  }
}

/**
 * Handler principal - Cron Job
 */
serve(async (req) => {
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log("🔄 [CRON JOB] EFI Polling Safety iniciado");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );

  try {
    // 1. Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SB_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("❌ Variáveis de ambiente Supabase não configuradas");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Supabase não configurado",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 2. Obter token de acesso da Efí
    const accessToken = await getEfiAccessToken();
    if (!accessToken) {
      console.error("❌ Falha ao obter token de acesso da Efí");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Token Efí indisponível",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Token Efí obtido com sucesso");

    // 3. Buscar transações pendentes criadas há >10 minutos
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: pendingTransactions, error: queryError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("status", "pending")
      .lt("created_at", tenMinutesAgo)
      .order("created_at", { ascending: true });

    if (queryError) {
      console.error("❌ Erro ao buscar transações:", queryError.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Erro ao buscar transações",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const transactions = (pendingTransactions || []) as TransactionRecord[];
    console.log(`\n📊 Total de transações pendentes: ${transactions.length}`);

    if (transactions.length === 0) {
      console.log("✅ Nenhuma transação pendente encontrada");
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: "Nenhuma transação pendente",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Processar cada transação
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const transaction of transactions) {
      const result = await processTransaction(
        transaction,
        supabaseAdmin,
        accessToken
      );

      if (result) {
        successCount++;
      } else {
        // Neste caso, a transação pode ter sido pulada (ainda não paga) ou falhou
        // Para não reprocessar, contamos como skip
        skipCount++;
      }
    }

    console.log(
      "\n═══════════════════════════════════════════════════════════════"
    );
    console.log("📈 RESUMO DA EXECUÇÃO:");
    console.log(`   ✅ Processadas: ${successCount}`);
    console.log(`   ⏳ Puladas: ${skipCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(
      "═══════════════════════════════════════════════════════════════\n"
    );

    return new Response(
      JSON.stringify({
        success: true,
        processed: successCount,
        skipped: skipCount,
        errors: errorCount,
        total: transactions.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Erro crítico no cron job:", error);
    // Sempre retornar 200 para não causar retry infinito
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
});
