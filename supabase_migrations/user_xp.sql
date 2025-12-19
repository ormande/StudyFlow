-- Tabela de XP do usuário
CREATE TABLE IF NOT EXISTS user_xp (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_xp INTEGER NOT NULL DEFAULT 0,
  xp_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp(user_id);

-- RLS (Row Level Security)
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios dados de XP
CREATE POLICY "Users can view own XP"
  ON user_xp FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Usuários podem inserir apenas seus próprios dados de XP
CREATE POLICY "Users can insert own XP"
  ON user_xp FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar apenas seus próprios dados de XP
CREATE POLICY "Users can update own XP"
  ON user_xp FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar apenas seus próprios dados de XP
CREATE POLICY "Users can delete own XP"
  ON user_xp FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente (reutiliza função existente se já houver)
-- Se a função não existir, será criada pela migration de user_achievements
-- Caso contrário, apenas cria o trigger

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_xp_updated_at
  BEFORE UPDATE ON user_xp
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
