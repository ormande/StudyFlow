-- STUDYFLOW V1.0 - SCHEMA MESTRE
-- Autor: Kayke Paião Ormande da Silva + Gemini 3.0 Pro
-- Data: 29 de Dezembro de 2025

-- ============================================================================
-- 1. TABELAS PRINCIPAIS
-- ============================================================================

-- Configurações e Perfil do Usuário (Unificado)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  -- Perfil
  first_name text,
  last_name text,
  avatar_url text,
  birth_date date,
  -- Configurações App
  cycle_start_date bigint,
  daily_goal int DEFAULT 0,
  show_performance boolean DEFAULT true,
  theme text DEFAULT 'light',
  timer_sound text DEFAULT 'classic',
  tutorial_completed boolean DEFAULT false,
  welcome_seen boolean DEFAULT false,
  -- Assinatura / Pagamento
  subscription_type text, -- 'free', 'pro', 'lifetime'
  subscription_status text DEFAULT 'none',
  subscription_id text,
  trial_ends_at timestamptz,
  next_billing_date timestamptz,
  -- Termos
  terms_accepted boolean DEFAULT false,
  terms_accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Matérias
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  goal_minutes int DEFAULT 0,
  color text,
  position int DEFAULT 0,
  subtopics jsonb DEFAULT '[]'::jsonb, -- Simplificado para V1.0 (Array JSON)
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Logs de Estudo
CREATE TABLE IF NOT EXISTS public.study_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL, -- Se deletar matéria, mantém log mas sem link
  type text NOT NULL, -- 'teoria', 'questoes', 'revisao'
  hours int DEFAULT 0,
  minutes int DEFAULT 0,
  seconds int DEFAULT 0,
  pages int DEFAULT 0,
  correct int DEFAULT 0,
  wrong int DEFAULT 0,
  blank int DEFAULT 0,
  notes text,
  date date DEFAULT CURRENT_DATE,
  timestamp bigint,
  created_at timestamptz DEFAULT now()
);

-- Gamificação: XP
CREATE TABLE IF NOT EXISTS public.user_xp (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_xp int DEFAULT 0,
  xp_history jsonb DEFAULT '[]'::jsonb,
  level int DEFAULT 1,
  current_elo text DEFAULT 'Bronze I',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Gamificação: Conquistas
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id text NOT NULL,
  level int NOT NULL CHECK (level IN (1, 2, 3)),
  progress int DEFAULT 0,
  unlocked_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id, level)
);

-- Feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text CHECK (type IN ('bug', 'suggestion', 'compliment')),
  message text CHECK (char_length(message) >= 10),
  email text,
  user_agent text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Cupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  discount_percent int NOT NULL,
  max_uses int NOT NULL,
  current_uses int DEFAULT 0,
  valid_until timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Uso de Cupons
CREATE TABLE IF NOT EXISTS public.coupon_uses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id uuid REFERENCES public.coupons(id),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at timestamptz DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

-- ============================================================================
-- 2. SEGURANÇA (RLS)
-- ============================================================================
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_uses ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para evitar duplicidade ao rodar de novo
DROP POLICY IF EXISTS "Users access own settings" ON user_settings;
DROP POLICY IF EXISTS "Users access own subjects" ON subjects;
DROP POLICY IF EXISTS "Users access own logs" ON study_logs;
DROP POLICY IF EXISTS "Users access own xp" ON user_xp;
DROP POLICY IF EXISTS "Users access own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users insert feedback" ON feedback;
DROP POLICY IF EXISTS "Users view own coupon usage" ON coupon_uses;

-- Cria Novas Políticas
CREATE POLICY "Users access own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own subjects" ON subjects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own logs" ON study_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own xp" ON user_xp FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users insert feedback" ON feedback FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users view own coupon usage" ON coupon_uses FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 3. FUNÇÕES E TRIGGERS ÚTEIS
-- ============================================================================

-- Trigger para criar user_settings automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, cycle_start_date)
  VALUES (new.id, EXTRACT(EPOCH FROM NOW())::BIGINT * 1000);
  
  INSERT INTO public.user_xp (user_id) VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger só é criado se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 4. FUNÇÕES DE SUPORTE (RPC)
-- ============================================================================

-- Estatísticas do Usuário (Server Side)
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
BEGIN
  SELECT COALESCE(SUM((COALESCE(hours, 0) * 60) + COALESCE(minutes, 0) + (COALESCE(seconds, 0) / 60.0)), 0)::numeric
  INTO v_total_minutes FROM study_logs WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(COALESCE(correct, 0) + COALESCE(wrong, 0) + COALESCE(blank, 0)), 0)
  INTO v_total_questions FROM study_logs WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(COALESCE(correct, 0)), 0)
  INTO v_total_correct FROM study_logs WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(COALESCE(pages, 0)), 0)
  INTO v_total_pages FROM study_logs WHERE user_id = p_user_id AND type = 'teoria';

  SELECT COALESCE(COUNT(*), 0)
  INTO v_total_logs FROM study_logs WHERE user_id = p_user_id;

  -- REGRAS OFICIAIS DE XP:
  -- 1 minuto estudado = 1 XP
  -- 1 questão correta = 5 XP
  -- 1 página lida = 2 XP
  -- (Questões erradas/branco NÃO dão XP)
  v_total_xp := (FLOOR(v_total_minutes)::integer * 1 + v_total_correct * 5 + v_total_pages * 2);

  RETURN json_build_object(
    'total_minutes', FLOOR(v_total_minutes)::integer,
    'total_questions', v_total_questions,
    'total_correct', v_total_correct,
    'total_pages', v_total_pages,
    'total_logs', v_total_logs,
    'total_xp', v_total_xp
  );
END;
$$;

-- Reset de Fábrica (Deletar conta completa)
CREATE OR REPLACE FUNCTION factory_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;

  -- Deleta em ordem devido às Foreign Keys
  DELETE FROM public.user_achievements WHERE user_id = v_user_id;
  DELETE FROM public.user_xp WHERE user_id = v_user_id;
  DELETE FROM public.study_logs WHERE user_id = v_user_id;
  
  -- Deleta subtópicos via subquery nas matérias do usuário
  DELETE FROM public.subtopics WHERE subject_id IN (SELECT id FROM public.subjects WHERE user_id = v_user_id);
  
  DELETE FROM public.subjects WHERE user_id = v_user_id;
  DELETE FROM public.coupon_uses WHERE user_id = v_user_id;

  -- Reseta Settings (mantém tutorial_completed)
  UPDATE public.user_settings
  SET cycle_start_date = EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
      daily_goal = 0,
      show_performance = true
  WHERE user_id = v_user_id;
END;
$$;