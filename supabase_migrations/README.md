# Migrações do Supabase - Sistema de Conquistas

## Como aplicar a migração

1. Acesse o painel do Supabase
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `user_achievements.sql`
4. Execute a query

## Estrutura da Tabela

A tabela `user_achievements` armazena todas as conquistas do usuário com:
- `achievement_id`: ID da conquista (ex: 'streak-fire')
- `level`: Nível da conquista (1, 2 ou 3)
- `progress`: Progresso atual
- `unlocked_at`: Quando foi desbloqueada
- `claimed_at`: Quando foi resgatada (null se ainda não resgatou)

## Segurança

A tabela usa Row Level Security (RLS) para garantir que cada usuário só veja e modifique suas próprias conquistas.

