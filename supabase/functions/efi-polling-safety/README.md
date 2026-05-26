# EFI Polling Safety - Cron Job

## Descrição

Edge Function Supabase que roda a cada hora (cron job) para validar boletos e cartões de crédito que foram pagos mas não foram processados pelo webhook.

Funciona como um mecanismo de **segurança e redundância** para garantir que nenhuma transação seja perdida, mesmo que o webhook falhe ou o servidor esteja indisponível.

## Como Funciona

### Fluxo de Processamento

```
1. [A cada hora] Cron job inicia execução
2. Lista transações com status="pending" criadas há >10 minutos
3. Para cada transação:
   a. Chama GET /v1/charge/{charge_id} na API da Efí
   b. Se status na Efí for "paid"/"approved" E transação.status for "pending":
      - Atualiza transactions.status = "completed"
      - Ativa subscription do usuário (user_settings)
      - Registra uso de coupon (se houver)
      - Envia email de boas-vindas
   c. Se já foi processado pelo webhook, pula (idempotência)
4. Retorna resumo da execução (200 OK sempre)
```

### Proteção contra Duplicação

A função trata idempotência verificando se `user_settings.subscription_status` já é "active". Se for:

- Não atualiza novamente
- Não envia email duplicado
- Apenas marca a transação como "completed"

## Requisitos de Configuração

### Variáveis de Ambiente

```env
EFI_CLIENT_ID=seu_client_id
EFI_CLIENT_SECRET=seu_client_secret
EFI_SANDBOX=true|false              # true para sandbox, false para produção
SUPABASE_URL=https://seu-projeto.supabase.co
SB_SERVICE_ROLE_KEY=sua_service_role_key
BREVO_API_KEY=sua_brevo_api_key      # Opcional: para envio de emails
```

### Banco de Dados

A função espera as seguintes tabelas:

#### `transactions`

```sql
- id (uuid)
- user_id (uuid, FK auth.users)
- txid (text, UNIQUE)
- amount (numeric)
- plan_type (text: 'monthly' | 'lifetime')
- status (text: 'pending' | 'completed' | 'cancelled' | 'expired')
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `user_settings`

```sql
- user_id (uuid, PK)
- subscription_status (text: 'none' | 'active')
- subscription_type (text: 'free' | 'monthly' | 'lifetime')
- subscription_end_date (timestamptz, nullable)
- ... outros campos
```

#### `coupon_uses` (se usar cupons)

```sql
- coupon_id (text)
- user_id (uuid)
- used_at (timestamptz)
```

## Detalhe: Extração do `user_id`

O `custom_id` pode estar em dois formatos:

1. **Com cupom**: `user_id__coupon_id`

   ```
   exemplo: "f47ac10b-58cc-4372-a567-0e02b2c3d479__SUMMER2025"
   ```

2. **Sem cupom**: `user_id`
   ```
   exemplo: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
   ```

A função usa `parseCustomId()` para extrair ambos corretamente.

## Detalhe: Determinação do Tipo de Plano

O tipo de plano é determinado pelo campo `plan_type` da transação, que é salvo no momento da criação:

- **"lifetime"**: Sem data de vencimento (`subscription_end_date = NULL`)
- **"monthly"**: Com vencimento em +30 dias

## Tratamento de Erros

A função **SEMPRE** retorna status HTTP `200 OK`, mesmo em caso de erro, para:

1. Evitar retentas infinitas do Supabase
2. Permitir que a execução seja rastreada via logs
3. Manter a disponibilidade do sistema

Todos os erros são logados com emoji indicador:

- ✅ Sucesso
- ⚠️ Aviso
- ❌ Erro
- ℹ️ Informação
- ⏳ Aguardando

## Logs da Execução

A função produz logs estruturados:

```
═══════════════════════════════════════════════════════════════
🔄 [CRON JOB] EFI Polling Safety iniciado
═══════════════════════════════════════════════════════════════
✅ Token Efí obtido com sucesso
📊 Total de transações pendentes: 5

📋 Processando transação: txn-id-1
   User: user-id-1, Plan: lifetime
   Status na Efí: paid, Valor: 99900
   ✅ Status confirmado como pago!
   ✅ Transação marcada como completed
   ✅ Subscription ativada (lifetime)
   ✅ Email de boas-vindas enviado para: user@example.com
   ✅ TRANSAÇÃO PROCESSADA COM SUCESSO

