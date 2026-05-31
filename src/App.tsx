import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { motion } from "framer-motion";
import MainApp from "./components/MainApp";
import ResetPasswordModal from "./components/ResetPasswordModal";
import LandingPage from "./pages/LandingPage";
import LoginScreen from "./components/LoginScreen";
import PricingPage from "./pages/PricingPage";
import SignupPage from "./pages/SignupPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import { useAppearance } from "./hooks/useAppearance";
import { confirmSubscriptionAfterPayment } from "./utils/subscriptionPolling";
import {
  ensureValidSession,
  setupSessionRefreshOnFocus,
} from "./lib/sessionGuard";

const CHECKOUT_INTENT_KEY = "studyflow_checkout_intent";

// --- APP PRINCIPAL ---
function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [authView, setAuthView] = useState<
    "landing" | "login" | "forgot" | "pricing" | "signup" | "verify-email"
  >(() => {
    // Verificar se deve começar pela landing page (padrão agora)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("landing") === "true") return "landing";
    return "landing";
  });
  const [forceLanding, setForceLanding] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState("");

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
      if (hash.includes("type=recovery")) {
        setIsRecoveryMode(true);
        // Limpar hash da URL após detectar
        window.history.replaceState(null, "", window.location.pathname);
      }
    };

    // Verificar parâmetro landing ou tab na URL na inicialização
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("landing") === "true") {
      setForceLanding(true);
      // Limpar parâmetro da URL imediatamente
      const url = new URL(window.location.href);
      url.searchParams.delete("landing");
      window.history.replaceState(null, "", url.pathname + url.search);
    }

    const tabIntent = urlParams.get("tab");
    if (tabIntent && !session) {
      // Salvar intenção de aba apenas se não estiver logado
      sessionStorage.setItem("studyflow_redirect_tab", tabIntent);
      // Limpar parâmetro da URL
      const url = new URL(window.location.href);
      url.searchParams.delete("tab");
      window.history.replaceState(null, "", url.pathname + url.search);
    } else if (tabIntent && session) {
      // Se já estiver logado, podemos tentar mudar a aba diretamente se o MainApp expuser um método,
      // mas como ele é inicializado via activeTab state, o mais simples é limpar o parâmetro
      // e deixar o MainApp carregar a aba atual ou a salva.
      const url = new URL(window.location.href);
      url.searchParams.delete("tab");
      window.history.replaceState(null, "", url.pathname + url.search);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      // ✅ ALTERADO: Permitir que usuários usem o app mesmo sem confirmar email
      // O email pode ser confirmado depois, e a autenticação ainda funciona
      setSession(session);
      setAuthLoading(false);
      // Verificar hash após obter sessão
      checkRecoveryHash();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session) {
        setSession(session);
        return;
      }

      if (event === "SIGNED_OUT") {
        setSession(null);
        setAuthView("login");
        sessionStorage.clear();
        localStorage.removeItem("studyflow_current_page");
        localStorage.removeItem("studyflow_more_scroll");
        return;
      }

      if (session) {
        setSession(session);

        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          const savedIntent = localStorage.getItem(CHECKOUT_INTENT_KEY);
          if (savedIntent) {
            try {
              const intent = JSON.parse(savedIntent);
              const thirtyMinutes = 30 * 60 * 1000;
              if (Date.now() - intent.timestamp < thirtyMinutes) {
                setAuthView("pricing");
              } else {
                localStorage.removeItem(CHECKOUT_INTENT_KEY);
              }
            } catch {
              localStorage.removeItem(CHECKOUT_INTENT_KEY);
            }
          }
        }

        if (event === "PASSWORD_RECOVERY") {
          setIsRecoveryMode(true);
          window.history.replaceState(null, "", window.location.pathname);
        }

        if (event === "SIGNED_IN" && isRecoveryMode) {
          const hash = window.location.hash;
          if (!hash.includes("type=recovery")) {
            setIsRecoveryMode(false);
          }
        }

        return;
      }

      // Sessão nula sem logout explícito — tenta recuperar antes de desmontar o app
      setTimeout(() => {
        void ensureValidSession().then((recovered) => {
          setSession(recovered);
        });
      }, 0);
    });

    const removeFocusListener = setupSessionRefreshOnFocus();

    // Verificar hash na montagem do componente
    checkRecoveryHash();

    return () => {
      subscription.unsubscribe();
      removeFocusListener();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
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
      {!session ||
      shouldShowLanding() ||
      isRegistering ||
      authView === "pricing" ? (
        <>
          {authView === "landing" && (
            <LandingPage
              onNavigate={(screen) => {
                if (screen === "pricing" && session) {
                  setForceLanding(false);
                } else {
                  setAuthView(screen);
                  setForceLanding(false);
                }
              }}
            />
          )}
          {authView === "pricing" && (
            <PricingPage
              onBack={() => setAuthView("landing")}
              onNavigateToLogin={() => setAuthView("login")}
              onNavigateToSignup={() => setAuthView("signup")}
              onPaymentConfirmed={async () => {
                localStorage.removeItem("studyflow_current_page");
                const userId = session?.user?.id;
                if (userId) {
                  await confirmSubscriptionAfterPayment(userId);
                }
                window.location.reload();
              }}
            />
          )}
          {authView === "signup" && (
            <SignupPage
              onBack={() => {
                setAuthView("landing");
                setIsRegistering(false);
              }}
              onNavigateToLogin={() => {
                setAuthView("login");
                setIsRegistering(false);
              }}
              onSuccess={(email) => {
                setIsRegistering(false);
                if (email) {
                  // Confirmação de e-mail obrigatória — sem sessão imediata
                  setPendingVerifyEmail(email);
                  setAuthView("verify-email");
                  requestAnimationFrame(() => {
                    window.scrollTo(0, 0);
                    document.documentElement.scrollTop = 0;
                    document.body.scrollTop = 0;
                  });
                  return;
                }
                // Cadastro com sessão imediata — entra no app
              }}
              onStartSignup={() => setIsRegistering(true)}
            />
          )}
          {authView === "verify-email" && pendingVerifyEmail && (
            <VerifyEmailPage
              email={pendingVerifyEmail}
              onNavigateToLogin={() => {
                setAuthView("login");
                setPendingVerifyEmail("");
              }}
              onNavigateToSignup={() => {
                setAuthView("signup");
                setPendingVerifyEmail("");
              }}
            />
          )}
          {(authView === "login" || authView === "forgot") && (
            <LoginScreen
              onBack={() => {
                setAuthView("landing");
                setForceLanding(false);
              }}
              initialMode={authView}
              onNavigateToSignup={() => setAuthView("signup")}
            />
          )}
        </>
      ) : (
        <MainApp session={session} onHardReset={handleLogout} />
      )}
    </div>
  );
}

export default App;
