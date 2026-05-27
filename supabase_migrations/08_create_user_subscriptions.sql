-- 08_create_user_subscriptions.sql
-- Item 3 (Parte 1): separar assinatura de user_settings
-- Nesta etapa, criamos apenas a nova tabela + segurança (RLS).
-- Sem alteração de trigger, Edge Functions ou frontend por enquanto.

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'none', -- trial | active | cancelled | none
  plan_type text, -- monthly | lifetime | null
  trial_ends_at timestamptz,
  next_billing_date timestamptz,
  subscription_end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_subscriptions_status_check
    CHECK (status IN ('none', 'trial', 'active', 'cancelled')),
  CONSTRAINT user_subscriptions_plan_type_check
    CHECK (plan_type IS NULL OR plan_type IN ('monthly', 'lifetime'))
);

-- Índice auxiliar para relatórios/admin por status
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status
  ON public.user_subscriptions (status);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access own subscription" ON public.user_subscriptions;

CREATE POLICY "Users access own subscription"
  ON public.user_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

