# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2025-12-20 (Edição "Game Changer")

Esta versão consolida a Gamificação, introduz a gestão completa de Perfil e finaliza a identidade visual da marca.

### Adicionado
- **Perfil do Usuário:** Página dedicada para edição de foto (Upload via Supabase Storage), dados pessoais e visualização de plano.
- **Configurações (Settings):** Nova página centralizada com abas de Privacidade, Notificações, Dados e Zona de Perigo.
- **Factory Reset Seguro:** Função para zerar a conta completamente, com proteção contra condições de corrida (Race Conditions).
- **Gamificação Completa:**
  - Lógica final de cálculo de Elos e progressão.
  - Sistema de Conquistas (Desbloqueio e Resgate) com persistência robusta.
  - Histórico detalhado de XP.
  - Modal de "Level Up" com animação celebratória (Estilo Pokémon).
- **Identidade Visual (Branding):**
  - Aplicação dos logotipos reais do StudyFlow (Login, Sidebar, Splash Screen).
  - Título e Favicon personalizados no navegador.
  - Tela de Carregamento (Splash Screen) com logo pulsante.
- **Segurança:** Implementação de RLS (Row Level Security) no banco de dados para proteção de dados do usuário.

### Modificado
- **Sidebar Desktop:** Reorganização visual limpa (remoção de títulos de seção) e nova ordem lógica de menus.
- **Empty States:** Cards de "estado vazio" no Dashboard agora possuem links de ação direta.
- **Performance:** Otimização no carregamento de logs (Fetch Limit) para evitar travamentos com muitos dados.

### Corrigido
- **Timer Drift:** Correção da imprecisão do cronômetro quando o navegador estava em segundo plano.
- **Bug do Reset:** Correção crítica onde conquistas reapareciam após zerar a conta (Race Condition no Contexto).
- **Tutorial:** Lógica de persistência corrigida para garantir que o tour não reapareça após resets de conta.

## [1.6.0] - 2025-12-17
### Adicionado
- Nova navegação mobile com BottomNav de 5 abas
- Página "Mais" com todas as funcionalidades organizadas
- Sidebar desktop expandida com acesso rápido
- Mapa de Calor de Estudos (Heatmap) com visualização de 30/90/365 dias
- Sistema de Feedback in-app integrado com Supabase
- Tour guiado (Onboarding) para novos usuários
- Animações Framer Motion no Heatmap

### Modificado
- Melhorada a responsividade do Dashboard em Android
- Otimizadas as animações de transição entre páginas
- Atualizado README.md com roadmap completo

### Corrigido
- Layout quebrado em dispositivos Android (< 411px)
- Animações com flicker no TimerPage
- Tooltip do Heatmap não aparecendo no mobile

## [1.5.0] - 2025-12-17
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

[1.7.0]: https://github.com/ormande/study-flow/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/ormande/study-flow/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/ormande/study-flow/compare/v1.0.0...v1.5.0
[1.0.0]: https://github.com/ormande/study-flow/releases/tag/v1.0.0