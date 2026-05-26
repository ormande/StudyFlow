# INTEGRAÇÃO - EFI Polling Safety com StudyFlow

## 📌 Visão Geral

A função `efi-polling-safety` trabalha **complementarmente** com o webhook `efi-webhook` existente. Ambas compartilham:

- Mesma lógica de ativação de usuário
- Mesmas tabelas de banco de dados
- Mesmas credenciais Efí
- Mesmo tratamento de cupons e emails

## 🔗 Fluxo de Integração

```
┌─────────────────────────────────────────────────────────────┐
│ Usuário paga boleto/cartão na Efí                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
  ┌────────────────┐                 ┌─────────────────┐
  │ WEBHOOK        │                 │ POLLING         │
  │ (em tempo real)│                 │ (a cada hora)   │
  │                │                 │                 │
  │ Pode falhar:   │                 │ Recupera:       │
  │ - timeout      │                 │ - webhook falhou│
  │ - servidor down│                 │ - timeout       │
  │ - rede         │                 │ - desconectado  │
  └───────┬────────┘                 └────────┬────────┘
          │                                   │
          ↓                                   ↓
  ┌─────────────────────────────────────────────────┐
  │ Atualiza:                                       │
  │ - transactions.status = "completed"             │
  │ - user_settings.subscription_status = "active"  │
  │ - user_settings.subscription_type = ...         │
  │ - user_settings.subscription_end_date = ...     │
  │ - registra coupon_uses                          │
  │ - envia email de boas-vindas                    │
  └─────────────────────────────────────────────────┘
          ↓
  ┌─────────────────────────────────────────────────┐
  │ Usuário com acesso ativado ao StudyFlow         │
  └─────────────────────────────────────────────────┘
```

## 🔄 Comparação: Webhook vs Polling

| Aspecto            | Webhook                           | Polling                    |
| ------------------ | --------------------------------- | -------------------------- |
| **Ativação**       | Imediata (segundos)               | Cada hora                  |
| **Confiabilidade** | Pode falhar                       | Redundância                |
| **Causa**          | Notificação da Efí                | Recuperação                |
| **Idempotência**   | Verifica status de usuário        | Verifica status de usuário |
| **Email**          | Pode duplicar se webhook envia 2x | Protege contra duplicação  |
| **Quando usar**    | Principal                         | Fallback                   |

## 🗄️ Banco de Dados - Estrutura Integrada

### Tabelas Existentes (UseCom)

#### `auth.users`

```sql
- id (uuid, PK)
- email (text)
- created_at (timestamptz)
- user_metadata (jsonb) -- contém: full_name, name
```

#### `public.user_settings`

```sql
- user_id (uuid, FK auth.users, PK)
- subscription_status (text) -- 'none' | 'active'
- subscription_type (text) -- 'free' | 'monthly' | 'lifetime'
- subscription_end_date (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `public.transactions`

```sql
- id (uuid, PK)
- user_id (uuid, FK auth.users)
- txid (text, UNIQUE) -- ID na Efí
- amount (numeric) -- valor em reais
- plan_type (text) -- 'monthly' | 'lifetime'
- status (text) -- 'pending' | 'completed' | 'cancelled' | 'expired'
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `public.coupon_uses` (opcional)

```sql
- coupon_id (text, PK)
- user_id (uuid, FK auth.users, PK)
- used_at (timestamptz)
```

## 🔐 RLS (Row Level Security)

Verificar que as policies existem para `transactions`:

