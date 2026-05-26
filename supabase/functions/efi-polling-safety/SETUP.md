# Setup - EFI Polling Safety

## 📋 Pré-requisitos

1. **Supabase Project** já criado
2. **Efí Bank Account** (sandbox ou produção)
3. **Credenciais Efí**:
   - `EFI_CLIENT_ID`
   - `EFI_CLIENT_SECRET`
4. **Brevo Account** (opcional, para emails de boas-vindas)

## 🚀 Instalação Passo a Passo

### 1. Adicionar Variáveis de Ambiente

No **Dashboard Supabase**:

1. Vá para **Settings** → **Environment variables**
2. Clique em **Add new variable**
3. Adicione cada uma:

| Variável            | Valor             | Descrição                                |
| ------------------- | ----------------- | ---------------------------------------- |
| `EFI_CLIENT_ID`     | Seu Client ID     | Do painel Efí                            |
| `EFI_CLIENT_SECRET` | Seu Client Secret | Do painel Efí                            |
| `EFI_SANDBOX`       | `true` ou `false` | Sandbox para testes, false para produção |
| `BREVO_API_KEY`     | Seu API Key       | Opcional, para envio de emails           |

**Importante**: Clique em **Save** após adicionar cada variável.

### 2. Verificar Banco de Dados

Confirme que as tabelas existem:

```sql
-- Verificar tabela transactions
SELECT * FROM information_schema.tables
WHERE table_name = 'transactions';

-- Verificar tabela user_settings
SELECT * FROM information_schema.tables
WHERE table_name = 'user_settings';

-- Verificar tabela coupon_uses (opcional)
SELECT * FROM information_schema.tables
WHERE table_name = 'coupon_uses';
```

Se faltar alguma tabela, execute as migrations em `supabase_migrations/`.

### 3. Configurar RLS (Row Level Security)

No **SQL Editor** do Supabase:

```sql
-- Permitir que service_role acesse transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do everything"
  ON public.transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Permitir que service_role acesse user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can update subscriptions"
  ON public.user_settings
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Se usar coupon_uses
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert"
  ON public.coupon_uses
  FOR INSERT
  TO service_role
  WITH CHECK (true);
```

### 4. Deploying a Função

#### Opção A: Via CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link ao projeto
supabase link --project-ref seu_project_ref

# 4. Deploy da função
supabase functions deploy efi-polling-safety

# 5. Verificar deployment
supabase functions list
```

#### Opção B: Via Dashboard Supabase

1. Vá para **Edge Functions**
2. Clique em **Create a new function**
3. Nome: `efi-polling-safety`
4. Cole o código do arquivo `index.ts`
5. Clique em **Deploy**

### 5. Agendar o Cron Job

No **Dashboard Supabase**:

1. Vá para **Edge Functions** → **efi-polling-safety**
2. Clique na aba **Schedules**
3. Clique em **Create schedule**
4. Preencha:
   - **Name**: `Hourly EFI Polling`
   - **Cron expression**: `0 * * * *` (a cada hora)
   - **Enable function**: Ativado ✓
5. Clique em **Save**

**Formato Cron**:

```
0    *    *    *    *
│    │    │    │    │
│    │    │    │    └─ Dia da semana (0-6, 0=dom)
│    │    │    └────── Mês (1-12)
│    │    └─────────── Dia do mês (1-31)
│    └──────────────── Hora (0-23)
└─────────────────── Minuto (0-59)

Exemplos:
0 * * * *     = A cada hora
0 */2 * * *   = A cada 2 horas
0 0 * * *     = Diariamente às 00:00
0 6 * * MON   = Segunda-feira às 06:00
```

## ✅ Verificação Pós-Setup

### 1. Testar Função Manual

```bash
# Via cURL
curl -X POST https://seu-projeto.supabase.co/functions/v1/efi-polling-safety \
  -H "Authorization: Bearer sua_anon_key" \
  -H "Content-Type: application/json"

# Resposta esperada (200 OK):
{
  "success": true,
  "processed": 0,
  "skipped": 0,
  "errors": 0,
  "total": 0,
  "message": "Nenhuma transação pendente"
}
```

### 2. Criar Transação de Teste

```sql
-- Obter um user_id
SELECT id FROM auth.users LIMIT 1;

-- Criar transação pendente (substitua USER_ID)
INSERT INTO public.transactions (user_id, txid, amount, plan_type, status)
VALUES (
  'USER_ID',
  'test-' || NOW()::text,
  99.90,
  'lifetime',
  'pending'
);
```

### 3. Executar Função de Teste

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/efi-polling-safety \
  -H "Authorization: Bearer sua_anon_key"

# Resposta deve mostrar a transação
```

