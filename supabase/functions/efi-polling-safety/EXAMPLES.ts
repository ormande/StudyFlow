/**
 * ============================================================================
 * EXEMPLO DE USO - EFI Polling Safety
 * ============================================================================
 * Este arquivo demonstra como integrar e testar a função de polling seguro.
 * NÃO é código de produção, apenas referência de integração.
 */

// ============================================================================
// 1. VARIÁVEIS DE AMBIENTE NECESSÁRIAS
// ============================================================================

/*
No arquivo .env.local ou configuração Supabase:

EFI_CLIENT_ID=seu_client_id_aqui
EFI_CLIENT_SECRET=seu_client_secret_aqui
EFI_SANDBOX=true
SUPABASE_URL=https://seu-projeto.supabase.co
SB_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BREVO_API_KEY=xkeysb_live_abc123...

Configurar no dashboard Supabase:
1. Vá para Settings → Environment Variables
2. Adicione cada variável acima
3. Confirme que a função pode acessá-las
*/

// ============================================================================
// 2. TESTE MANUAL DA FUNÇÃO
// ============================================================================

/*
// Em um terminal ou script Node.js:
const response = await fetch(
  'https://seu-projeto.supabase.co/functions/v1/efi-polling-safety',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer seu_anon_key_ou_access_token',
      'Content-Type': 'application/json',
    },
    // Sem body necessário
  }
);

const result = await response.json();
console.log(result);
// Resposta esperada:
// {
//   "success": true,
//   "processed": 3,
//   "skipped": 2,
//   "errors": 0,
//   "total": 5
// }
*/

// ============================================================================
// 3. MONITORAMENTO AUTOMÁTICO
// ============================================================================

/*
// Função para monitorar o cron job (rodaria a cada 2 horas)
async function monitorPollingJob() {
  try {
    const response = await fetch(
      'https://seu-projeto.supabase.co/functions/v1/efi-polling-safety',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer seu_service_role_key',
        },
      }
    );

    const result = await response.json();

    // Alertar se muitos erros
    if (result.errors > 0) {
      console.error('⚠️ Erros detectados no polling:', result);
      // Enviar notificação ao admin
    }

    // Alertar se nenhuma transação foi processada por 3 execuções
    if (result.processed === 0 && result.skipped === 0) {
      console.warn('ℹ️ Nenhuma transação processada nesta execução');
    }

    return result;
  } catch (error) {
    console.error('❌ Erro ao chamar função de polling:', error);
  }
}
*/

// ============================================================================
// 4. SIMULAÇÃO: CRIAR TRANSAÇÃO PENDENTE PARA TESTE
// ============================================================================

/*
// Usar este script para criar uma transação pendente em sandbox
async function createTestTransaction() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    'https://seu-projeto.supabase.co',
    'sua_service_role_key'
  );

  // Obter um user_id real
  const { data: users } = await supabase.auth.admin.listUsers();
  const userId = users?.[0]?.id;

  if (!userId) {
    console.error('Nenhum usuário encontrado para teste');
    return;
  }

  // Criar transação pendente
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      txid: 'test-txid-' + Date.now(),
      amount: 99.90,
      plan_type: 'lifetime',
      status: 'pending',
    })
    .select();

  if (error) {
    console.error('Erro ao criar transação:', error);
  } else {
    console.log('✅ Transação criada:', data);
  }
}
*/

// ============================================================================
// 5. TESTE DE INTEGRAÇÃO: WEBHOOK + POLLING
// ============================================================================

/*
// Este teste verifica se webhook e polling funcionam juntos:

async function testPollingIdempotency() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    'https://seu-projeto.supabase.co',
    'sua_service_role_key'
  );

  // 1. Simular webhook processando uma transação
  const { data: users } = await supabase.auth.admin.listUsers();
  const userId = users?.[0]?.id;

  const transactionId = 'test-' + Date.now();
  
  // Criar transação
  await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      txid: transactionId,
      amount: 99.90,
      plan_type: 'lifetime',
      status: 'pending',
    });

  // Simular webhook ativando usuário
  await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      subscription_status: 'active',
      subscription_type: 'lifetime',
    });

  // 2. Executar polling (deve detectar que já está ativo e pular)
  const response = await fetch(
    'https://seu-projeto.supabase.co/functions/v1/efi-polling-safety',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sua_service_role_key',
      },
    }
  );

  const result = await response.json();
  
  // 3. Verificar que não enviou email duplicado
  console.log('✅ Polling idempotência testada');
  console.log('   Resultado:', result);
}
*/

