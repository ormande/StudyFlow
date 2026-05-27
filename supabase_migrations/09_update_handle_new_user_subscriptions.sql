-- 09_update_handle_new_user_subscriptions.sql
-- Item 3 (Parte 2): no cadastro, criar também a linha em user_subscriptions
-- Pré-requisito: 08_create_user_subscriptions.sql já executada.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, cycle_start_date)
  VALUES (NEW.id, EXTRACT(EPOCH FROM NOW())::BIGINT * 1000);

  INSERT INTO public.user_xp (user_id)
  VALUES (NEW.id);

  INSERT INTO public.user_subscriptions (user_id, status)
  VALUES (NEW.id, 'none')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

