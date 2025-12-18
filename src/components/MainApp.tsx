import { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabType } from '../types';
import { useSupabaseData } from '../hooks/useSupabaseData';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import DashboardPage from '../pages/DashboardPage';
import RegisterPage from '../pages/RegisterPage';
import MorePage from '../pages/MorePage';
// Lazy loading para páginas grandes
const TimerPage = lazy(() => import('../pages/TimerPage'));
const CyclePage = lazy(() => import('../pages/CyclePage'));
const GamificationPage = lazy(() => import('../pages/GamificationPage'));
import SettingsModal from './SettingsModal';
import FeedbackModal from './FeedbackModal';
import HistoryModal from './HistoryModal';
import ChangePasswordModal from './ChangePasswordModal';
import { Loader2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import AlertModal from './AlertModal';
import { useNotification } from '../hooks/useNotification';
import { useToast } from '../contexts/ToastContext';
import OnboardingTour from './OnboardingTour';

interface MainAppProps {
  session: any;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onHardReset: () => void;
}

export default function MainApp({
  session,
  isDarkMode,
  onToggleTheme,
  onHardReset,
}: MainAppProps) {
  // DATA HOOK
  const {
    subjects, logs, cycleStartDate, dailyGoal, showPerformance, loadingData,
    addSubject, deleteSubject, updateSubject, reorderSubjects,
    addLog, deleteLog, editLog, updateSettings
  } = useSupabaseData(session);

  // UI STATE
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [prefilledTime, setPrefilledTime] = useState<{ hours: number; minutes: number; seconds: number } | undefined>();
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'cronometro' | 'temporizador' | 'pomodoro'>('cronometro');
  const { sendNotification } = useNotification();
  const { addToast } = useToast();
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

  // useCallback para funções de callback
  const handleTimerStop = useCallback((hours: number, minutes: number, seconds: number) => {
    setPrefilledTime({ hours, minutes, seconds });
    setActiveTab('register');
  }, []);

  const handleDeleteLog = useCallback((id: string) => {
    setDeleteLogId(id);
  }, []);

  const confirmDeleteLog = useCallback(() => {
    if (deleteLogId) {
      deleteLog(deleteLogId);
      setDeleteLogId(null);
    }
  }, [deleteLogId, deleteLog]);

  const confirmRestartCycle = useCallback(() => {
    updateSettings({ cycleStartDate: Date.now() });
    setShowRestartConfirm(false);
    setShowRestartSuccess(true);
  }, [updateSettings]);

  const handleSettingsLogoutClick = useCallback(() => {
    setShowLogoutConfirm(true); 
  }, []);

  const confirmLogout = useCallback(() => {
    onHardReset();
    setShowLogoutConfirm(false);
    setShowSettings(false);
  }, [onHardReset]);

  const handleRestartCycle = useCallback(() => {
    setShowRestartConfirm(true);
  }, []);

  const handleTimeClear = useCallback(() => {
    setPrefilledTime(undefined);
  }, []);

  // useMemo para calcular streak (evita recálculo desnecessário)
  const streak = useMemo(() => {
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
  }, [logs]);

  // useCallback para callbacks passados como props
  const handleAddSubject = useCallback((subject: Omit<import('../types').Subject, 'id'>) => {
    addSubject(subject);
  }, [addSubject]);

  const handleDeleteSubject = useCallback((id: string) => {
    deleteSubject(id);
  }, [deleteSubject]);

  const handleUpdateSubject = useCallback((id: string, subject: Partial<import('../types').Subject>) => {
    updateSubject(id, subject);
  }, [updateSubject]);

  const handleReorderSubjects = useCallback((subjects: import('../types').Subject[]) => {
    reorderSubjects(subjects);
  }, [reorderSubjects]);

  const handleAddLog = useCallback((log: Omit<import('../types').StudyLog, 'id' | 'timestamp' | 'date'>) => {
    addLog(log);
  }, [addLog]);

  const handleEditLog = useCallback((id: string, updates: Partial<import('../types').StudyLog>) => {
    editLog(id, updates);
  }, [editLog]);

  const handleSetDailyGoal = useCallback((val: number) => {
    updateSettings({ dailyGoal: val });
  }, [updateSettings]);

  const handleTogglePerformance = useCallback(() => {
    updateSettings({ showPerformance: !showPerformance });
  }, [showPerformance, updateSettings]);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const handleCancelDeleteLog = useCallback(() => {
    setDeleteLogId(null);
  }, []);

  const handleCancelRestartCycle = useCallback(() => {
    setShowRestartConfirm(false);
  }, []);

  const handleCloseRestartSuccess = useCallback(() => {
    setShowRestartSuccess(false);
  }, []);

  const handleCancelLogout = useCallback(() => {
    setShowLogoutConfirm(false);
  }, []);

  // Handlers para MorePage
  const handleNavigateToGamification = useCallback(() => {
    setActiveTab('gamification');
  }, []);

  const handleOpenHistory = useCallback(() => {
    setShowHistoryModal(true);
  }, []);

  const handleOpenTutorial = useCallback(() => {
    // Navegar para dashboard
    setActiveTab('dashboard');
    // Reiniciar o tutorial
    localStorage.removeItem('studyflow_tour_completed');
    if ((window as any).restartOnboardingTour) {
      (window as any).restartOnboardingTour();
      addToast('Tutorial reiniciado! O tour começará em breve.', 'success');
    } else {
      addToast('Tutorial reiniciado! Recarregue a página para ver o tour.', 'success');
      setTimeout(() => window.location.reload(), 1000);
    }
  }, [addToast]);

  const handleOpenSecurity = useCallback(() => {
    setShowChangePasswordModal(true);
  }, []);

  const handleOpenStatistics = useCallback(() => {
    addToast('📊 Estatísticas detalhadas em breve!', 'info');
  }, [addToast]);

  const handleOpenAppearance = useCallback(() => {
    addToast('🎨 Configuração de aparência em breve!', 'info');
  }, [addToast]);

  const handleOpenGoals = useCallback(() => {
    addToast('🎯 Gerenciamento de metas em breve!', 'info');
  }, [addToast]);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleLogout = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage subjects={subjects} logs={logs} cycleStartDate={cycleStartDate} onDeleteLog={handleDeleteLog} onEditLog={handleEditLog} dailyGoal={dailyGoal} showPerformance={showPerformance} streak={streak} isLoading={loadingData} />;
      case 'timer':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <TimerPage onTimerStop={handleTimerStop} timerSeconds={timerSeconds} setTimerSeconds={setTimerSeconds} isTimerRunning={isTimerRunning} setIsTimerRunning={setIsTimerRunning} timerMode={timerMode} setTimerMode={setTimerMode} />
          </Suspense>
        );
      case 'register':
        return <RegisterPage subjects={subjects} onAddLog={handleAddLog} prefilledTime={prefilledTime} onTimeClear={handleTimeClear} timerSeconds={timerSeconds} isTimerRunning={isTimerRunning} />;
      case 'cycle':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <CyclePage subjects={subjects} logs={logs} cycleStartDate={cycleStartDate} onAddSubject={handleAddSubject} onDeleteSubject={handleDeleteSubject} onUpdateSubject={handleUpdateSubject} onRestartCycle={handleRestartCycle} onReorderSubjects={handleReorderSubjects} isLoading={loadingData} />
          </Suspense>
        );
      case 'gamification':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <GamificationPage logs={logs} streak={streak} isLoading={loadingData} />
          </Suspense>
        );
      case 'more':
        return (
          <MorePage
            session={session}
            onNavigateToGamification={handleNavigateToGamification}
            onOpenHistory={handleOpenHistory}
            onOpenFeedback={() => setShowFeedbackModal(true)}
            onOpenTutorial={handleOpenTutorial}
            onOpenSecurity={handleOpenSecurity}
            onOpenSettings={handleOpenSettings}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative transition-colors duration-300">
      <SettingsModal 
        isOpen={showSettings} 
        onClose={handleCloseSettings} 
        onHardReset={handleSettingsLogoutClick}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        dailyGoal={dailyGoal}
        onSetDailyGoal={handleSetDailyGoal}
        showPerformance={showPerformance}
        onTogglePerformance={handleTogglePerformance}
        subjects={subjects}
        logs={logs}
        userEmail={session?.user?.email}
        userId={session?.user?.id}
      />

      <ConfirmModal 
        isOpen={deleteLogId !== null} 
        title="Excluir Registro" 
        message="Tem certeza?" 
        confirmText="Excluir" 
        cancelText="Cancelar" 
        variant="danger" 
        onConfirm={confirmDeleteLog} 
        onCancel={handleCancelDeleteLog} 
      />
      <ConfirmModal 
        isOpen={showRestartConfirm} 
        title="Reiniciar Ciclo?" 
        message="Isso zera as barras de progresso." 
        confirmText="Reiniciar" 
        cancelText="Cancelar" 
        variant="warning" 
        onConfirm={confirmRestartCycle} 
        onCancel={handleCancelRestartCycle} 
      />
      <AlertModal 
        isOpen={showRestartSuccess} 
        title="Ciclo Reiniciado!" 
        message="Foco na missão! 👊" 
        buttonText="Bora!" 
        variant="success" 
        onClose={handleCloseRestartSuccess} 
      />
      
      {/* Modal de Confirmação de Logout */}
      <ConfirmModal 
        isOpen={showLogoutConfirm} 
        title="Sair do App?" 
        message="Você será desconectado da sua conta." 
        confirmText="Sair" 
        cancelText="Voltar" 
        variant="danger" 
        onConfirm={confirmLogout} 
        onCancel={handleCancelLogout} 
      />
      
      {/* Onboarding Tour */}
      <OnboardingTour 
        isDarkMode={isDarkMode} 
        onCloseSettings={() => setShowSettings(false)}
      />

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)}
        userEmail={session?.user?.email}
        userId={session?.user?.id}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        logs={logs}
        subjects={subjects}
        onDeleteLog={handleDeleteLog}
        onEditLog={handleEditLog}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      {/* Sidebar para Desktop */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        session={session}
        onOpenFeedback={() => setShowFeedbackModal(true)}
        onOpenHistory={handleOpenHistory}
        onOpenTutorial={handleOpenTutorial}
        onOpenSecurity={handleOpenSecurity}
        onOpenStatistics={handleOpenStatistics}
        onOpenAppearance={handleOpenAppearance}
        onOpenGoals={handleOpenGoals}
        onOpenSettings={handleOpenSettings}
        onLogout={handleLogout}
      />

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
