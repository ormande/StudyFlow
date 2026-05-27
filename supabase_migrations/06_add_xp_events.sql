-- 06_add_xp_events.sql
-- Item 5: substituir crescimento de user_xp.xp_history por eventos normalizados

-- Tabela de eventos de XP (append-only)
CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount int NOT NULL CHECK (amount <> 0),
  reason text NOT NULL,
  icon text DEFAULT '',
  is_bonus boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Índices para leitura do histórico e agregações
CREATE INDEX IF NOT EXISTS idx_xp_events_user_created_at
  ON public.xp_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_xp_events_user_bonus_created_at
  ON public.xp_events (user_id, is_bonus, created_at DESC);

-- RLS
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own xp events" ON public.xp_events;
DROP POLICY IF EXISTS "Users insert own xp events" ON public.xp_events;

CREATE POLICY "Users select own xp events"
  ON public.xp_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own xp events"
  ON public.xp_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

