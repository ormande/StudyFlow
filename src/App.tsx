import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';
import MainApp from './components/MainApp';
import ResetPasswordModal from './components/ResetPasswordModal';
import LandingPage from './pages/LandingPage';
import LoginScreen from './components/LoginScreen';

// --- APP PRINCIPAL ---
function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [authView, setAuthView] = useState<'landing' | 'login' | 'forgot'>('landing');

  // Tema
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('studyflow_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const color = isDarkMode ? '#111827' : '#f9fafb';
    document.body.style.backgroundColor = color;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('studyflow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('studyflow_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

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

  // Loading state - primeira trava de segurança
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <Loader2 className="animate-spin text-emerald-500 w-10 h-10" />
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
      {!session ? (
        <>
          {authView === 'landing' && (
            <LandingPage 
              onNavigate={(screen) => {
                setAuthView(screen === 'signup' ? 'login' : screen);
              }} 
            />
          )}
          {(authView === 'login' || authView === 'forgot') && (
            <LoginScreen 
              onBack={() => setAuthView('landing')}
              initialMode={authView}
            />
          )}
        </>
      ) : (
        <MainApp
          session={session}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onHardReset={handleLogout}
        />
      )}
    </div>
  );
}

export default App;