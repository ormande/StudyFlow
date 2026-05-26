# StudyFlow 2 — variáveis de ambiente e conta vitalícia

## 1. Variáveis para o `.env` (frontend)

No [Dashboard Supabase](https://supabase.com/dashboard) → projeto **StudyFlow 2**:

**Project Settings → API**

| Variável no `.env` | Onde copiar no Supabase |
|--------------------|-------------------------|
| `VITE_SUPABASE_URL` | **Project URL** (ex.: `https://xxxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | **Project API keys** → `anon` / **publishable** (use uma chave ativa, `disabled` = false) |

Exemplo (valores fictícios — use os seus):

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Project ref** aparece na URL:  
`https://supabase.com/dashboard/project/SEU_PROJECT_REF`

Também atualize na **Vercel** (Environment Variables) se o app em produção for apontar para o projeto novo.

### Auth (obrigatório após projeto novo)

**Authentication → URL Configuration**

- Site URL: `https://getstudyflow.com.br` (ou `http://localhost:5173` em dev)
- Redirect URLs: `https://getstudyflow.com.br/**` e `http://localhost:5173/**`

---

## 2. Schema mínimo no projeto novo

No **SQL Editor**, execute nesta ordem:

1. `supabase_migrations/00_schema_completo_v1.sql`  
   (se der erro em `subtopics`, ignore a linha de DELETE em subtopics ou use o passo 2)
2. `restore/02-subtopics-compat.sql` (tabela `subtopics` + coluna em `study_logs`, como no backup)
3. `supabase_migrations/01_add_transactions.sql` (se ainda não existir `transactions`)

Ou, alternativa única: `restore/output/01-schema-public.sql` + políticas RLS do arquivo `00_schema_completo_v1.sql` (seção 2).

---

## 3. Só a sua conta vitalícia (sem restore Pro)

Conta no backup:

- E-mail: `playerone01kp@gmail.com`
- Plano: **lifetime** / **active**
- Nome: Kayke Paião

### Passo A — Criar login no projeto novo

1. Rode o app com o `.env` do StudyFlow 2 (`npm run dev`).
2. Cadastre-se de novo com **`playerone01kp@gmail.com`** e a **mesma senha** de antes (se lembrar).  
   Se não lembrar: use “Esqueci senha” depois do cadastro, ou crie senha nova no signup.

### Passo B — Ativar vitalício no SQL

**Authentication → Users** → copie o **User UID** (será um UUID **novo**, diferente do backup).

Abra `restore/ativar-kayke-vitalicio.sql`, substitua `COLE_SEU_USER_ID_AQUI` e execute no SQL Editor.

Isso define:

- `subscription_type = lifetime`
- `subscription_status = active`
- Nome / data de nascimento / termos aceitos
- XP e conquista “veteran” do backup (opcional)

### Avatar

O caminho antigo (`…/1767062276128.jpeg`) era do Storage do projeto pausado. Se a foto não aparecer, envie de novo em **Perfil** no app (bucket `avatars` precisa existir no projeto novo).

---

## 4. MCP Supabase (opcional)

Se você autenticou o plugin Supabase no Cursor, envie o **project ref** do StudyFlow 2 e dá para buscar as chaves publishable via MCP (`get_publishable_keys`).

Ref do projeto antigo (pausado): `tspxdlzriprdkilfjyer` — **não use** no `.env`; use só o ref do **StudyFlow 2**.
