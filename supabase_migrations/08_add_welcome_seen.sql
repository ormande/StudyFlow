-- MIGRATION: Adicionar coluna welcome_seen em user_settings
-- Esta coluna rastreia se o usuário já viu o modal de boas-vindas inicial

ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS welcome_seen BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.user_settings.welcome_seen IS 'Indica se o usuário já visualizou o modal de boas-vindas do dashboard.';