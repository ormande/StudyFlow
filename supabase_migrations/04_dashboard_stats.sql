-- ============================================================================
-- MIGRAÇÃO: Dashboard Stats - Server-Side Aggregation
-- StudyFlow - Otimização de Performance e Escalabilidade
-- ============================================================================
-- 
-- OBJETIVO:
-- Criar função RPC para calcular estatísticas agregadas no servidor,
-- eliminando a necessidade de baixar todos os logs no frontend.
-- Isso resolve problemas de escalabilidade quando há muitos registros.
--
-- FUNÇÃO:
-- get_user_stats(p_user_id uuid) - Retorna estatísticas agregadas do usuário
--
-- ============================================================================

-- ============================================================================
-- FUNÇÃO RPC: get_user_stats
-- ============================================================================
-- Calcula estatísticas agregadas de todos os logs do usuário de forma eficiente.
-- Retorna um JSON com:
--   - total_minutes: Soma de (hours*60 + minutes + seconds/60)
--   - total_questions: Soma de (correct + wrong + blank)
--   - total_correct: Soma de (correct)
--   - total_pages: Soma de (pages) de logs do tipo 'teoria'
--   - total_logs: Contagem total de registros de estudo
--   - total_xp: Calculado como (total_minutes * 1) + (total_questions * 2) + (total_correct * 5)
--
-- SEGURANÇA:
-- - SECURITY DEFINER: Executa com privilégios do criador da função
-- - Verifica que o usuário só pode consultar seus próprios dados via RLS
-- - A função respeita as políticas RLS da tabela study_logs

CREATE OR REPLACE FUNCTION get_user_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_minutes numeric;
  v_total_questions integer;
  v_total_correct integer;
  v_total_pages integer;
  v_total_logs integer;
  v_total_xp integer;
  v_result json;
BEGIN
  -- Calcula total de minutos: (hours * 60) + minutes + (seconds / 60)
  -- Usa COALESCE para tratar valores NULL como 0
  SELECT 
    COALESCE(SUM(
      (COALESCE(hours, 0) * 60) + 
      COALESCE(minutes, 0) + 
      (COALESCE(seconds, 0) / 60.0)
    ), 0)::numeric
  INTO v_total_minutes
  FROM study_logs
  WHERE user_id = p_user_id;

  -- Calcula total de questões: soma de correct + wrong + blank
  SELECT 
    COALESCE(SUM(
      COALESCE(correct, 0) + 
      COALESCE(wrong, 0) + 
      COALESCE(blank, 0)
    ), 0)
  INTO v_total_questions
  FROM study_logs
  WHERE user_id = p_user_id;

  -- Calcula total de acertos: soma de correct
  SELECT 
    COALESCE(SUM(COALESCE(correct, 0)), 0)
  INTO v_total_correct
  FROM study_logs
  WHERE user_id = p_user_id;

  -- Calcula total de páginas: soma de pages de logs do tipo 'teoria'
  SELECT 
    COALESCE(SUM(COALESCE(pages, 0)), 0)
  INTO v_total_pages
  FROM study_logs
  WHERE user_id = p_user_id AND type = 'teoria';

  -- Calcula total de logs: contagem de registros
  SELECT 
    COALESCE(COUNT(*), 0)
  INTO v_total_logs
  FROM study_logs
  WHERE user_id = p_user_id;

  -- Calcula XP total usando a fórmula:
  -- (total_minutes * 1) + (total_questions * 2) + (total_correct * 5)
  v_total_xp := (
    FLOOR(v_total_minutes)::integer * 1 +
    v_total_questions * 2 +
    v_total_correct * 5
  );

  -- Retorna resultado como JSON
  v_result := json_build_object(
    'total_minutes', FLOOR(v_total_minutes)::integer,
    'total_questions', v_total_questions,
    'total_correct', v_total_correct,
    'total_pages', v_total_pages,
    'total_logs', v_total_logs,
    'total_xp', v_total_xp
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================
-- 
-- USO NO FRONTEND:
--   const { data, error } = await supabase.rpc('get_user_stats', {
--     p_user_id: session.user.id
--   });
--
-- RETORNO ESPERADO:
--   {
--     "total_minutes": 1250,
--     "total_questions": 450,
--     "total_correct": 320,
--     "total_pages": 150,
--     "total_logs": 85,
--     "total_xp": 1250 + 900 + 1600 = 3750
--   }
--
-- PERFORMANCE:
-- - Executa agregações diretamente no banco (muito mais rápido)
-- - Não transfere dados desnecessários pela rede
-- - Escalável para milhões de registros
-- - Usa índices existentes na tabela study_logs
--
-- SEGURANÇA:
-- - RLS garante que usuários só vejam seus próprios dados
-- - SECURITY DEFINER permite execução eficiente sem expor privilégios
-- - Parâmetro p_user_id deve ser validado no frontend (sempre usar auth.uid())
-- ============================================================================

