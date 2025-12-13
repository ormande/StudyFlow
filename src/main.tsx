import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from './contexts/ToastContext';
import './i18n'; // Inicializa o i18next
import { Analytics } from '@vercel/analytics/react';

// ============================================
// INICIALIZAÇÃO DO SENTRY (APENAS EM PRODUÇÃO)
// ============================================
// O Sentry só é inicializado se estivermos em produção E a DSN estiver configurada
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  // Import dinâmico para não incluir Sentry no bundle de desenvolvimento
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      
      // Ambiente
      environment: 'production',
      
      // Configurações de performance (traces)
      // 10% das transações serão rastreadas para não sobrecarregar
      tracesSampleRate: 0.1,
      
      // Configurações de Session Replay
      // Grava 10% das sessões normais (para análise geral)
      replaysSessionSampleRate: 0.1,
      // Grava 100% das sessões com erros (muito útil para debug)
      replaysOnErrorSampleRate: 1.0,
      
      // Integrações habilitadas
      integrations: [
        // Rastreamento de performance (tempo de carregamento de páginas, requisições, etc)
        Sentry.browserTracingIntegration(),
        // Gravação de sessões (session replay) para ver o que o usuário fez antes do erro
        Sentry.replayIntegration({
          // Máscara todos os textos por padrão para privacidade
          maskAllText: true,
          // Não bloquear mídia (pode ser útil para debug)
          blockAllMedia: false,
        }),
      ],
      
      // Ignora erros comuns de extensões do navegador (evita ruído)
      ignoreErrors: [
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'atomicFindClose',
        'fb_xd_fragment',
        'bmi_SafeAddOnload',
        'EBCallBackMessageReceived',
        'conduitPage',
      ],
      
      // Ignora URLs de extensões do navegador
      denyUrls: [
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
      ],
    });
  }).catch((error) => {
    // Se houver erro ao carregar o Sentry, apenas loga no console
    // Não quebra a aplicação em caso de falha
    console.error('Erro ao inicializar Sentry:', error);
  });
}

// ============================================
// RENDERIZAÇÃO DA APLICAÇÃO
// ============================================
const rootElement = document.getElementById('root')!;

// Função auxiliar para renderizar a aplicação
const renderApp = () => (
  <StrictMode>
    <ToastProvider>
      <App />
      <Analytics />
    </ToastProvider>
  </StrictMode>
);

// Em produção com Sentry: usa ErrorBoundary do Sentry
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react').then((Sentry) => {
    createRoot(rootElement).render(
      <Sentry.ErrorBoundary
        fallback={({ resetError }) => (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#f9fafb',
          }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ef4444', fontWeight: 'bold' }}>
              Algo deu errado
            </h1>
            <p style={{ marginBottom: '2rem', color: '#6b7280', maxWidth: '400px' }}>
              Um erro inesperado ocorreu. O erro foi registrado automaticamente e nossa equipe foi notificada.
            </p>
            <button
              onClick={resetError}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
            >
              Tentar novamente
            </button>
          </div>
        )}
        showDialog
      >
        {renderApp()}
      </Sentry.ErrorBoundary>
    );
  }).catch(() => {
    // Fallback: se Sentry não carregar, renderiza sem ErrorBoundary
    createRoot(rootElement).render(renderApp());
  });
} else {
  // Em desenvolvimento ou sem Sentry: renderiza normalmente
  createRoot(rootElement).render(renderApp());
}