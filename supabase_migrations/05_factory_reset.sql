-- ============================================================================
-- FUNÇÃO RPC: factory_reset
-- StudyFlow - Reset Completo de Dados do Usuário
-- ============================================================================
-- 
-- OBJETIVO:
-- Deletar TODOS os dados do usuário autenticado em uma transação atômica,
-- garantindo que não sobrem dados órfãos ou inconsistentes.
--
-- TABELAS AFETADAS (ordem de exclusão respeitando Foreign Keys):
-- 1. user_achievements (FK: user_id -> auth.users) - PRIORIDADE MÁXIMA
-- 2. user_xp (FK: user_id -> auth.users)
-- 3. study_logs (FK: user_id -> auth.users, subject_id -> subjects)
-- 4. subtopics (FK: subject_id -> subjects)
-- 5. subjects (FK: user_id -> auth.users)
-- 6. user_settings (FK: user_id -> auth.users) - UPDATE (preserva tutorial_completed)
--
-- IMPORTANTE:
-- - Usa SECURITY DEFINER para garantir permissões adequadas
-- - Executa todas as exclusões em uma única transação
-- - Se qualquer operação falhar, todas são revertidas (ROLLBACK)
-- - SET search_path = public garante que as tabelas sejam encontradas
-- ============================================================================

CREATE OR REPLACE FUNCTION factory_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_deleted_count INTEGER;
BEGIN
  -- Obter o ID do usuário autenticado
  v_user_id := auth.uid();
  
  -- Verificar se o usuário está autenticado
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Iniciar transação implícita (todas as operações são atômicas)
  -- Se qualquer DELETE falhar, todos serão revertidos automaticamente

  -- 1. Deletar conquistas (user_achievements) - PRIORIDADE MÁXIMA
  -- Não tem dependências, deve ser deletado PRIMEIRO
  DELETE FROM public.user_achievements
  WHERE user_id = v_user_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'user_achievements: % linhas deletadas', v_deleted_count;

  -- 2. Deletar XP (user_xp)
  -- Não tem dependências, pode ser deletado em seguida
  DELETE FROM public.user_xp
  WHERE user_id = v_user_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'user_xp: % linhas deletadas', v_deleted_count;

  -- 3. Deletar logs de estudo (study_logs)
  -- Depende de subjects, mas pode ser deletado antes de subjects
  -- pois a FK é apenas referência, não impede DELETE
  DELETE FROM public.study_logs
  WHERE user_id = v_user_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'study_logs: % linhas deletadas', v_deleted_count;

  -- 4. Deletar subtópicos (subtopics)
  -- Depende de subjects (subject_id), deve ser deletado ANTES de subjects
  DELETE FROM public.subtopics
  WHERE subject_id IN (
    SELECT id FROM public.subjects WHERE user_id = v_user_id
  );
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'subtopics: % linhas deletadas', v_deleted_count;

  -- 5. Deletar matérias (subjects)
  -- Agora que subtopics foram deletados, pode deletar subjects
  DELETE FROM public.subjects
  WHERE user_id = v_user_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'subjects: % linhas deletadas', v_deleted_count;

  -- 6. Resetar configurações (user_settings) - PRESERVANDO tutorial_completed
  -- Em vez de deletar, fazemos UPDATE para preservar o status do tutorial
  -- Isso garante que usuários experientes que resetam não vejam o tutorial novamente
  UPDATE public.user_settings
  SET 
    cycle_start_date = EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
    daily_goal = 0,
    show_performance = true
    -- tutorial_completed NÃO é alterado - mantém o valor atual
    -- Outras colunas (timer_sound, theme) são opcionais e não são resetadas aqui
  WHERE user_id = v_user_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'user_settings: % linhas atualizadas - tutorial_completed preservado', v_deleted_count;
  
  -- Se não existir registro de user_settings, criar um novo com valores padrão
  -- mas preservando tutorial_completed = false (novo usuário)
  IF v_deleted_count = 0 THEN
    INSERT INTO public.user_settings (user_id, cycle_start_date, daily_goal, show_performance, tutorial_completed)
    VALUES (
      v_user_id,
      EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
      0,
      true,
      false
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE 'user_settings: novo registro criado';
  END IF;

  -- Transação será commitada automaticamente se chegou até aqui
  -- Se qualquer erro ocorrer, será feito ROLLBACK automático

END;
$$;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================
-- 
-- USO NO FRONTEND:
-- ```typescript
-- const { error } = await supabase.rpc('factory_reset');
-- if (error) {
--   console.error('Erro ao resetar dados:', error);
-- } else {
--   // Sucesso - todos os dados foram deletados
--   window.location.reload();
-- }
-- ```
--
-- SEGURANÇA:
-- - A função usa SECURITY DEFINER, mas valida auth.uid() internamente
-- - Apenas o usuário autenticado pode deletar seus próprios dados
-- - RLS (Row Level Security) ainda está ativo nas tabelas
-- - A função não pode ser usada para deletar dados de outros usuários
-- - SET search_path = public garante que as tabelas sejam encontradas no schema correto
--
-- ORDEM DE EXCLUSÃO (respeitando Foreign Keys):
-- 1. user_achievements → Sem dependências (PRIORIDADE MÁXIMA)
-- 2. user_xp → Sem dependências
-- 3. study_logs → Referencia subjects, mas DELETE não é bloqueado
-- 4. subtopics → Depende de subjects (deve vir antes)
-- 5. subjects → Depende de subtopics terem sido deletados
-- 6. user_settings → UPDATE (preserva tutorial_completed, reseta outras configurações)
--
-- GARANTIAS:
-- ✅ Transação atômica (tudo ou nada)
-- ✅ Não deixa dados órfãos
-- ✅ Respeita Foreign Keys
-- ✅ Valida autenticação
-- ✅ Seguro contra SQL Injection (usa parâmetros)
-- ✅ SET search_path = public garante schema correto
-- ✅ Logs de diagnóstico para debug (RAISE NOTICE)
-- ============================================================================
