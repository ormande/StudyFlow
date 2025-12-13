# Configuração do Sentry - StudyFlow

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Sentry - Monitoramento de Erros (Opcional - apenas produção)
# Obtenha sua DSN em: https://sentry.io/settings/[seu-projeto]/keys/
# Deixe vazio ou não defina para desabilitar o Sentry
VITE_SENTRY_DSN=https://sua-dsn-aqui@sentry.io/seu-projeto-id
```

## Como Obter a DSN do Sentry

1. Acesse https://sentry.io e faça login
2. Crie um novo projeto (ou selecione um existente)
3. Escolha "React" como plataforma
4. Copie a DSN mostrada na página de configuração
5. Cole no arquivo `.env.local`

## Configurações Aplicadas

- ✅ **Apenas em Produção**: O Sentry só é carregado quando `import.meta.env.PROD === true`
- ✅ **Performance Monitoring**: 10% das transações são rastreadas (`tracesSampleRate: 0.1`)
- ✅ **Session Replay**: 
  - 10% das sessões normais são gravadas
  - 100% das sessões com erros são gravadas
- ✅ **Error Boundary**: Captura erros não tratados do React
- ✅ **Privacidade**: Todos os textos são mascarados no replay por padrão

## Importante

- O arquivo `.env.local` não deve ser commitado no git (já está no .gitignore)
- O Sentry **NÃO** funciona em desenvolvimento (`npm run dev`)
- O Sentry **SOMENTE** funciona após build de produção (`npm run build`)
