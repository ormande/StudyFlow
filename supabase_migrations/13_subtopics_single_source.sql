-- 13_subtopics_single_source.sql
-- Fonte única de verdade: tabela subtopics (remove jsonb legado em subjects).

-- Migrar subtópicos do JSONB para a tabela (IDs válidos preservados)
INSERT INTO public.subtopics (id, subject_id, name, completed, position)
SELECT
  CASE
    WHEN (elem->>'id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN (elem->>'id')::uuid
    ELSE gen_random_uuid()
  END,
  s.id,
  COALESCE(NULLIF(TRIM(elem->>'name'), ''), 'Subtópico'),
  COALESCE((elem->>'completed')::boolean, false),
  (ordinality - 1)::int
FROM public.subjects s
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN s.subtopics IS NOT NULL AND jsonb_typeof(s.subtopics) = 'array'
    THEN s.subtopics
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS t(elem, ordinality)
WHERE jsonb_array_length(
  CASE
    WHEN s.subtopics IS NOT NULL AND jsonb_typeof(s.subtopics) = 'array'
    THEN s.subtopics
    ELSE '[]'::jsonb
  END
) > 0
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  completed = EXCLUDED.completed,
  position = EXCLUDED.position;

-- Remover coluna jsonb que conflitava com o embed PostgREST subtopics(*)
ALTER TABLE public.subjects DROP COLUMN IF EXISTS subtopics;
