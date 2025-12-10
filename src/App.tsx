import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabType, Subject, StudyLog } from './types';
import { supabase } from './lib/supabase';
import { useSupabaseData } from './hooks/useSupabaseData';
import BottomNav from './components/BottomNav';
import DashboardPage from './pages/DashboardPage';
import TimerPage from './pages/TimerPage';
import RegisterPage from './pages/RegisterPage';
import CyclePage from './pages/CyclePage';
import SettingsModal from './components/SettingsModal';
import { Lock, Mail, ArrowRight, BookOpen, Settings, LogOut, UserPlus, Loader2 } from 'lucide-react';
import ConfirmModal from './components/ConfirmModal';
import AlertModal from './components/AlertModal';
import { useToast } from './contexts/ToastContext'; // <--- IMPORTANTE

// --- TELA DE LOGIN 2.0 (Com Recuperação) ---
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Agora aceita 'forgot' também
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
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
      else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        addToast('Conta criada! Bem-vindo ao time.', 'success');
      } 
      else if (mode === 'forgot') {
        // Lógica de recuperar senha
        // O redirectTo garante que ele volte para o seu site (importante em produção)
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin, 
        });
        if (error) throw error;
        addToast('Link de recuperação enviado para seu e-mail!', 'success');
        setMode('login'); // Volta para login
      }
    } catch (err: any) {
      let msg = err.message;
      if (msg === 'Invalid login credentials') msg = 'E-mail ou senha incorretos.';
      if (msg === 'User already registered') msg = 'Este e-mail já está cadastrado.';
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
            {mode === 'signup' && 'Crie sua conta gratuita.'}
            {mode === 'forgot' && 'Recupere seu acesso.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-6 transition-colors duration-300">
          
          {/* E-MAIL (Sempre aparece) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Seu E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
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

          {/* SENHA (Só aparece em Login e Signup) */}
          {mode !== 'forgot' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Senha</label>
                {mode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input 
                  type="password" 
                  required={mode !== 'forgot'}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="******"
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
              mode === 'login' ? <ArrowRight size={20} /> : 
              mode === 'signup' ? <UserPlus size={20} /> : 
              <Mail size={20} />
            )}
            <span>
              {mode === 'login' && 'Entrar'}
              {mode === 'signup' && 'Criar Conta'}
              {mode === 'forgot' && 'Enviar Link de Recuperação'}
            </span>
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
          {mode === 'forgot' ? (
             <button onClick={() => setMode('login')} className="ml-2 font-bold text-emerald-600 hover:underline">Voltar para Login</button>
          ) : (
             <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} className="ml-2 font-bold text-emerald-600 hover:underline">
               {mode === 'login' ? 'Cadastre-se' : 'Faça Login'}
             </button>
          )}
        </p>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL (O RESTO SEGUE IGUAL, SÓ CUIDADO AO COPIAR O FINAL) ---
function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // ... (TODOS OS USE EFFECTS E HOOKS MANTIDOS IGUAIS) ...
  // Vou apenas replicar o final para garantir que nada quebre:
  
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const {
    subjects, logs, cycleStartDate, dailyGoal, showPerformance, loadingData,
    addSubject, deleteSubject, updateSubject, reorderSubjects,
    addLog, deleteLog, editLog, updateSettings
  } = useSupabaseData(session);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [prefilledTime, setPrefilledTime] = useState<{ hours: number; minutes: number; seconds: number } | undefined>();
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showRestartSuccess, setShowRestartSuccess] = useState(false);
  const [showHardResetConfirm, setShowHardResetConfirm] = useState(false);
  const [showHardResetFinal, setShowHardResetFinal] = useState(false);
  
  const timerIntervalRef = useRef<number | null>(null);
  const timerStartRef = useRef<number | null>(null);
  const timerBaseRef = useRef<number>(0);

  useEffect(() => {
    if (isTimerRunning) {
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
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerStartRef.current = null;
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [isTimerRunning]);

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

  const handleHardReset = () => setShowHardResetConfirm(true);
  const confirmHardResetStep1 = () => { setShowHardResetConfirm(false); setShowHardResetFinal(true); };
  const confirmHardResetFinal = () => {
    handleLogout();
    setShowHardResetFinal(false);
  };

  const renderPage = () => {
    if (loadingData) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>;

    switch (activeTab) {
      case 'dashboard':
         return <DashboardPage subjects={subjects} logs={logs} cycleStartDate={cycleStartDate} onDeleteLog={handleDeleteLog} onEditLog={editLog} dailyGoal={dailyGoal} showPerformance={showPerformance} />;
      case 'timer':
        return <TimerPage onTimerStop={handleTimerStop} timerSeconds={timerSeconds} setTimerSeconds={setTimerSeconds} isTimerRunning={isTimerRunning} setIsTimerRunning={setIsTimerRunning} />;
      case 'register':
        return <RegisterPage subjects={subjects} onAddLog={addLog} prefilledTime={prefilledTime} onTimeClear={() => setPrefilledTime(undefined)} timerSeconds={timerSeconds} isTimerRunning={isTimerRunning} />;
      case 'cycle':
        return <CyclePage subjects={subjects} logs={logs} cycleStartDate={cycleStartDate} onAddSubject={addSubject} onDeleteSubject={deleteSubject} onUpdateSubject={updateSubject} onRestartCycle={() => setShowRestartConfirm(true)} onReorderSubjects={reorderSubjects} />;
      default:
        return null;
    }
  };

  if (authLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;

  if (!session) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative transition-colors duration-300">
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onHardReset={handleHardReset} 
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        dailyGoal={dailyGoal}
        onSetDailyGoal={(val) => updateSettings({ dailyGoal: val })}
        showPerformance={showPerformance}
        onTogglePerformance={() => updateSettings({ showPerformance: !showPerformance })}
      />

      <ConfirmModal isOpen={deleteLogId !== null} title="Excluir Registro" message="Tem certeza?" confirmText="Excluir" cancelText="Cancelar" variant="danger" onConfirm={confirmDeleteLog} onCancel={() => setDeleteLogId(null)} />
      <ConfirmModal isOpen={showRestartConfirm} title="Reiniciar Ciclo?" message="Isso zera as barras de progresso." confirmText="Reiniciar" cancelText="Cancelar" variant="warning" onConfirm={confirmRestartCycle} onCancel={() => setShowRestartConfirm(false)} />
      <AlertModal isOpen={showRestartSuccess} title="Ciclo Reiniciado!" message="Foco na missão! 👊" buttonText="Bora!" variant="success" onClose={() => setShowRestartSuccess(false)} />
      <ConfirmModal isOpen={showHardResetConfirm} title="Sair do App?" message="Deseja deslogar da sua conta?" confirmText="Sair" cancelText="Cancelar" variant="danger" onConfirm={confirmHardResetStep1} onCancel={() => setShowHardResetConfirm(false)} />
      <ConfirmModal isOpen={showHardResetFinal} title="Confirmar Saída" message="Você será desconectado." confirmText="Sim, Sair" cancelText="Voltar" variant="danger" onConfirm={confirmHardResetFinal} onCancel={() => setShowHardResetFinal(false)} />
      
      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <button onClick={handleLogout} className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-lg hover:bg-red-100 hover:text-red-500 transition-all active:scale-95" title="Sair"><LogOut size={20} /></button>
        <button onClick={() => setShowSettings(true)} className="h-12 w-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 hover:rotate-90 duration-300"><Settings size={24} /></button>
      </div>

      <div className="pb-24 pt-2"> 
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 pb-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

export default App;