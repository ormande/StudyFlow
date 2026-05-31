-- 14_fix_history_date_filter.sql
-- Corrige filtro de período na busca de logs (Hoje = só hoje; 7D = 7 dias de calendário)

CREATE OR REPLACE FUNCTION public.search_study_logs(
  p_user_id uuid,
  p_term text,
  p_days integer DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  subject_id uuid,
  subtopic_id uuid,
  type text,
  hours int,
  minutes int,
  seconds int,
  pages int,
  correct int,
  wrong int,
  blank int,
  notes text,
  date date,
  "timestamp" bigint,
  created_at timestamptz,
  subject_name text,
  subject_color text,
  subtopic_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff date := NULL;
  v_upper date := NULL;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF p_term IS NULL OR btrim(p_term) = '' THEN
    RETURN;
  END IF;

  IF p_days IS NOT NULL THEN
    IF p_days = 1 THEN
      v_cutoff := CURRENT_DATE;
      v_upper := CURRENT_DATE;
    ELSE
      v_cutoff := CURRENT_DATE - (p_days - 1);
    END IF;
  END IF;

  RETURN QUERY
  SELECT DISTINCT ON (l.id)
    l.id,
    l.user_id,
    l.subject_id,
    l.subtopic_id,
    l.type,
    l.hours,
    l.minutes,
    l.seconds,
    l.pages,
    l.correct,
    l.wrong,
    l.blank,
    l.notes,
    l.date,
    l."timestamp",
    l.created_at,
    s.name AS subject_name,
    s.color AS subject_color,
    st.name AS subtopic_name
  FROM public.study_logs l
  LEFT JOIN public.subjects s ON s.id = l.subject_id
  LEFT JOIN public.subtopics st ON st.id = l.subtopic_id
  WHERE l.user_id = p_user_id
    AND (v_cutoff IS NULL OR l.date >= v_cutoff)
    AND (v_upper IS NULL OR l.date <= v_upper)
    AND (
      (l.notes IS NOT NULL AND l.notes ILIKE '%' || p_term || '%')
      OR (s.name IS NOT NULL AND s.name ILIKE '%' || p_term || '%')
      OR (st.name IS NOT NULL AND st.name ILIKE '%' || p_term || '%')
    )
  ORDER BY l.id, l.date DESC, l.created_at DESC
  OFFSET GREATEST(p_offset, 0)
  LIMIT LEAST(GREATEST(p_limit, 1), 200);
END;
$$;
