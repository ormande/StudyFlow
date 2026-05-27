-- 10_drop_legacy_subscription_columns.sql
-- Item 3 (Parte 5): remove colunas antigas de assinatura em user_settings
-- Pré-requisitos:
-- - 08_create_user_subscriptions.sql
-- - 09_update_handle_new_user_subscriptions.sql
-- - Edge Functions e frontend já usando user_subscriptions

ALTER TABLE public.user_settings
  DROP COLUMN IF EXISTS subscription_type,
  DROP COLUMN IF EXISTS subscription_status,
  DROP COLUMN IF EXISTS subscription_id,
  DROP COLUMN IF EXISTS trial_ends_at,
  DROP COLUMN IF EXISTS next_billing_date,
  DROP COLUMN IF EXISTS subscription_end_date;

