-- Ativa plano VITALÍCIO para sua conta no StudyFlow 2
-- Pré-requisito: já ter criado login com playerone01kp@gmail.com neste projeto
--
-- 1. Supabase → Authentication → Users → copie o User UID
-- 2. Substitua abaixo COLE_SEU_USER_ID_AQUI
-- 3. Execute no SQL Editor (como postgres / service role)

DO $$
DECLARE
  v_user_id uuid := 'COLE_SEU_USER_ID_AQUI'::uuid;
BEGIN
  IF v_user_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RAISE EXCEPTION 'Substitua COLE_SEU_USER_ID_AQUI pelo UUID da Authentication → Users';
  END IF;

  INSERT INTO public.user_settings (
    user_id,
    cycle_start_date,
    daily_goal,
    show_performance,
    theme,
    tutorial_completed,
    subscription_type,
    subscription_status,
    subscription_id,
    trial_ends_at,
    first_name,
    last_name,
    birth_date,
    avatar_url,
    terms_accepted,
    terms_accepted_at,
    welcome_seen,
    updated_at
  ) VALUES (
    v_user_id,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
    0,
    true,
    'light',
    false,
    'lifetime',
    'active',
    'admin',
    NULL,
    'Kayke',
    'Paião',
    '2004-01-10'::date,
    NULL,
    true,
    NOW(),
    true,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    subscription_type = 'lifetime',
    subscription_status = 'active',
    subscription_id = 'admin',
    trial_ends_at = NULL,
    first_name = 'Kayke',
    last_name = 'Paião',
    birth_date = '2004-01-10'::date,
    terms_accepted = true,
    welcome_seen = true,
    updated_at = NOW();

  INSERT INTO public.user_xp (user_id, total_xp, xp_history)
  VALUES (
    v_user_id,
    100,
    '[{"id": "1769463176152rad5sn6i5", "date": 1769463176152, "icon": "", "amount": 100, "reason": "Veterano - 30 dias no app", "isBonus": true}]'::jsonb
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = 100,
    xp_history = EXCLUDED.xp_history,
    updated_at = NOW();

  INSERT INTO public.user_achievements (
    id, user_id, achievement_id, level, progress,
    unlocked_at, claimed_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    'veteran',
    1,
    47,
    '2026-01-26 21:32:52.339+00'::timestamptz,
    '2026-01-26 21:32:56.152+00'::timestamptz,
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Conta % configurada como lifetime/active.', v_user_id;
END $$;
