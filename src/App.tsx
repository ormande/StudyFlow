import { useState, useEffect, useRef } from 'react';
import { TabType, Subject, StudyLog } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import BottomNav from './components/BottomNav';
import DashboardPage from './pages/DashboardPage';
import TimerPage from './pages/TimerPage';
import RegisterPage from './pages/RegisterPage';
import CyclePage from './pages/CyclePage';
import SettingsModal from './components/SettingsModal';
import { Lock, Mail, ArrowRight, BookOpen, Settings } from 'lucide-react';

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

  // Lógica de Tema Manual
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('studyflow_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
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
  
  const [prefilledTime, setPrefilledTime] = useState<{ hours: number; minutes: number; seconds: number } | undefined>();
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
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
    if (confirm('Excluir este registro?')) {
      setLogs(logs.filter((log) => log.id !== id));
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

  const handleRestartCycle = () => {
    if (confirm("Tem certeza, Guerreiro? Isso vai zerar as barras de progresso para começar um novo ciclo. Seu histórico de horas continua salvo.")) {
      setCycleStartDate(Date.now());
      alert("Ciclo reiniciado! Foco na missão! 👊");
    }
  };

  const handleHardReset = () => {
    const confirm1 = confirm("⚠️ ATENÇÃO GUERREIRO! ⚠️\n\nIsso vai apagar TODAS as matérias, histórico e estatísticas.\n\nVocê vai começar o app do zero absoluto. Tem certeza?");
    if (confirm1) {
      const confirm2 = confirm("Última chance: Confirma a exclusão total dos dados?");
      if (confirm2) {
        localStorage.removeItem('studyflow_subjects');
        localStorage.removeItem('studyflow_logs');
        localStorage.removeItem('studyflow_cycle_start');
        window.location.reload();
      }
    }
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
         return <DashboardPage subjects={subjects} logs={logs} cycleStartDate={cycleStartDate} onDeleteLog={handleDeleteLog} />;
      case 'timer':
        return <TimerPage onTimerStop={handleTimerStop} timerSeconds={timerSeconds} setTimerSeconds={setTimerSeconds} isTimerRunning={isTimerRunning} setIsTimerRunning={setIsTimerRunning} />;
      case 'register':
        return <RegisterPage subjects={subjects} onAddLog={handleAddLog} prefilledTime={prefilledTime} onTimeClear={() => setPrefilledTime(undefined)} timerSeconds={timerSeconds} isTimerRunning={isTimerRunning} />;
      case 'cycle':
        return <CyclePage subjects={subjects} logs={logs} cycleStartDate={cycleStartDate} onAddSubject={handleAddSubject} onDeleteSubject={handleDeleteSubject} onUpdateSubject={handleUpdateSubject} onRestartCycle={handleRestartCycle} />;
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
      />

      <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-40 flex justify-between items-center shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2 text-gray-800 dark:text-white font-black text-xl tracking-tight">
          <BookOpen className="text-emerald-500" size={24} />
          STUDYFLOW
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="h-10 w-10 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-gray-600 transition-all"
        >
           <Settings size={20} />
        </button>
      </div>

      <div className="pb-40"> 
        {renderPage()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 pb-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

export default App;