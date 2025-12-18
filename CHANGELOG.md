# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2025-12-17 (Atual)
### Adicionado
- Integração completa com **Supabase** (Banco de Dados e Auth).
- Sistema de **Recuperação de Senha** por e-mail.
- **Gráfico de Evolução Semanal** no Dashboard.
- Campo de seleção de data retroativa no registro de estudos.
- Notificações via **Toast** para feedback de ações.
- Configuração de Deploy contínuo na Vercel.
- Sistema de Gamificação (XP, Elos e Badges).
- Timer Pomodoro e Temporizador.

### Alterado
- Migração de LocalStorage para Nuvem (Cloud-Native).
- Refatoração do hook `useSupabaseData` para otimização de renderização.
- Melhoria na responsividade da barra de navegação mobile.

## [1.0.0] - 2025-11-19
### Adicionado
- Lançamento do MVP (Minimum Viable Product).
- Cronômetro.
- Dashboard com estatísticas básicas.
- Suporte a PWA (Instalação em Mobile).
- Tema Claro/Escuro.