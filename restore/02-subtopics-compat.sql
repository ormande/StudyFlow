-- Compatibilidade com o app em produção (subtópicos em tabela separada)
-- Rode após 00_schema_completo_v1.sql se subjects ainda usa só jsonb

CREATE TABLE IF NOT EXISTS public.subtopics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  completed boolean DEFAULT false,
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.study_logs
  ADD COLUMN IF NOT EXISTS subtopic_id uuid REFERENCES public.subtopics(id) ON DELETE SET NULL;

ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access own subtopics" ON public.subtopics;
CREATE POLICY "Users access own subtopics" ON public.subtopics
  FOR ALL
  USING (
    subject_id IN (SELECT id FROM public.subjects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    subject_id IN (SELECT id FROM public.subjects WHERE user_id = auth.uid())
  );
