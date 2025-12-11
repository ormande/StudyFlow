<p align="center">
  <img src="./docs/screenshots/logo.png" alt="StudyFlow Logo" width="80" />
</p>

<h1 align="center">StudyFlow</h1>

<p align="center">
  <strong>Aplicativo de gestão de estudos para concurseiros e estudantes</strong>
</p>

<p align="center">
  <a href="#-sobre">Sobre</a> •
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-tecnologias">Tecnologias</a> •
  <a href="#-como-executar">Como Executar</a> •
  <a href="#-autor">Autor</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.5.0-emerald" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow" alt="Status" />
</p>

---

## 📖 Sobre

O **StudyFlow** é uma aplicação web progressiva (PWA) desenvolvida para ajudar estudantes a organizarem e acompanharem seus estudos de forma eficiente. Ideal para quem se prepara para concursos públicos, vestibulares ou qualquer tipo de prova.

O app permite registrar sessões de estudo, acompanhar o progresso por matéria, definir metas diárias e visualizar estatísticas de desempenho — tudo em uma interface moderna e responsiva.

🔗 **Acesse o app:** [study-flow-six.vercel.app](https://study-flow-six.vercel.app/)

---

## ✨ Funcionalidades

### 📊 Dashboard Completo
- Visualização do ritmo de estudos dos últimos 7 dias
- Acompanhamento de ofensiva (dias consecutivos)
- Meta diária com barra de progresso
- Desempenho em questões por matéria
- Histórico de atividades recentes

### ⏱️ Cronômetro Integrado
- Timer para acompanhar sessões de estudo em tempo real
- Integração direta com a página de registro

### 📝 Registro de Estudos
- Registro de tempo estudado (horas, minutos, segundos)
- Tipos de estudo: Teoria, Questões ou Revisão
- Controle de páginas lidas
- Desempenho em questões (certas, erradas, em branco)
- Campo de observações para anotações
- Suporte a subtópicos por matéria

### 📚 Gestão de Ciclo de Estudos
- Cadastro de matérias com metas individuais
- Subtópicos para organização detalhada
- Progresso visual por matéria
- Reordenação de matérias por arrastar
- Reinício de ciclo

### ⚙️ Configurações
- Tema claro/escuro
- Meta diária personalizável
- Privacidade (ocultar desempenho)
- Alteração de senha

### 📱 PWA (Progressive Web App)
- Instalável no celular como app nativo
- Interface responsiva (mobile e desktop)
- Funciona em qualquer dispositivo

---

## 📸 Screenshots

### Desktop (Tema Claro)

<p align="center">
  <img src="./docs/screenshots/desktop-dashboard.png" alt="Dashboard Desktop" width="700" />
</p>

<p align="center">
  <img src="./docs/screenshots/desktop-register.png" alt="Registro Desktop" width="700" />
</p>

<p align="center">
  <img src="./docs/screenshots/desktop-cycle.png" alt="Ciclo Desktop" width="700" />
</p>

### Mobile (Tema Escuro)

<p align="center">
  <img src="./docs/screenshots/mobile-dashboard.png" alt="Dashboard Mobile" width="300" />
</p>

---

## 🛠️ Tecnologias

O projeto foi desenvolvido com as seguintes tecnologias:

### Frontend
- **React 18** — Biblioteca para construção de interfaces
- **TypeScript** — Tipagem estática para JavaScript
- **Vite** — Build tool ultrarrápido
- **Tailwind CSS** — Framework CSS utilitário
- **Framer Motion** — Animações fluidas
- **Lucide React** — Ícones modernos

### Backend
- **Supabase** — Backend as a Service (autenticação + banco de dados PostgreSQL)

### Infraestrutura
- **Vercel** — Deploy e hospedagem
- **PWA** — Progressive Web App com Service Worker

---

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta no [Supabase](https://supabase.com/) (para o banco de dados)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/ormande/study-flow.git

# Entre na pasta
cd study-flow

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
```

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz com:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### Executando

```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

O app estará disponível em `http://localhost:5173`

---

## 📁 Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
│   ├── AlertModal.tsx
│   ├── Toast.tsx
│   └── ...
├── contexts/         # Context API
│   └── ToastContext.tsx
├── hooks/            # Hooks customizados
│   └── useSupabaseData.ts
├── lib/              # Configurações externas
│   └── supabase.ts
├── pages/            # Páginas da aplicação
│   ├── DashboardPage.tsx
│   ├── TimerPage.tsx
│   ├── RegisterPage.tsx
│   └── CyclePage.tsx
├── types/            # Definições TypeScript
│   └── index.ts
├── App.tsx           # Componente raiz
└── main.tsx          # Entry point
```

---

## 🗺️ Roadmap

- [x] Dashboard com estatísticas
- [x] Cronômetro de estudos
- [x] Registro de sessões
- [x] Gestão de matérias e subtópicos
- [x] Tema claro/escuro
- [x] PWA instalável
- [ ] Modo Pomodoro
- [ ] Notificações/Lembretes
- [ ] Exportar dados (PDF/Excel)
- [ ] Gráficos avançados
- [ ] Gamificação (badges e conquistas)

---

## 👨‍💻 Autor

<p align="center">
  <img src="https://github.com/ormande.png" width="100" style="border-radius: 50%" alt="Kayke Paião" />
</p>

<p align="center">
  <strong>Kayke Paião</strong>
</p>

<p align="center">
  Estudante de Gestão de Tecnologia da Informação
</p>

<p align="center">
  <a href="https://instagram.com/paiao.kayke">
    <img src="https://img.shields.io/badge/-@paiao.kayke-E4405F?style=flat&logo=instagram&logoColor=white" alt="Instagram" />
  </a>
  <a href="https://github.com/ormande">
    <img src="https://img.shields.io/badge/-GitHub-181717?style=flat&logo=github&logoColor=white" alt="GitHub" />
  </a>
</p>

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

<p align="center">
  Feito com 💚 e muito ☕ por Kayke Paião
</p>