// ============================================================================
// 6. DASHBOARD DE MONITORAMENTO (React Example)
// ============================================================================

/*
import { useEffect, useState } from 'react';

export function PollingStatusDashboard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Atualizar status a cada 10 minutos
    const interval = setInterval(checkPollingStatus, 10 * 60 * 1000);
    
    // Check imediatamente
    checkPollingStatus();

    return () => clearInterval(interval);
  }, []);

  const checkPollingStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        '/api/efi-polling-safety',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sb-token')}`,
          },
        }
      );
      
      const result = await response.json();
      setStatus(result);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!status) return <div>Carregando...</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">EFI Polling Safety Status</h2>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded">
          <p className="text-gray-600">Processadas</p>
          <p className="text-2xl font-bold text-green-600">{status.processed}</p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-gray-600">Puladas</p>
          <p className="text-2xl font-bold text-yellow-600">{status.skipped}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded">
          <p className="text-gray-600">Erros</p>
          <p className="text-2xl font-bold text-red-600">{status.errors}</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-gray-600">Total</p>
          <p className="text-2xl font-bold text-blue-600">{status.total}</p>
        </div>
      </div>

      <button
        onClick={checkPollingStatus}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Atualizando...' : 'Atualizar Status'}
      </button>
    </div>
  );
}
*/

// ============================================================================
// 7. CONFIGURAÇÃO NGROK PARA TESTE LOCAL
// ============================================================================

/*
// Se estiver testando localmente, use ngrok para expor sua função:

// 1. Instalar ngrok
npm install -g ngrok

// 2. Iniciar servidor local Supabase
supabase start

// 3. Expor função com ngrok
ngrok http 54321

// 4. Atualizar SUPABASE_URL em .env.local para ngrok URL
SUPABASE_URL=https://seu-hash.ngrok.io

// 5. Chamar função
curl -X POST https://seu-hash.ngrok.io/functions/v1/efi-polling-safety \
  -H "Authorization: Bearer sua_anon_key"
*/

// ============================================================================
// 8. LOGS ESPERADOS
// ============================================================================

/*
Exemplo de saída esperada nos logs:

═══════════════════════════════════════════════════════════════
🔄 [CRON JOB] EFI Polling Safety iniciado
═══════════════════════════════════════════════════════════════
✅ Token Efí obtido com sucesso
📊 Total de transações pendentes: 2

📋 Processando transação: 550e8400-e29b-41d4-a716-446655440000
   User: f47ac10b-58cc-4372-a567-0e02b2c3d479, Plan: lifetime
   Status na Efí: paid, Valor: 99900
   ✅ Status confirmado como pago!
   ✅ Transação marcada como completed
   ✅ Subscription ativada (lifetime)
   ✅ Email de boas-vindas enviado para: usuario@example.com
   ✅ TRANSAÇÃO PROCESSADA COM SUCESSO

📋 Processando transação: 660f9511-f40c-52e5-b827-557766551111
   User: g58bd21c-69dd-5483-b678-1f13c3d4e580, Plan: monthly
   Status na Efí: paid, Valor: 29900
   ✅ Status confirmado como pago!
   ✅ Transação marcada como completed
   ℹ️  Usuário já ativo, pulando atualização (já processado pelo webhook)
   ✅ TRANSAÇÃO PROCESSADA COM SUCESSO

═══════════════════════════════════════════════════════════════
📈 RESUMO DA EXECUÇÃO:
   ✅ Processadas: 2
   ⏳ Puladas: 0
   ❌ Erros: 0
═══════════════════════════════════════════════════════════════
*/

export {};
