import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { TabType, Subject, StudyLog } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import BottomNav from './components/BottomNav';
import DashboardPage from './pages/DashboardPage';
import TimerPage from './pages/TimerPage';
import RegisterPage from './pages/RegisterPage';
import CyclePage from './pages/CyclePage';
import SettingsModal from './components/SettingsModal';
import { Lock, Mail, ArrowRight, BookOpen, Settings } from 'lucide-react';
import ConfirmModal from './components/ConfirmModal';
import AlertModal from './components/AlertModal';

// --- TELA DE LOGIN ---
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === 'Concurso2025') {
      onLogin();
    } else {
      setError('Senha incorreta, guerreiro. Verifique seu e-mail de compra.');
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
          <p className="text-gray-500 dark:text-gray-400 text-sm">Área restrita para membros.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-6 transition-colors duration-300">
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
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Senha de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Sua senha única"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <span>Acessar Painel</span>
            <ArrowRight size={20} />
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Este acesso é individual e intransferível.
        </p>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

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
    const access = localStorage.getItem('studyflow_access_token');
    if (access === 'authorized_2025') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem('studyflow_access_token', 'authorized_2025');
    setIsAuthenticated(true);
  };

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [subjects, setSubjects] = useLocalStorage<Subject[]>('studyflow_subjects', []);
  const [logs, setLogs] = useLocalStorage<StudyLog[]>('studyflow_logs', []);
  const [cycleStartDate, setCycleStartDate] = useLocalStorage<number>('studyflow_cycle_start', Date.now());
  const [dailyGoal, setDailyGoal] = useLocalStorage<number>('studyflow_daily_goal', 0);
  
  // NOVO ESTADO: Privacidade no Compartilhamento
  const [showPerformance, setShowPerformance] = useLocalStorage<boolean>('studyflow_show_performance', true);
  
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
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      timerStartRef.current = null;
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  const handleTimerStop = (hours: number, minutes: number, seconds: number) => {
    setPrefilledTime({ hours, minutes, seconds });
    setActiveTab('register');
  };

  const handleAddLog = (log: Omit<StudyLog, 'id' | 'timestamp'>) => {
    const newLog: StudyLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setLogs([...logs, newLog]);
  };
  const handleDeleteLog = (id: string) => {
  setDeleteLogId(id);
};

