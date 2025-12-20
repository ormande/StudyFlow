-- ============================================================================
-- SCRIPT DE SEGURANÇA RLS (ROW LEVEL SECURITY)
-- StudyFlow - Auditoria e Hardening de Segurança
-- ============================================================================
-- 
-- OBJETIVO:
-- Garantir que todas as tabelas críticas tenham políticas RLS robustas
-- que restringem acesso baseado em user_id, prevenindo acesso não autorizado
-- a dados de outros usuários.
--
-- TABELAS PROTEGIDAS:
-- - study_logs: Logs de estudo do usuário
-- - subjects: Matérias/subjectos do usuário
-- - user_settings: Configurações pessoais do usuário
--
-- ============================================================================

-- ============================================================================
-- TABELA: study_logs
-- ============================================================================
-- Protege os logs de estudo, garantindo que usuários só possam acessar,
-- modificar ou deletar seus próprios registros.

-- Ativação do RLS (garante que está habilitado)
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

-- Limpeza: Remove políticas antigas de UPDATE e DELETE para evitar conflitos
DROP POLICY IF EXISTS "Users can update own study logs" ON study_logs;
DROP POLICY IF EXISTS "Users can delete own study logs" ON study_logs;
DROP POLICY IF EXISTS "Users can view own study logs" ON study_logs;
DROP POLICY IF EXISTS "Users can insert own study logs" ON study_logs;

-- Política SELECT: Usuários podem visualizar apenas seus próprios logs
CREATE POLICY "Users can view own study logs"
  ON study_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política INSERT: Usuários podem inserir apenas logs com seu próprio user_id
CREATE POLICY "Users can insert own study logs"
  ON study_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política UPDATE: Usuários podem atualizar apenas seus próprios logs
-- USING verifica a linha existente, WITH CHECK valida a nova linha
CREATE POLICY "Users can update own study logs"
  ON study_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política DELETE: Usuários podem deletar apenas seus próprios logs
CREATE POLICY "Users can delete own study logs"
  ON study_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABELA: subjects
-- ============================================================================
-- Protege as matérias/subjectos do usuário, garantindo isolamento completo
-- entre diferentes contas de usuário.

-- Ativação do RLS (garante que está habilitado)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Limpeza: Remove políticas antigas de UPDATE e DELETE para evitar conflitos
DROP POLICY IF EXISTS "Users can update own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can delete own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can view own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can insert own subjects" ON subjects;

-- Política SELECT: Usuários podem visualizar apenas suas próprias matérias
CREATE POLICY "Users can view own subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política INSERT: Usuários podem inserir apenas matérias com seu próprio user_id
CREATE POLICY "Users can insert own subjects"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política UPDATE: Usuários podem atualizar apenas suas próprias matérias
-- Proteção dupla: USING (linha existente) + WITH CHECK (nova linha)
CREATE POLICY "Users can update own subjects"
  ON subjects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política DELETE: Usuários podem deletar apenas suas próprias matérias
CREATE POLICY "Users can delete own subjects"
  ON subjects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABELA: user_settings
-- ============================================================================
-- Protege as configurações pessoais do usuário, incluindo preferências,
-- metas diárias e outras configurações sensíveis.

-- Ativação do RLS (garante que está habilitado)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Limpeza: Remove políticas antigas de UPDATE e DELETE para evitar conflitos
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

-- Política SELECT: Usuários podem visualizar apenas suas próprias configurações
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política INSERT: Usuários podem inserir apenas configurações com seu próprio user_id
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política UPDATE: Usuários podem atualizar apenas suas próprias configurações
-- Proteção crítica: impede que usuários modifiquem configurações de outros
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política DELETE: Usuários podem deletar apenas suas próprias configurações
CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================
-- O script acima garante que:
-- 1. ✅ RLS está ativado em todas as tabelas críticas
-- 2. ✅ Políticas antigas foram removidas (evita duplicação/conflitos)
-- 3. ✅ Todas as operações (SELECT, INSERT, UPDATE, DELETE) estão protegidas
-- 4. ✅ Apenas usuários autenticados podem acessar dados
-- 5. ✅ Cada usuário só pode acessar/modificar seus próprios dados (user_id)
--
-- SEGURANÇA GARANTIDA:
-- - Nenhum usuário pode visualizar dados de outros usuários
-- - Nenhum usuário pode modificar dados de outros usuários
-- - Nenhum usuário pode deletar dados de outros usuários
-- - Nenhum usuário pode inserir dados com user_id de outro usuário
-- ============================================================================