```sql
-- Ver policies existentes
SELECT * FROM pg_policies
WHERE tablename = 'transactions';

-- Se não existirem, criar:
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do everything"
  ON public.transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

## 🔑 Variáveis de Ambiente Compartilhadas

Ambas as funções (`efi-webhook` e `efi-polling-safety`) usam:

```
EFI_CLIENT_ID
EFI_CLIENT_SECRET
EFI_SANDBOX
SUPABASE_URL
SB_SERVICE_ROLE_KEY
BREVO_API_KEY
```

**Configurar uma vez** no dashboard Supabase e ambas terão acesso.

## 🧩 Código Reutilizável

### Função de Envio de Email

Ambas as funções implementam (idempotentemente):

```typescript
async function sendWelcomeEmail(email: string, name: string) {
  // Mesmo código em efi-webhook.ts e efi-polling-safety.ts
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  // ... envio via Brevo
}
```

### Função de Obtenção de Token

```typescript
async function getEfiAccessToken(): Promise<string | null> {
  // Mesmo código em efi-webhook.ts e efi-polling-safety.ts
  const clientId = Deno.env.get("EFI_CLIENT_ID");
  const clientSecret = Deno.env.get("EFI_CLIENT_SECRET");
  // ... obtenção de token OAuth
}
```

### Lógica de Ativação

```typescript
// Ambas fazem:
1. Obter status na Efí
2. Se "paid" ou "approved":
   - Atualizar transactions.status = "completed"
   - Atualizar user_settings (subscription)
   - Registrar coupon se houver
   - Enviar email
3. Se já está ativo: pular (idempotência)
```

## 🚦 Fluxo de Execução Combinado

### Cenário 1: Webhook Sucesso + Polling Verifica

```
T00: Webhook recebe notificação
T00: Webhook ativa usuário ✅
T01: Polling executa (próxima hora)
T01: Polling verifica user_settings.subscription_status = "active"
T01: Polling pula atualização (já feito)
T01: Resultado: sem duplicação ✅
```

### Cenário 2: Webhook Falha + Polling Recupera

```
T00: Webhook tenta processar
T00: API da Efí indisponível ❌
T00: Usuário continua "pending"
T01: Polling executa (próxima hora)
T01: Polling conecta com Efí com sucesso ✅
T01: Polling ativa usuário ✅
T01: Resultado: transação não perdida ✅
```

### Cenário 3: Race Condition (Webhook + Polling simultâneos)

```
T00:00: Webhook recebe notificação
T00:00: Polling também executa (coincidência)
T00:00: Ambas buscam status na Efí: "paid"
T00:00: Webhook atualiza user_settings PRIMEIRO
T00:00: Polling verifica status: já está "active"
T00:00: Polling pula atualização
T00:00: Resultado: sem duplicação ✅
```

## 📊 Monitoramento Integrado

### Dashboard Supabase (Único)

1. **Edge Functions → efi-webhook**

   - Ver invocações
   - Ver logs
   - Status em tempo real

2. **Edge Functions → efi-polling-safety**
   - Ver execuções agendadas
   - Ver logs de cada hora
   - Status do cron job

### Alertas Recomendados

```
SE webhook.errors > 0 POR 1 HORA:
  → Ativar polling com mais frequência (a cada 30 min)

SE polling.processed > 0:
  → Log: "Webhook falhou, polling recuperou X transações"

SE polling.errors > 3 CONSECUTIVOS:
  → Alertar admin (pode ser problema de integração)
```

## 🔧 Manutenção

### Atualizar Webhook

Se modificar a lógica de ativação em `efi-webhook`, **aplicar mesma mudança** em `efi-polling-safety`:

```
Exemplo: Adicionar novo campo em user_settings
├── efi-webhook.ts (update updateData)
└── efi-polling-safety.ts (update updateData) ← NÃO ESQUECER!
```

### Teste de Integração Completa

```sql
-- 1. Criar usuário de teste
SELECT id FROM auth.users LIMIT 1; -- copiar id

-- 2. Criar transação pendente
INSERT INTO public.transactions (user_id, txid, amount, plan_type)
VALUES ('seu_user_id', 'test-' || NOW(), 99.90, 'lifetime');

-- 3. Simular webhook executando
UPDATE public.user_settings
SET subscription_status = 'active', subscription_type = 'lifetime'
WHERE user_id = 'seu_user_id';

