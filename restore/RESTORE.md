# Restaurar StudyFlow após pausa do Supabase

Backup recebido: `db_cluster-27-01-2026@05-35-05.backup.gz`  
Tipo: **dump completo do cluster PostgreSQL** (não é só a tabela `public`).

## O que tem nesse backup (resumo)

| Conteúdo | Quantidade aproximada |
|----------|---------------------|
| Usuários (`auth.users`) | 9 contas (com senha hash — login pode voltar se auth for restaurado) |
| `user_settings` | 9 perfis / assinaturas |
| `subjects` | 7 matérias |
| `subtopics` | 2 subtópicos |
| `study_logs` | 1 registro de estudo |
| `user_xp` / `user_achievements` | poucos registros |
| `transactions` | várias transações PIX |
| `feedback` | alguns feedbacks |

Ou seja: o backup é **válido**, mas o volume de dados de estudo é pequeno (projeto ainda em fase inicial / poucos usuários ativos).

---

## Caminho recomendado (oficial Supabase)

1. No [Dashboard Supabase](https://supabase.com/dashboard), **crie um projeto novo** (como o suporte pediu).
2. Procure em **Project Settings → Database** (ou e-mail do suporte) a opção **Restore** / **Import backup** e envie o arquivo `.gz`.
3. Após restaurar, copie a nova **URL** e **anon key** para o `.env` do StudyFlow e da Vercel.
4. Atualize **Authentication → URL Configuration** com o domínio `getstudyflow.com.br`.
5. Reconfigure **Edge Functions secrets** (Efi, Brevo, etc.) no projeto novo.

Esse caminho restaura `auth`, `public`, RLS e extensões de uma vez — é o mais seguro.

Documentação: [Backups e restauração](https://supabase.com/docs/guides/platform/backups)

---

## Caminho manual (se o painel não aceitar o arquivo)

### 1. Extrair SQL do backup

Na raiz do projeto:

```bash
node restore/extract-backup.mjs
```

Isso gera `restore/output/`:

| Arquivo | Uso |
|---------|-----|
| `00-summary.json` | Contagem de linhas por tabela |
| `01-schema-public.sql` | Cria tabelas `public` |
| `02-data-public.sql` | Dados das tabelas do app |
| `03-data-auth.sql` | Usuários e identities (**sensível**) |

### 2. Novo projeto Supabase

1. Crie o projeto vazio.
2. No **SQL Editor**, execute na ordem:
   - `01-schema-public.sql` (se o schema novo estiver vazio)
   - Políticas RLS do repositório: `supabase_migrations/00_schema_completo_v1.sql` (parte RLS) e demais migrations, **ou** confira se o schema extraído já inclui RLS
   - `03-data-auth.sql` — **só se** a importação de `auth.users` for aceita no seu plano (muitas vezes o Supabase bloqueia ou exige suporte)
   - `02-data-public.sql`

### 3. Atualizar o app

```env
VITE_SUPABASE_URL=https://NOVO_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=nova_chave_anon
```

### 4. Storage (avatars)

O backup SQL **não inclui arquivos** do bucket `avatars`. Fotos antigas precisam ser reenviadas ou restauradas do Storage backup, se existir.

---

## Limitações importantes

- **Não rode o dump completo** (`db_cluster-*.backup`) direto no SQL Editor — ele inclui roles do cluster, `realtime`, etc., e vai falhar no Supabase gerenciado.
- **`03-data-auth.sql` contém hashes de senha** — não commite `restore/output/` no Git.
- Projeto pausado por inatividade: após restaurar, use plano **pago** ou mantenha o projeto ativo para não pausar de novo.

---

## Próximo passo com o agente no Cursor

Se você **autenticar o plugin Supabase MCP** e informar o ID do **projeto novo**, dá para validar tabelas e rodar checagens após a restauração. A restauração em si precisa ser feita no painel Supabase ou via `psql` com a connection string do projeto novo.
