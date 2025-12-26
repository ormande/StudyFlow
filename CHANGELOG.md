# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2026-01-01 (Edição "Lançamento Comercial") - Atual

Esta é a versão oficial de lançamento (Go-Live) do StudyFlow como produto comercial. Inclui a infraestrutura completa de pagamentos, uma reformulação visual profunda para Desktop e recursos essenciais de engajamento e suporte ao cliente.

### Adicionado
- **Monetização & Assinaturas:**
  - Integração completa com Gateway de Pagamento (Efí Bank).
  - Sistema de gestão de usuários e assinaturas (Tiers: Trial, Mensal e Vitalício) protegido por RLS.
  - E-mails transacionais e de confirmação personalizados via Supabase.
- **Ecossistema & Suporte:**
  - Landing Page oficial focada em conversão, com FAQ estendido (7 novas perguntas) e SEO otimizado.
  - Integração com canais oficiais de suporte (Telegram) dentro do app e no site.
  - Botão de Feedback dedicado (Modal Integrado) para coleta de sugestões.
- **Notificações Push:** Suporte a notificações via Service Worker, permitindo alertas no celular mesmo com o navegador fechado.
- **Busca & Histórico:**
  - Busca global implementada na página de Histórico.
  - Melhoria na navegação temporal com filtros precisos de data.
- **Onboarding:** Novo Banner de "Primeira Vez" (Welcome Modal) substituindo o antigo sistema de tour para uma recepção mais fluida.

### Modificado
- **Redesign Desktop:** Reformulação completa do layout para telas grandes (Responsividade aprimorada), melhorando o uso do espaço horizontal.
- **Identidade do Usuário:** Exibição consistente da Foto/Avatar e Nome tanto na Sidebar (Desktop) quanto na página "Mais" (Mobile).
- **Design System Final:**
  - Padronização total de tipografia, cores e espaçamentos via Tailwind.
  - Padronização de todas as animações utilizando variantes reutilizáveis do Framer Motion.
- **Sistema de Toasts:** Implementação de uma **Fila de Toasts** (Queue) com delay automático para evitar sobreposição visual de alertas.

### Corrigido
- **UX Mobile:** Correção do campo de data de nascimento que vazava do container em telas pequenas.
- **Conquistas:** Correção de bugs onde badges não acompanhavam a evolução das métricas em tempo real.
- **Interface:** Ajustes finos no tamanho e padding dos toasts e remoção de botões duplicados de edição de perfil na navegação.
- **Integridade:** Aumento do limite de logs para visualização e refinamento na subtração de XP.

## [1.8.0] - 2025-12-20 (Edição "Polimento & Performance") - Atual

Esta versão foca na robustez da experiência do usuário, introduzindo um sistema de design padronizado (UI Kit), resolvendo limitações críticas de performance no histórico e garantindo a integridade dos dados de gamificação.

### Adicionado
- **Notificações Locais (Web Notifications):**
  - Alertas nativos do sistema quando o Timer ou Pomodoro finalizam (funciona em background).
  - Controle de permissão e botão de "Testar Notificação" na página de Configurações.
- **Paginação e Busca Avançada (Histórico):**
  - Implementação de **Load More** (Paginação sob demanda) substituindo o limite fixo de 100 logs.
  - **Busca Global no Servidor (Server-Side):** A pesquisa agora varre todo o banco de dados (Matérias, Observações e Subtópicos) ignorando a paginação local.
  - **Filtros de Data (Chips):** Filtros rápidos no topo do histórico (1D, 7D, 30D, Todos, etc.) integrados à query do banco.
- **Sincronização entre Abas (BroadcastChannel):** Atualização automática de dados em todas as janelas abertas do app (ex: finalizar timer em uma aba atualiza o dashboard na outra instantaneamente).
- **UI Kit (Design System):**
  - Novo componente `<Button />` reutilizável e tipado.
  - Suporte nativo a variantes (Primary, Danger, Ghost, Outline), tamanhos, ícones e estado de `loading`.

### Modificado
- **Refatoração Global de UI:** Substituição massiva de botões nativos e classes repetitivas pelo novo componente `<Button />` em todo o projeto (Login, Register, Settings, etc.).
- **Integridade de XP:** Implementação da lógica de **subtração de XP** (`removeXP`) ao deletar um registro de estudo, prevenindo inconsistências no ranking.
- **Cálculo de Conquistas:** Migração da lógica de validação para usar `user_stats` (servidor) em vez do array local, corrigindo bugs em conquistas de longo prazo (ex: "Maratonista").

### Removido
- **Tour Interativo (Onboarding):** Remoção completa da biblioteca `react-joyride` e do componente `OnboardingTour` devido a problemas de performance e UX mobile, mantendo a `TutorialPage` estática como guia principal.
- **Limites Artificiais:** Remoção da trava de "últimos 100 registros" no hook de dados.

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