-- ============================================================================
-- MIGRATION: Adicionar coluna tutorial_completed em user_settings
-- StudyFlow - Persistência de Status do Tutorial
-- ============================================================================
-- 
-- OBJETIVO:
-- Adicionar coluna tutorial_completed para persistir o status do tutorial
-- no banco de dados, substituindo o uso frágil de localStorage.
--
-- IMPORTANTE:
-- - Default: false (usuários novos verão o tutorial)
-- - Preservado durante factory_reset (usuários experientes não veem novamente)
-- ============================================================================

-- Adicionar coluna tutorial_completed
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN NOT NULL DEFAULT false;

-- Comentário na coluna para documentação
COMMENT ON COLUMN public.user_settings.tutorial_completed IS 
'Indica se o usuário já completou o tutorial de onboarding. Preservado durante factory_reset.';

