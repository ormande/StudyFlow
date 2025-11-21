import { useState, useEffect } from 'react';
import { TabType, Subject, StudyLog } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import BottomNav from './components/BottomNav';
import DashboardPage from './pages/DashboardPage';
import TimerPage from './pages/TimerPage';
import RegisterPage from './pages/RegisterPage';
import CyclePage from './pages/CyclePage';
import SettingsModal from './components/SettingsModal';
import { Lock, Mail, ArrowRight, BookOpen, Settings } from 'lucide-react';

// --- TELA DE LOGIN (DESIGN CLARO / LIGHT MODE) ---
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-800">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header do Login - ATUALIZADO COM CORES INVERTIDAS */}
        <div className="text-center">
          {/* Fundo Verde Forte */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-600 mb-4 shadow-lg shadow-emerald-500/20">
            {/* Ícone Branco */}
            <BookOpen size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-gray-900">STUDYFLOW</h1>
          <p className="text-gray-500 text-sm">Área restrita para membros.</p>
        </div>

        {/* Formulário Claro */}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Seu E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Senha de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
              {/* Senha Oculta e Teclado Normal */}
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Sua senha única"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center font-bold bg-red-50 p-3 rounded-xl border border-red-100">
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

        <p className="text-center text-xs text-gray-400">
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

  const handleAddSubject = (subject: Omit<Subject, 'id'>) => {
    const newSubject: Subject = {
      ...subject,
      id: Date.now().toString(),
      timestamp: Date.now(),
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
        // Removido o logout forçado para facilitar o reset rápido
        window.location.reload();
      }
    }
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage 
            subjects={subjects} 
            logs={logs} 
            cycleStartDate={cycleStartDate}
          />
        );
      case 'timer':
        return (
          <TimerPage
            onTimerStop={handleTimerStop}
            timerSeconds={timerSeconds}
            setTimerSeconds={setTimerSeconds}
            isTimerRunning={isTimerRunning}
            setIsTimerRunning={setIsTimerRunning}
          />
        );
      case 'register':
        return (
          <RegisterPage
            subjects={subjects}
            onAddLog={handleAddLog}
            prefilledTime={prefilledTime}
            onTimeClear={() => setPrefilledTime(undefined)}
            timerSeconds={timerSeconds}
            isTimerRunning={isTimerRunning}
          />
        );
      case 'cycle':
        return (
          <CyclePage
            subjects={subjects}
            logs={logs}
            cycleStartDate={cycleStartDate}
            onAddSubject={handleAddSubject}
            onDeleteSubject={handleDeleteSubject}
            onUpdateSubject={handleUpdateSubject}
            onRestartCycle={handleRestartCycle}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-900"></div>;

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onHardReset={handleHardReset}
      />

      {/* HEADER FIXO NO TOPO */}
      <div className="bg-white p-4 border-b border-gray-100 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 text-gray-800 font-black text-xl tracking-tight">
          <BookOpen className="text-emerald-500" size={24} />
          STUDYFLOW
        </div>
        {/* AQUI ESTÁ A ENGRENAGEM */}
        <button 
          onClick={() => setShowSettings(true)}
          className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
        >
           <Settings size={20} />
        </button>
      </div>

      <div className="pb-40"> 
        {renderPage()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white pb-6 border-t border-gray-200">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

export default App;