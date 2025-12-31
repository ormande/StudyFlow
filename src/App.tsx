import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { motion } from 'framer-motion';
import MainApp from './components/MainApp';
import ResetPasswordModal from './components/ResetPasswordModal';
import LandingPage from './pages/LandingPage';
import LoginScreen from './components/LoginScreen';
import PricingPage from './pages/PricingPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { useAppearance } from './hooks/useAppearance';

const CHECKOUT_INTENT_KEY = 'studyflow_checkout_intent';

// --- APP PRINCIPAL ---
function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [authView, setAuthView] = useState<'landing' | 'login' | 'forgot' | 'pricing' | 'signup' | 'verify-email'>(() => {
    // Verificar se deve começar pela landing page
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('landing') === 'true') return 'landing';
    return 'login';
  });
  const [forceLanding, setForceLanding] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Usar hook de aparência para gerenciar tema (aplicado automaticamente)
  useAppearance();

  // Verificar se deve mostrar landing page mesmo com sessão
  const shouldShowLanding = () => {
    return forceLanding;
  };

  // Auth Listener
  useEffect(() => {
    // Verificar se há hash de recuperação na URL
    const checkRecoveryHash = () => {
      const hash = window.location.hash;
      // ✅ CORREÇÃO: Apenas ativa modo de recuperação se o tipo for explicitamente 'recovery'
      // Links de confirmação de cadastro também contêm access_token, por isso não devemos usá-lo sozinho
      if (hash.includes('type=recovery')) {
        setIsRecoveryMode(true);
        // Limpar hash da URL após detectar
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    // Verificar parâmetro landing ou tab na URL na inicialização
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('landing') === 'true') {
      setForceLanding(true);
      // Limpar parâmetro da URL imediatamente
      const url = new URL(window.location.href);
      url.searchParams.delete('landing');
      window.history.replaceState(null, '', url.pathname + url.search);
    }

    const tabIntent = urlParams.get('tab');
    if (tabIntent && !session) {
      // Salvar intenção de aba apenas se não estiver logado
      sessionStorage.setItem('studyflow_redirect_tab', tabIntent);
      // Limpar parâmetro da URL
      const url = new URL(window.location.href);
      url.searchParams.delete('tab');
      window.history.replaceState(null, '', url.pathname + url.search);
    } else if (tabIntent && session) {
      // Se já estiver logado, podemos tentar mudar a aba diretamente se o MainApp expuser um método,
      // mas como ele é inicializado via activeTab state, o mais simples é limpar o parâmetro
      // e deixar o MainApp carregar a aba atual ou a salva.
      const url = new URL(window.location.href);
      url.searchParams.delete('tab');
      window.history.replaceState(null, '', url.pathname + url.search);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Se houver sessão mas o e-mail não estiver confirmado, deslogar (segurança extra)
      if (session && !session.user.email_confirmed_at) {
        supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(session);
      }
      setAuthLoading(false);
      // Verificar hash após obter sessão
      checkRecoveryHash();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, !!session);
      
      // Bloquear sessão se o e-mail não estiver confirmado
      if (session && !session.user.email_confirmed_at && event !== 'SIGNED_OUT') {
        // Apenas permitimos se for o evento inicial ou login, mas vamos deslogar
        supabase.auth.signOut();
        setSession(null);
        return;
      }

      setSession(session);
      
      // Quando o usuário faz logout, voltar para Tela de Login
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setAuthView('login');
        // Limpar caches de sessão ao sair
        sessionStorage.clear();
        localStorage.removeItem('studyflow_current_page');
        localStorage.removeItem('studyflow_more_scroll');
      }
      
      // Quando o usuário faz login, verificar se há intenção de checkout pendente
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        console.log('User signed in or initial session');
        const savedIntent = localStorage.getItem(CHECKOUT_INTENT_KEY);
        if (savedIntent) {
          try {
            const intent = JSON.parse(savedIntent);
            // Verificar se a intenção não expirou (30 minutos)
            const thirtyMinutes = 30 * 60 * 1000;
            if (Date.now() - intent.timestamp < thirtyMinutes) {
              // Redirecionar para página de preços (o checkout será aberto lá)
              setAuthView('pricing');
            } else {
              // Intenção expirada, limpar
              localStorage.removeItem(CHECKOUT_INTENT_KEY);
            }
          } catch (e) {
            localStorage.removeItem(CHECKOUT_INTENT_KEY);
          }
        }
      }
      
      // Detectar modo de recuperação de senha
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        // Limpar hash da URL
        window.history.replaceState(null, '', window.location.pathname);
      }
      
      // Quando o usuário faz login normal ou confirma e-mail, garantir que o modal de recuperação esteja fechado
      if (event === 'SIGNED_IN' && isRecoveryMode) {
        // Se o evento for SIGNED_IN mas não veio de um PASSWORD_RECOVERY (ou hash de recovery), 
        // fechamos o modal para evitar confusão no fluxo de confirmação de e-mail.
        const hash = window.location.hash;
        if (!hash.includes('type=recovery')) {
          setIsRecoveryMode(false);
        }
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
      {(!session || shouldShowLanding() || isRegistering || authView === 'pricing') ? (
        <>
          {authView === 'landing' && (
            <LandingPage 
              onNavigate={(screen) => {
                if (screen === 'pricing' && session) {
                  setForceLanding(false);
                } else {
                  setAuthView(screen);
                  setForceLanding(false);
                }
              }} 
            />
          )}
          {authView === 'pricing' && (
            <PricingPage 
              onBack={() => setAuthView('landing')}
              onNavigateToLogin={() => setAuthView('login')}
              onNavigateToSignup={() => setAuthView('signup')}
              onPaymentConfirmed={() => {
                // Limpar página salva para garantir que vá para o Dashboard
                localStorage.removeItem('studyflow_current_page');
                // Ao confirmar pagamento na PricingPage (fluxo inicial), 
                // recarregamos para que o App.tsx detecte a nova sessão/status
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              }}
            />
          )}
          {authView === 'signup' && (
            <SignupPage
              onBack={() => {
                setAuthView('landing');
                setIsRegistering(false);
              }}
              onNavigateToLogin={() => {
                setAuthView('login');
                setIsRegistering(false);
              }}
              onSuccess={(email) => {
                if (email) {
                  setSignupEmail(email);
                  setAuthView('verify-email');
                } else {
                  setIsRegistering(false); // Libera o app após o cadastro completo (se já logado)
                }
              }} 
              onStartSignup={() => setIsRegistering(true)}
            />
          )}
          {authView === 'verify-email' && (
            <VerifyEmailPage 
              email={signupEmail}
              onNavigateToLogin={() => setAuthView('login')}
              onNavigateToSignup={() => setAuthView('signup')}
            />
          )}
          {(authView === 'login' || authView === 'forgot') && (
            <LoginScreen 
              onBack={() => {
                setAuthView('landing');
                setForceLanding(false);
              }}
              initialMode={authView}
              onNavigateToSignup={() => setAuthView('signup')}
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
