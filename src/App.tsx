import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { motion } from 'framer-motion';
import MainApp from './components/MainApp';
import ResetPasswordModal from './components/ResetPasswordModal';
import LandingPage from './pages/LandingPage';
import LoginScreen from './components/LoginScreen';
import { useAppearance } from './hooks/useAppearance';

// --- APP PRINCIPAL ---
function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [authView, setAuthView] = useState<'landing' | 'login' | 'forgot'>('landing');
  const [forceLanding, setForceLanding] = useState(false);

  // Usar hook de aparência para gerenciar tema
  const { settings } = useAppearance();
  
  // Calcular isDarkMode baseado no tema atual
  const isDarkMode = settings.theme === 'dark' || 
    (settings.theme === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Atualizar cor de fundo do body baseado no tema
  useEffect(() => {
    if (settings.theme === 'high-contrast') {
      document.body.style.backgroundColor = '#000000';
    } else if (isDarkMode) {
      document.body.style.backgroundColor = '#111827';
    } else {
      document.body.style.backgroundColor = '#f9fafb';
    }
  }, [settings.theme, isDarkMode]);

  // Verificar se deve mostrar landing page mesmo com sessão
  const shouldShowLanding = () => {
    return forceLanding;
  };

  // Auth Listener
  useEffect(() => {
    // Verificar se há hash de recuperação na URL
    const checkRecoveryHash = () => {
      const hash = window.location.hash;
      if (hash.includes('type=recovery') || hash.includes('access_token')) {
        setIsRecoveryMode(true);
        // Limpar hash da URL após detectar
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    // Verificar parâmetro landing na URL na inicialização
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('landing') === 'true') {
      setForceLanding(true);
      // Limpar parâmetro da URL imediatamente
      const url = new URL(window.location.href);
      url.searchParams.delete('landing');
      window.history.replaceState(null, '', url.pathname + url.search);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      // Verificar hash após obter sessão
      checkRecoveryHash();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      // IMPORTANTE: Quando o usuário faz logout, voltar para Landing Page
      if (event === 'SIGNED_OUT') {
        setAuthView('landing');
      }
      
      // Detectar modo de recuperação de senha
      if (event === 'PASSWORD_RECOVERY' || (session && window.location.hash.includes('type=recovery'))) {
        setIsRecoveryMode(true);
        // Limpar hash da URL
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    // Verificar hash na montagem do componente
    checkRecoveryHash();

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const handleCloseRecoveryModal = () => {
    setIsRecoveryMode(false);
  };

  // Loading state - Splash Screen com logo
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <motion.img
            src="/icon-512.png"
            alt="StudyFlow"
            className="w-32 h-32"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
    );
  }

  // Contêiner base sempre renderizado com tema
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative transition-colors duration-300">
      {/* Modal de Redefinição de Senha - Prioridade máxima, renderiza independente da sessão */}
      <ResetPasswordModal 
        isOpen={isRecoveryMode} 
        onClose={handleCloseRecoveryModal} 
      />

      {/* Renderização condicional do conteúdo principal */}
      {!session || shouldShowLanding() ? (
        <>
          {authView === 'landing' && (
            <LandingPage 
              onNavigate={(screen) => {
                setAuthView(screen === 'signup' ? 'login' : screen);
                // Quando usuário navega para login/signup, desativar forceLanding
                setForceLanding(false);
              }} 
            />
          )}
          {(authView === 'login' || authView === 'forgot') && (
            <LoginScreen 
              onBack={() => {
                setAuthView('landing');
                setForceLanding(false);
              }}
              initialMode={authView}
            />
          )}
        </>
      ) : (
        <MainApp
          session={session}
          onHardReset={handleLogout}
        />
      )}
    </div>
  );
}

export default App;