... mais transações ...

═══════════════════════════════════════════════════════════════
📈 RESUMO DA EXECUÇÃO:
   ✅ Processadas: 3
   ⏳ Puladas: 2
   ❌ Erros: 0
═══════════════════════════════════════════════════════════════
```

## Configuração do Cron Job

No arquivo `supabase/config.toml`:

```toml
[functions.efi-polling-safety]
enabled = true
verify_jwt = false
entrypoint = "./functions/efi-polling-safety/index.ts"
import_map = "./functions/efi-polling-safety/deno.json"
```

Para agendar no dashboard Supabase:

1. Vá para **Edge Functions** → **efi-polling-safety**
2. Clique em **Schedules**
3. Crie um novo agendamento:
   - **Cron Expression**: `0 * * * *` (a cada hora, minuto 0)
   - **Name**: `Hourly Polling`
   - **Enable**: Ativado

**Formato Cron**:

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── dia do mês (1 - 31)
│ │ │ ┌───────────── mês (1 - 12)
│ │ │ │ ┌───────────── dia da semana (0 - 6) (0 = domingo)
│ │ │ │ │
│ │ │ │ │
0 * * * *
```

Exemplos:

- `0 * * * *` = A cada hora (minuto 0)
- `0 */2 * * *` = A cada 2 horas
- `0 0 * * *` = Uma vez por dia (00:00)
- `*/5 * * * *` = A cada 5 minutos

## Rotas de Teste Manual

Se precisar testar a função manualmente:

```bash
# Sem cron job (teste local)
curl -X POST https://seu-projeto.supabase.co/functions/v1/efi-polling-safety \
  -H "Authorization: Bearer seu_token" \
  -H "Content-Type: application/json"
```

Resposta esperada:

```json
{
  "success": true,
  "processed": 3,
  "skipped": 2,
  "errors": 0,
  "total": 5
}
```

## Monitoramento

Para monitorar a função em produção:

1. **Dashboard Supabase**:

   - Vá para **Edge Functions** → **efi-polling-safety**
   - Veja **Invocations** e **Logs**

2. **Alertas** (configure no seu sistema):
   - Monitorar `errors` > 0
   - Alertar se `processed` = 0 por 3 execuções seguidas
   - Rastrear taxa de sucesso

## Performance

- **Tempo estimado por transação**: 500ms - 2s (incluindo chamada HTTP para Efí)
- **Máximo de transações por execução**: Ilimitado, mas recomenda-se testar com 100+
- **Timeout padrão**: 60 segundos (suficiente para ~30 transações)

## Segurança

✅ **Implementado**:

- Autenticação OAuth com Efí via Bearer Token
- Service Role Key do Supabase (não expõe dados públicos)
- Sem JWT verification (é um cron job interno)
- Idempotência garantida
- Logs estruturados sem dados sensíveis

⚠️ **Considerações**:

- Não exponha `SB_SERVICE_ROLE_KEY` em logs
- Use `HTTPS` em todas as chamadas de API
- Configure rate limiting na Efí se necessário

## Troubleshooting

### "Credenciais Efí não configuradas"

- Verifique `EFI_CLIENT_ID` e `EFI_CLIENT_SECRET` no dashboard Supabase

### "Token Efí indisponível"

- Verifique conectividade com `cobrancas.api.efipay.com.br`
- Verifique se as credenciais estão corretas
- Considere aumentar timeout

### "Erro ao buscar transações"

- Verifique RLS policies em `transactions` table
- Confirme que `SB_SERVICE_ROLE_KEY` tem permissão total

### "Nenhuma transação processada mesmo com pendentes"

- Verifique se transações foram criadas há >10 minutos
- Confirme formato do `txid`
- Verifique logs de erro na chamada da Efí

## Roadmap

- [ ] Retry automático para transações com erro
- [ ] Notificação ao usuário se pagamento for cancelado
- [ ] Webhook alternativo via Telegram para alertas críticos
- [ ] Dashboard de status de polling
- [ ] Otimização com batch requests à Efí (se API suportar)

## Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/functions/schedule-functions)
- [Documentação Efí Bank API](https://dev.gerencianet.com.br/)
- [Deno Runtime](https://deno.land)