### 4. Verificar Logs

No **Dashboard Supabase**:

1. Vá para **Edge Functions** → **efi-polling-safety**
2. Aba **Logs**
3. Procure pela última execução

Deve aparecer algo como:

```
🔄 [CRON JOB] EFI Polling Safety iniciado
✅ Token Efí obtido com sucesso
📊 Total de transações pendentes: 1
```

## 🔍 Troubleshooting

### Erro: "Credenciais Efí não configuradas"

**Causa**: Variáveis de ambiente não salvas

**Solução**:

1. Vá para **Settings** → **Environment variables**
2. Confirme que `EFI_CLIENT_ID` e `EFI_CLIENT_SECRET` existem
3. Clique em **Save** após adicionar
4. Espere ~30 segundos para propagação
5. Tente novamente

### Erro: "Token Efí indisponível"

**Causa**: Credenciais inválidas ou API da Efí indisponível

**Solução**:

1. Verifique credenciais no painel Efí
2. Confirme se está usando sandbox/produção correto
3. Teste credenciais com cURL:
   ```bash
   curl -X POST https://cobrancas-h.api.efipay.com.br/v1/authorize \
     -H "Authorization: Basic $(echo -n 'CLIENT_ID:CLIENT_SECRET' | base64)" \
     -H "Content-Type: application/json" \
     -d '{"grant_type":"client_credentials"}'
   ```

### Erro: "Erro ao buscar transações"

**Causa**: RLS policies não configuradas

**Solução**:

1. Execute o SQL de RLS do passo 3 acima
2. Confirme que `transactions` tem a policy para `service_role`
3. Teste query:
   ```sql
   SET session.user = '';
   SELECT * FROM public.transactions LIMIT 1;
   ```

### Cron Job não executando

**Causa**: Schedule não criado ou desativado

**Solução**:

1. Vá para **Edge Functions** → **efi-polling-safety**
2. Aba **Schedules**
3. Confirme que existe uma schedule com status "Enabled"
4. Teste manualmente via cURL (veja acima)
5. Se manual funciona, aguarde próxima execução agendada

### Função muito lenta

**Causa**: Muitas transações ou timeout de API

**Solução**:

1. Aumentar timeout em `config.toml` (se suportado)
2. Processar em lotes menores
3. Otimizar query do banco de dados
4. Contatar Efí sobre rate limiting

## 📊 Monitoramento Contínuo

### Configurar Alertas

**No Supabase Dashboard**:

1. **Settings** → **Integrations**
2. Adicione seu webhook favorito (Slack, Discord, etc.)
3. Configure para alertar sobre:
   - Função com 5+ invocações falhando consecutivamente
   - Taxa de erro > 10%

**Script Python de Monitoramento** (opcional):

```python
import requests
import schedule
import time
from datetime import datetime

def check_polling_status():
    response = requests.post(
        'https://seu-projeto.supabase.co/functions/v1/efi-polling-safety',
        headers={'Authorization': 'Bearer sua_anon_key'}
    )

    result = response.json()
    timestamp = datetime.now().isoformat()

    # Log em arquivo
    with open('polling_monitor.log', 'a') as f:
        f.write(f"{timestamp} - {result}\n")

    # Alertar se muitos erros
    if result.get('errors', 0) > 0:
        print(f"⚠️ ALERTA: {result['errors']} erros detectados!")

# Executar a cada 30 minutos
schedule.every(30).minutes.do(check_polling_status)

while True:
    schedule.run_pending()
    time.sleep(60)
```

## 🎯 Próximos Passos

1. ✅ Setup inicial concluído
2. ⏳ Aguarde primeira execução do cron job (próxima hora cheia)
3. 📊 Monitore logs nos primeiros dias
4. 🔧 Ajuste schedule se necessário (a cada 30 min, etc.)
5. 📈 Acompanhe taxa de sucesso em dashboard

## 💬 Suporte

Se encontrar problemas:

1. Verifique os **Logs** da função no dashboard
2. Teste manualmente com cURL (veja acima)
3. Verifique **RLS policies** no banco de dados
4. Contate suporte da Efí para validar credenciais

## 📝 Checklist Final

- [ ] Variáveis de ambiente adicionadas e salvas
- [ ] Tabelas `transactions`, `user_settings`, `coupon_uses` existem
- [ ] RLS policies configuradas
- [ ] Função deployada
- [ ] Schedule criada e ativada
- [ ] Teste manual executado com sucesso
- [ ] Logs aparecem no dashboard
- [ ] Cron job já executou pelo menos uma vez

Parabéns! 🎉 Seu sistema de polling seguro está ativo!
