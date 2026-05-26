# 🔒 Backup Manual - StudyFlow

Script para fazer backup do banco de dados Supabase.

## Configuração (apenas uma vez)

1. Abra `backup.js`
2. Substitua as credenciais:
   - `SUPABASE_URL` → Encontre em: Supabase → Project Settings → API → URL
   - `SUPABASE_SERVICE_ROLE_KEY` → Encontre em: Supabase → Project Settings → API → service_role (secret)

⚠️ **IMPORTANTE:** A Service Role Key tem acesso TOTAL ao banco. Nunca compartilhe!

## Como usar

```bash
cd backup-scripts
node backup.js
```

## Resultado

Cria uma pasta em `backups/backup-YYYY-MM-DDTHH-MM-SS/` com:
- Um arquivo `.json` para cada tabela
- `_summary.json` com resumo do backup

## Frequência recomendada

- Antes de qualquer alteração grande no banco
- Uma vez por semana (domingo à noite, por exemplo)
- Antes do lançamento

## Restaurar backup

Para restaurar, você precisaria inserir os dados manualmente via SQL Editor do Supabase ou criar um script de restore. Mas o mais importante é TER o backup!