const confirmDeleteLog = () => {
  if (deleteLogId) {
    setLogs(logs.filter((log) => log.id !== deleteLogId));
    setDeleteLogId(null);
  }
};

  const handleEditLog = (id: string, updates: Partial<StudyLog>) => {
    setLogs(logs.map((log) => (log.id === id ? { ...log, ...updates } : log)));
  };

  const handleAddSubject = (subject: Omit<Subject, 'id'>) => {
    const newSubject: Subject = {
      ...subject,
      id: Date.now().toString(),
    };
    setSubjects([...subjects, newSubject]);
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const handleUpdateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects(
      subjects.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleReorderSubjects = (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
  };

  const handleRestartCycle = () => {
  setShowRestartConfirm(true);
};

const confirmRestartCycle = () => {
  setCycleStartDate(Date.now());
  setShowRestartConfirm(false);
  setShowRestartSuccess(true);
};

  const handleHardReset = () => {
  setShowHardResetConfirm(true);
};

const confirmHardResetStep1 = () => {
  setShowHardResetConfirm(false);
  setShowHardResetFinal(true);
};

const confirmHardResetFinal = () => {
  localStorage.removeItem('studyflow_subjects');
  localStorage.removeItem('studyflow_logs');
  localStorage.removeItem('studyflow_cycle_start');
  localStorage.removeItem('studyflow_daily_goal');
  localStorage.removeItem('studyflow_show_performance');
  window.location.reload();
};

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
         // Passa o estado de performance para o Dashboard
         return <DashboardPage subjects={subjects} logs={logs} cycleStartDate={cycleStartDate} onDeleteLog={handleDeleteLog} onEditLog={handleEditLog} dailyGoal={dailyGoal} showPerformance={showPerformance} />;
      case 'timer':
        return <TimerPage onTimerStop={handleTimerStop} timerSeconds={timerSeconds} setTimerSeconds={setTimerSeconds} isTimerRunning={isTimerRunning} setIsTimerRunning={setIsTimerRunning} />;
      case 'register':
        return <RegisterPage subjects={subjects} onAddLog={handleAddLog} prefilledTime={prefilledTime} onTimeClear={() => setPrefilledTime(undefined)} timerSeconds={timerSeconds} isTimerRunning={isTimerRunning} />;
      case 'cycle':
        return <CyclePage subjects={subjects} logs={logs} cycleStartDate={cycleStartDate} onAddSubject={handleAddSubject} onDeleteSubject={handleDeleteSubject} onUpdateSubject={handleUpdateSubject} onRestartCycle={handleRestartCycle} onReorderSubjects={handleReorderSubjects} />;
      default:
        return null;
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-900"></div>;

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative transition-colors duration-300">
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onHardReset={handleHardReset}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        dailyGoal={dailyGoal}
        onSetDailyGoal={setDailyGoal}
        // Passa o controle de performance para o Settings
        showPerformance={showPerformance}
        onTogglePerformance={() => setShowPerformance(!showPerformance)}
      />

      {/* Modal: Excluir Registro */}
<ConfirmModal
  isOpen={deleteLogId !== null}
  title="Excluir Registro"
  message="Tem certeza que deseja excluir este registro?"
  confirmText="Excluir"
  cancelText="Cancelar"
  variant="danger"
  onConfirm={confirmDeleteLog}
  onCancel={() => setDeleteLogId(null)}
/>

{/* Modal: Reiniciar Ciclo - Confirmação */}
<ConfirmModal
  isOpen={showRestartConfirm}
  title="Reiniciar Ciclo?"
  message="Isso vai zerar as barras de progresso para começar um novo ciclo. Seu histórico de horas continua salvo."
  confirmText="Reiniciar"
  cancelText="Cancelar"
  variant="warning"
  onConfirm={confirmRestartCycle}
  onCancel={() => setShowRestartConfirm(false)}
/>

{/* Modal: Reiniciar Ciclo - Sucesso */}
<AlertModal
  isOpen={showRestartSuccess}
  title="Ciclo Reiniciado!"
  message="Foco na missão! 👊"
  buttonText="Bora!"
  variant="success"
  onClose={() => setShowRestartSuccess(false)}
/>

{/* Modal: Hard Reset - Passo 1 */}
<ConfirmModal
  isOpen={showHardResetConfirm}
  title="⚠️ ATENÇÃO GUERREIRO!"
  message="Isso vai apagar TODAS as matérias, histórico e estatísticas. Você vai começar o app do zero absoluto."
  confirmText="Continuar"
  cancelText="Cancelar"
  variant="danger"
  onConfirm={confirmHardResetStep1}
  onCancel={() => setShowHardResetConfirm(false)}
/>

{/* Modal: Hard Reset - Passo 2 (Final) */}
<ConfirmModal
  isOpen={showHardResetFinal}
  title="Última Chance!"
  message="Confirma a exclusão total dos dados? Essa ação não pode ser desfeita."
  confirmText="Apagar Tudo"
  cancelText="Voltar"
  variant="danger"
  onConfirm={confirmHardResetFinal}
  onCancel={() => setShowHardResetFinal(false)}
/>
      
      <button 
  onClick={() => setShowSettings(true)}
  className="fixed top-6 right-6 z-50 h-12 w-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 hover:scale-110 duration-300"
>
         <Settings size={24} />
      </button>

      <div className="pb-24 pt-2"> 
  <AnimatePresence mode="wait">
    <motion.div
      key={activeTab}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
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