-- 4. Verificar idempotência
-- Polling executará e verá que já está ativo
-- Resultado: transação completada, sem email duplicado
```

## 🚀 Deployment Coordenado

### Primeira Vez (Setup)

```bash
# 1. Deploy webhook (já existe)
supabase functions deploy efi-webhook

# 2. Deploy polling (novo)
supabase functions deploy efi-polling-safety

# 3. Criar schedule para polling
# Dashboard: Edge Functions → efi-polling-safety → Create Schedule
# Cron: 0 * * * *
```

### Atualizar Ambas

```bash
# Se modificar lógica comum:

# 1. Deploy webhook
supabase functions deploy efi-webhook

# 2. Deploy polling
supabase functions deploy efi-polling-safety

# 3. Verificar no dashboard que ambas estão atualizadas
```

## 📈 Escalabilidade Futura

### Se tráfego crescer:

1. **Aumentar frequência de polling**:

   ```
   Atual: 0 * * * * (a cada hora)
   Proposto: 0 */30 * * * (a cada 30 minutos)
   ```

2. **Paralelizar requisições**:

   ```
   Modificar polling para processar 10 transações simultâneas
   em vez de sequencialmente
   ```

3. **Cache de tokens**:

   ```
   Store token com TTL e reutilizar na mesma execução
   ```

4. **Batch requests à Efí** (se API suportar):
   ```
   GET /v1/charges?ids=id1,id2,id3 (em vez de 3 requests)
   ```

## 🎯 Checklist de Integração

- [ ] `config.toml` atualizado com `[functions.efi-polling-safety]`
- [ ] Variáveis de ambiente configuradas (compartilhadas)
- [ ] RLS policies verificadas em `transactions`
- [ ] `efi-polling-safety` deployado
- [ ] Schedule criado no dashboard
- [ ] Teste manual executado
- [ ] Logs aparecem a cada hora
- [ ] Sem erros ou warnings nos primeiros 24h
- [ ] Idempotência validada (teste de cenário 1 acima)
- [ ] Documentação atualizada no projeto
- [ ] Time informado sobre nova funcionalidade

## 📝 Notas para DevOps / Admin

### Monitoramento Diário

```bash
# Ver status atual das funções
curl https://seu-projeto.supabase.co/functions/v1/efi-polling-safety

# Verificar logs no dashboard
# Dashboard → Edge Functions → Logs

# Se muitos erros:
# 1. Verificar credenciais Efí
# 2. Verificar conectividade com API
# 3. Verificar RLS policies
```

### Backup / Disaster Recovery

```sql
-- Backup de transações processadas
SELECT * FROM transactions WHERE status = 'completed'
ORDER BY updated_at DESC
LIMIT 100;

-- Verificar se há transações "penduradas" há >24h
SELECT * FROM transactions
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## 🆘 Troubleshooting Integrado

Se webhook funciona mas polling não:

1. Verificar RLS policies (pode ser específico)
2. Verificar se schedule foi criada
3. Rodar teste manual: `curl ... /efi-polling-safety`
4. Ver logs no dashboard

Se ambos falham:

1. Verificar variáveis de ambiente
2. Verificar credenciais Efí
3. Testar conectividade com API: `curl cobrancas.api.efipay.com.br`
4. Contatar suporte Efí

## 📚 Referências Cruzadas

- [efi-webhook.ts](./efi-webhook/index.ts) - Webhook principal
- [efi-create-charge.ts](./efi-create-charge/index.ts) - Criação de cobrança
- [transactions (migration)](../supabase_migrations/01_add_transactions.sql)
- [user_settings (migration)](../supabase_migrations/00_schema_completo_v1.sql)

---

**Status**: ✅ INTEGRAÇÃO COMPLETA

**Próximas Ações**:

1. Deploy da função
2. Criar schedule
3. Monitorar primeiras 24h
4. Ajustar conforme necessário
