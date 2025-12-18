# Configuração do Sistema de Feedback

Este documento contém as instruções para configurar o sistema de feedback no Supabase.

## 📋 Pré-requisitos

- Acesso ao painel do Supabase
- Permissões para executar SQL no banco de dados

## 🗄️ Criar Tabela no Supabase

Execute o seguinte SQL no **SQL Editor** do Supabase:

```sql
-- Criar tabela de feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'suggestion', 'compliment')),
  message TEXT NOT NULL CHECK (char_length(message) >= 10),
  email TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Habilitar Row Level Security (RLS)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Política: Permitir INSERT para usuários autenticados
CREATE POLICY "Users can insert feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: Permitir INSERT para usuários não autenticados (opcional)
-- Descomente se quiser permitir feedback de usuários não logados
-- CREATE POLICY "Anonymous can insert feedback"
--   ON feedback FOR INSERT
--   TO anon
--   WITH CHECK (true);

-- Política: Bloquear SELECT para todos (apenas admins podem ver)
-- Você pode ajustar isso depois para permitir que admins vejam
CREATE POLICY "Only admins can view feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (false);

-- Comentários para documentação
COMMENT ON TABLE feedback IS 'Tabela para armazenar feedback dos usuários (bugs, sugestões, elogios)';
COMMENT ON COLUMN feedback.type IS 'Tipo de feedback: bug, suggestion, compliment';
COMMENT ON COLUMN feedback.status IS 'Status do feedback: pending, reviewed, resolved';
```

## 🔐 Configurar Permissões de Admin (Opcional)

Se você quiser permitir que administradores vejam os feedbacks, você pode criar uma função e política:

```sql
-- Criar função para verificar se o usuário é admin
-- Substitua 'SEU_USER_ID_AQUI' pelo ID do seu usuário admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Exemplo: verificar se o user_id está em uma lista de admins
  -- Você pode criar uma tabela de admins ou usar outra lógica
  RETURN user_id = 'SEU_USER_ID_AQUI'::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política para admins verem todos os feedbacks
CREATE POLICY "Admins can view all feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));
```

## 📊 Visualizar Feedbacks

Para visualizar os feedbacks no Supabase:

1. Acesse o **Table Editor** no painel do Supabase
2. Selecione a tabela `feedback`
3. Você verá todos os feedbacks enviados

**Nota:** Com as políticas atuais, apenas usuários autenticados podem inserir feedbacks, mas ninguém pode visualizá-los via RLS. Você precisará usar o SQL Editor ou ajustar as políticas para ver os dados.

## 🧪 Testar o Sistema

1. Abra o aplicativo StudyFlow
2. Clique em "💬 Dar Feedback" no menu de configurações ou no rodapé
3. Preencha o formulário e envie
4. Verifique no Supabase se o feedback foi salvo:
   ```sql
   SELECT * FROM feedback ORDER BY created_at DESC LIMIT 10;
   ```

## 🔄 Atualizar Status dos Feedbacks

Você pode atualizar o status dos feedbacks manualmente:

```sql
-- Marcar como revisado
UPDATE feedback 
SET status = 'reviewed' 
WHERE id = 'ID_DO_FEEDBACK';

-- Marcar como resolvido
UPDATE feedback 
SET status = 'resolved' 
WHERE id = 'ID_DO_FEEDBACK';
```

## 📈 Estatísticas (Opcional)

Para ver estatísticas dos feedbacks:

```sql
-- Contagem por tipo
SELECT type, COUNT(*) as total 
FROM feedback 
GROUP BY type;

-- Contagem por status
SELECT status, COUNT(*) as total 
FROM feedback 
GROUP BY status;

-- Feedbacks dos últimos 7 dias
SELECT type, COUNT(*) as total 
FROM feedback 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY type;
```

## 🛡️ Segurança

- ✅ RLS está habilitado
- ✅ Apenas usuários autenticados podem inserir (por padrão)
- ✅ Ninguém pode ver feedbacks de outros usuários (por padrão)
- ✅ Validações no banco (CHECK constraints)
- ✅ User agent é capturado automaticamente para debug

## 🚀 Próximos Passos

1. Execute o SQL acima no Supabase
2. Teste o sistema enviando um feedback
3. Configure as políticas de admin se necessário
4. Monitore os feedbacks regularmente

---

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Autor:** Sistema de Feedback StudyFlow
