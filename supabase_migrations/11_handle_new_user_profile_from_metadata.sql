-- 11_handle_new_user_profile_from_metadata.sql
-- Preenche user_settings a partir de raw_user_meta_data no cadastro
-- e faz backfill de contas já criadas com perfil vazio.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  birth_date_val date;
  terms_accepted_val boolean;
BEGIN
  birth_date_val := NULL;
  IF meta ? 'birth_date'
     AND (meta->>'birth_date') ~ '^\d{4}-\d{2}-\d{2}$' THEN
    birth_date_val := (meta->>'birth_date')::date;
  END IF;

  terms_accepted_val := COALESCE((meta->>'terms_accepted')::boolean, false);

  INSERT INTO public.user_settings (
    user_id,
    first_name,
    last_name,
    birth_date,
    cpf_cnpj,
    terms_accepted,
    terms_accepted_at,
    cycle_start_date
  )
  VALUES (
    NEW.id,
    NULLIF(TRIM(meta->>'first_name'), ''),
    NULLIF(TRIM(meta->>'last_name'), ''),
    birth_date_val,
    NULLIF(TRIM(meta->>'cpf_cnpj'), ''),
    terms_accepted_val,
    CASE
      WHEN terms_accepted_val THEN
        COALESCE(
          NULLIF(meta->>'terms_accepted_at', '')::timestamptz,
          NOW()
        )
      ELSE NULL
    END,
    EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
  );

  INSERT INTO public.user_xp (user_id)
  VALUES (NEW.id);

  INSERT INTO public.user_subscriptions (user_id, status, trial_ends_at)
  VALUES (
    NEW.id,
    'trial',
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill: contas existentes com perfil vazio mas metadados no auth
UPDATE public.user_settings us
SET
  first_name = COALESCE(
    NULLIF(TRIM(us.first_name), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'first_name'), '')
  ),
  last_name = COALESCE(
    NULLIF(TRIM(us.last_name), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'last_name'), '')
  ),
  birth_date = COALESCE(
    us.birth_date,
    CASE
      WHEN (u.raw_user_meta_data->>'birth_date') ~ '^\d{4}-\d{2}-\d{2}$'
      THEN (u.raw_user_meta_data->>'birth_date')::date
      ELSE NULL
    END
  ),
  cpf_cnpj = COALESCE(
    NULLIF(TRIM(us.cpf_cnpj), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'cpf_cnpj'), '')
  ),
  terms_accepted = COALESCE(
    us.terms_accepted,
    COALESCE((u.raw_user_meta_data->>'terms_accepted')::boolean, false)
  ),
  terms_accepted_at = COALESCE(
    us.terms_accepted_at,
    CASE
      WHEN COALESCE((u.raw_user_meta_data->>'terms_accepted')::boolean, false)
      THEN COALESCE(
        NULLIF(u.raw_user_meta_data->>'terms_accepted_at', '')::timestamptz,
        NOW()
      )
      ELSE NULL
    END
  ),
  updated_at = NOW()
FROM auth.users u
WHERE us.user_id = u.id
  AND (
    us.first_name IS NULL
    OR TRIM(us.first_name) = ''
    OR us.last_name IS NULL
    OR TRIM(us.last_name) = ''
    OR us.birth_date IS NULL
    OR us.cpf_cnpj IS NULL
    OR TRIM(us.cpf_cnpj) = ''
  )
  AND (
    u.raw_user_meta_data ? 'first_name'
    OR u.raw_user_meta_data ? 'last_name'
    OR u.raw_user_meta_data ? 'birth_date'
    OR u.raw_user_meta_data ? 'cpf_cnpj'
  );
