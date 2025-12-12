import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabType } from './types';
import { supabase } from './lib/supabase';
import { useSupabaseData } from './hooks/useSupabaseData';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar'; // <--- Importação Nova
import DashboardPage from './pages/DashboardPage';
import TimerPage from './pages/TimerPage';
import RegisterPage from './pages/RegisterPage';
import CyclePage from './pages/CyclePage';
import GamificationPage from './pages/GamificationPage';
import SettingsModal from './components/SettingsModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import { Lock, Mail, ArrowRight, BookOpen, Settings, Loader2 } from 'lucide-react';
import ConfirmModal from './components/ConfirmModal';
import AlertModal from './components/AlertModal';
import { useToast } from './contexts/ToastContext';
import { useNotification } from './hooks/useNotification';

// --- TELA DE LOGIN ---
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const { addToast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        addToast('Login realizado com sucesso!', 'success');
      } 
      else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}`,
        });
        if (error) throw error;
        addToast('Link de recuperação enviado para seu e-mail!', 'success');
        setMode('login');
      }
    } catch (err: any) {
      let msg = err.message;
      if (msg === 'Invalid login credentials') msg = 'E-mail ou senha incorretos.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-600 mb-4 shadow-lg shadow-emerald-500/20">
            <BookOpen size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-gray-900 dark:text-white">STUDYFLOW</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {mode === 'login' && 'Entre para sincronizar seus estudos.'}
            {mode === 'forgot' && 'Recupere seu acesso.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-6 transition-colors duration-300">
          
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Seu E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all h-12"
                  placeholder="••••••"
                />
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              mode === 'login' ? <ArrowRight size={20} /> : <Mail size={20} />
            )}
            <span>
              {mode === 'login' ? 'Entrar' : 'Enviar Link'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'forgot' : 'login')}
            className="text-sm text-gray-500 hover:text-emerald-600 hover:underline mt-6 block text-center transition-colors w-full"
          >
            {mode === 'login' ? 'Esqueceu sua senha?' : 'Voltar para o Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

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

  // DATA HOOK
  const {
    subjects, logs, cycleStartDate, dailyGoal, showPerformance, loadingData,
    addSubject, deleteSubject, updateSubject, reorderSubjects,
    addLog, deleteLog, editLog, updateSettings
  } = useSupabaseData(session);

  // UI STATE
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [prefilledTime, setPrefilledTime] = useState<{ hours: number; minutes: number; seconds: number } | undefined>();
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'cronometro' | 'temporizador' | 'pomodoro'>('cronometro');
  const { sendNotification } = useNotification();
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showRestartSuccess, setShowRestartSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
   
  const timerIntervalRef = useRef<number | null>(null);
  const timerStartRef = useRef<number | null>(null);
  const timerBaseRef = useRef<number>(0);
  const countdownIntervalRef = useRef<number | null>(null);
  const countdownSecondsRef = useRef<number>(0);
  const lastTimerSecondsRef = useRef<number>(0);

  // Resetar countdown ao mudar de modo
  useEffect(() => {
    countdownSecondsRef.current = 0;
    lastTimerSecondsRef.current = 0;
  }, [timerMode]);

  // Sincronizar countdownSecondsRef quando timerSeconds muda e está maior (novo tempo configurado)
  useEffect(() => {
    if (timerMode !== 'cronometro' && timerSeconds > lastTimerSecondsRef.current) {
      countdownSecondsRef.current = timerSeconds;
    }
    lastTimerSecondsRef.current = timerSeconds;
  }, [timerSeconds, timerMode]);

  // TIMER - Cronômetro (incrementa) ou Temporizador/Pomodoro (decrementa)
  useEffect(() => {
    // Limpar intervalos anteriores
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    if (isTimerRunning) {
      if (timerMode === 'cronometro') {
        // Cronômetro: contagem progressiva
        if (timerStartRef.current === null) {
          timerStartRef.current = Date.now();
          timerBaseRef.current = timerSeconds;
        }
        const tick = () => {
          const elapsed = Math.floor((Date.now() - timerStartRef.current!) / 1000);
          setTimerSeconds(timerBaseRef.current + elapsed);
        };
        timerIntervalRef.current = window.setInterval(tick, 250);
        tick();
      } else {
        // Temporizador/Pomodoro: contagem regressiva
        // Sincronizar countdownSecondsRef apenas quando inicia pela primeira vez (countdownSecondsRef === 0)
        // OU quando timerSeconds aumenta (novo tempo configurado)
        // NÃO sincronizar quando retoma (countdownSecondsRef > 0 e timerSeconds menor)
        if (countdownSecondsRef.current === 0 || (countdownSecondsRef.current < timerSeconds && timerSeconds > 0)) {
          countdownSecondsRef.current = timerSeconds;
        }
        const tick = () => {
          if (countdownSecondsRef.current <= 0) {
            setIsTimerRunning(false);
            clearInterval(countdownIntervalRef.current!);
            countdownSecondsRef.current = 0;
            // Enviar notificação quando timer acaba
            if (timerMode === 'temporizador') {
              sendNotification('Tempo Esgotado!', { body: 'Sua sessão de estudos acabou.' });
            } else if (timerMode === 'pomodoro') {
              sendNotification('Pomodoro Finalizado!', { body: 'Tempo de foco concluído. Hora de descansar!' });
            }
            return;
          }
          countdownSecondsRef.current -= 1;
          setTimerSeconds(countdownSecondsRef.current);
        };
        countdownIntervalRef.current = window.setInterval(tick, 1000);
        tick();
      }
    } else {
      timerStartRef.current = null;
      // NÃO resetar countdown ref quando pausa - manter o valor atual para continuar de onde parou
    }
    
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isTimerRunning, timerMode, sendNotification, setIsTimerRunning, setTimerSeconds]);

  const handleTimerStop = (hours: number, minutes: number, seconds: number) => {
    setPrefilledTime({ hours, minutes, seconds });
    setActiveTab('register');
  };

  const handleDeleteLog = (id: string) => setDeleteLogId(id);
  const confirmDeleteLog = () => {
    if (deleteLogId) {
      deleteLog(deleteLogId);
      setDeleteLogId(null);
    }
  };

  const confirmRestartCycle = () => {
    updateSettings({ cycleStartDate: Date.now() });
    setShowRestartConfirm(false);
    setShowRestartSuccess(true);
  };

  const handleSettingsLogoutClick = () => {
    setShowLogoutConfirm(true); 
  };

  const confirmLogout = () => {
    handleLogout();
    setShowLogoutConfirm(false);
    setShowSettings(false);
  };

  // Calcular streak para passar para as páginas que precisam
  const calculateStreak = () => {
      if (logs.length === 0) return 0;
      const studyDates = new Set(logs.map(log => new Date(log.timestamp).toLocaleDateString('pt-BR')));
      const today = new Date();
      const todayStr = today.toLocaleDateString('pt-BR');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('pt-BR');
      let streak = 0;
      let currentCheckDate = new Date();
      if (!studyDates.has(todayStr) && !studyDates.has(yesterdayStr)) return 0;
      for (let i = 0; i < 365; i++) {
        const dateString = currentCheckDate.toLocaleDateString('pt-BR');
        if (studyDates.has(dateString)) { streak++; } else { if (i === 0 && !studyDates.has(todayStr)) { currentCheckDate.setDate(currentCheckDate.getDate() - 1); continue; } break; }
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
      }
      return streak;
    };

  const streak = calculateStreak();

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage subjects={subjects} logs={logs} cycleStartDate={cycleStartDate} onDeleteLog={handleDeleteLog} onEditLog={editLog} dailyGoal={dailyGoal} showPerformance={showPerformance} streak={streak} isLoading={loadingData} />;
      case 'timer':
        return <TimerPage onTimerStop={handleTimerStop} timerSeconds={timerSeconds} setTimerSeconds={setTimerSeconds} isTimerRunning={isTimerRunning} setIsTimerRunning={setIsTimerRunning} timerMode={timerMode} setTimerMode={setTimerMode} />;
      case 'register':
        return <RegisterPage subjects={subjects} onAddLog={addLog} prefilledTime={prefilledTime} onTimeClear={() => setPrefilledTime(undefined)} timerSeconds={timerSeconds} isTimerRunning={isTimerRunning} />;
      case 'cycle':
        return <CyclePage subjects={subjects} logs={logs} cycleStartDate={cycleStartDate} onAddSubject={addSubject} onDeleteSubject={deleteSubject} onUpdateSubject={updateSubject} onRestartCycle={() => setShowRestartConfirm(true)} onReorderSubjects={reorderSubjects} isLoading={loadingData} />;
      case 'gamification':
        return <GamificationPage logs={logs} streak={streak} isLoading={loadingData} />;
      default:
        return null;
    }
  };

  if (authLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;

  if (!session) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative transition-colors duration-300">
      {/* Modal de Redefinição de Senha - Bloqueia o app até ser concluído */}
      <ResetPasswordModal 
        isOpen={isRecoveryMode} 
        onClose={() => setIsRecoveryMode(false)} 
      />

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onHardReset={handleSettingsLogoutClick}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        dailyGoal={dailyGoal}
        onSetDailyGoal={(val) => updateSettings({ dailyGoal: val })}
        showPerformance={showPerformance}
        onTogglePerformance={() => updateSettings({ showPerformance: !showPerformance })}
        subjects={subjects}
        logs={logs}
        userEmail={session?.user?.email}
      />

      <ConfirmModal isOpen={deleteLogId !== null} title="Excluir Registro" message="Tem certeza?" confirmText="Excluir" cancelText="Cancelar" variant="danger" onConfirm={confirmDeleteLog} onCancel={() => setDeleteLogId(null)} />
      <ConfirmModal isOpen={showRestartConfirm} title="Reiniciar Ciclo?" message="Isso zera as barras de progresso." confirmText="Reiniciar" cancelText="Cancelar" variant="warning" onConfirm={confirmRestartCycle} onCancel={() => setShowRestartConfirm(false)} />
      <AlertModal isOpen={showRestartSuccess} title="Ciclo Reiniciado!" message="Foco na missão! 👊" buttonText="Bora!" variant="success" onClose={() => setShowRestartSuccess(false)} />
      
      {/* Modal de Confirmação de Logout */}
      <ConfirmModal 
        isOpen={showLogoutConfirm} 
        title="Sair do App?" 
        message="Você será desconectado da sua conta." 
        confirmText="Sair" 
        cancelText="Voltar" 
        variant="danger" 
        onConfirm={confirmLogout} 
        onCancel={() => setShowLogoutConfirm(false)} 
      />
      
      {/* Sidebar para Desktop */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* BOTÃO FLUTUANTE: CONFIGURAÇÕES */}
      <button 
        onClick={() => setShowSettings(true)}
        className="fixed top-6 right-6 z-50 h-12 w-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 duration-300 group"
        title="Configurações"
      >
        <Settings size={24} className="transition-transform duration-300 group-hover:rotate-90" />
      </button>

      {/* Conteúdo Principal com Ajuste de Margem para Desktop */}
      <div className="pb-24 pt-2 md:ml-64 md:pb-8"> 
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* BottomNav - Apenas Mobile */}
      <div className="md:hidden">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

export default App;