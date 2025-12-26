import { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabType } from '../types';
import { FADE_UP_ANIMATION } from '../utils/animations';
import { useSupabaseData } from '../hooks/useSupabaseData';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import DashboardPage from '../pages/DashboardPage';
import RegisterPage from '../pages/RegisterPage';
import MorePage from '../pages/MorePage';
// Lazy loading para páginas grandes
const TimerPage = lazy(() => import('../pages/TimerPage'));
const CyclePage = lazy(() => import('../pages/CyclePage'));
const AchievementsPage = lazy(() => import('../pages/AchievementsPage'));
const EloPage = lazy(() => import('../pages/EloPage'));
const GoalsPage = lazy(() => import('../pages/GoalsPage'));
const StatsPage = lazy(() => import('../pages/StatsPage'));
const AppearancePage = lazy(() => import('../pages/AppearancePage'));
const HistoryPage = lazy(() => import('../pages/HistoryPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const TutorialPage = lazy(() => import('../pages/TutorialPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
import PricingPage from '../pages/PricingPage';
import PlanPage from '../pages/PlanPage';
import FeedbackModal from './FeedbackModal';
import HistoryModal from './HistoryModal';
import ChangePasswordModal from './ChangePasswordModal';
import { Loader2, Zap } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import AlertModal from './AlertModal';
import { useNotification } from '../hooks/useNotification';
import { useToast } from '../contexts/ToastContext';
import { AchievementsProvider, useAchievementsContext } from '../contexts/AchievementsContext';
import { XPProvider, useXPContext } from '../contexts/XPContext';
import { calculateXPFromLog } from '../hooks/useXP';
import FabTimer from './FabTimer';
import EloUpgradeModal from './EloUpgradeModal';

interface MainAppProps {
  session: any;
  onHardReset: () => void;
}

export default function MainApp({
  session,
  onHardReset,
}: MainAppProps) {
  // DATA HOOK
  const {
    subjects, logs, stats, allLogDates, cycleStartDate, dailyGoal, showPerformance, loadingData,
    subscriptionStatus, trialEndsAt, subscriptionType: subType, tutorialCompleted, welcomeSeen,
    hasMoreLogs, loadingMoreLogs, loadMoreLogs, searchLogs, searchTerm,
    daysFilter, applyDaysFilter,
    addSubject, deleteSubject, updateSubject, reorderSubjects,
    addLog, deleteLog, editLog, updateSettings, markTutorialCompleted
  } = useSupabaseData(session);

  // UI STATE
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
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

  // useMemo para calcular streak (evita recálculo desnecessário) - DEVE VIR ANTES DE useAchievements
  // ✅ OTIMIZADO: Usa allLogDates (apenas date + timestamp) ao invés de logs completos
  // Isso permite calcular streak corretamente mesmo com apenas 100 logs carregados na UI
  const streak = useMemo(() => {
    if (allLogDates.length === 0) return 0;
    const studyDates = new Set(allLogDates.map(log => new Date(log.timestamp).toLocaleDateString('pt-BR')));
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
  }, [allLogDates]);

  // O hook será usado via contexto no componente interno

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
            // (só chega aqui se estava rodando, pois o intervalo só existe quando isTimerRunning é true)
            const modeLabel = timerMode === 'pomodoro' ? 'Pomodoro' : 'Ciclo';
            sendNotification(`${modeLabel} Finalizado!`, {
              body: 'Hora de descansar (ou voltar a estudar). Bom trabalho!',
              icon: '/icon-192.png'
            });
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


  const confirmLogout = useCallback(() => {
    onHardReset();
    setShowLogoutConfirm(false);
  }, [onHardReset]);

  const handleRestartCycle = useCallback(() => {
    setShowRestartConfirm(true);
  }, []);

  const handleTimeClear = useCallback(() => {
    setPrefilledTime(undefined);
  }, []);

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


  const handleTogglePerformance = useCallback(() => {
    updateSettings({ showPerformance: !showPerformance });
  }, [showPerformance, updateSettings]);

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
  const handleNavigateToAchievements = useCallback(() => {
    setActiveTab('achievements');
  }, []);

  const handleNavigateToElo = useCallback(() => {
    setActiveTab('elo');
  }, []);

  const handleNavigateToMore = useCallback(() => {
    setActiveTab('more');
  }, []);

  const handleOpenHistory = useCallback(() => {
    setActiveTab('history');
  }, []);


  const handleNavigateToTutorial = useCallback(() => {
    setActiveTab('tutorial');
  }, []);

  const handleOpenSecurity = useCallback(() => {
    setShowChangePasswordModal(true);
  }, []);

  const handleNavigateToStats = useCallback(() => {
    setActiveTab('stats');
  }, []);

  const handleNavigateToAppearance = useCallback(() => {
    setActiveTab('appearance');
  }, []);

  const handleNavigateToGoals = useCallback(() => {
    setActiveTab('goals');
  }, []);

  const handleNavigateToAbout = useCallback(() => {
    setActiveTab('about');
  }, []);

  const handleOpenSettings = useCallback(() => {
    setActiveTab('settings');
  }, []);

  const handleLogout = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const handleNavigateToProfile = useCallback(() => {
    setActiveTab('profile');
  }, []);

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
      </div>
    );
  }

  if (!loadingData) {
    // Verificar expiração do trial comparando apenas datas (sem horário)
    const isTrialExpired = subscriptionStatus === 'trial' && trialEndsAt && (() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(trialEndsAt);
      endDate.setHours(0, 0, 0, 0);
      return endDate < today;
    })();
    const isSubscriptionCancelled = subscriptionStatus === 'cancelled';
    const hasNoSubscription = !subscriptionStatus || subscriptionStatus === 'none';

    // Redirecionar para pricing apenas se não tiver assinatura ativa/trial válido
    if (hasNoSubscription || isTrialExpired || isSubscriptionCancelled) {
      return <PricingPage onBack={onHardReset} onNavigateToLogin={() => {}} onNavigateToSignup={() => {}} />;
    }
  }

  return (
    <XPProvider
      logs={logs}
      userId={session?.user?.id}
    >
      <AchievementsProvider
        logs={logs}
        stats={stats}
        streak={streak}
        dailyGoal={dailyGoal}
        cycleStartDate={cycleStartDate}
        userCreatedAt={session?.user?.created_at ? new Date(session.user.created_at).getTime() : undefined}
        userId={session?.user?.id}
        onNavigateToAchievements={() => setActiveTab('achievements')}
      >
        <MainAppContent
        session={session}
        onHardReset={onHardReset}
        subjects={subjects}
        logs={logs}
        cycleStartDate={cycleStartDate}
        dailyGoal={dailyGoal}
        showPerformance={showPerformance}
        loadingData={loadingData}
        subscriptionStatus={subscriptionStatus}
        subscriptionType={subType}
        trialEndsAt={trialEndsAt}
        welcomeSeen={welcomeSeen}
        streak={streak}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showFeedbackModal={showFeedbackModal}
        setShowFeedbackModal={setShowFeedbackModal}
        showHistoryModal={showHistoryModal}
        setShowHistoryModal={setShowHistoryModal}
        showChangePasswordModal={showChangePasswordModal}
        setShowChangePasswordModal={setShowChangePasswordModal}
        prefilledTime={prefilledTime}
        setPrefilledTime={setPrefilledTime}
        timerSeconds={timerSeconds}
        setTimerSeconds={setTimerSeconds}
        isTimerRunning={isTimerRunning}
        setIsTimerRunning={setIsTimerRunning}
        timerMode={timerMode}
        setTimerMode={setTimerMode}
        deleteLogId={deleteLogId}
        setDeleteLogId={setDeleteLogId}
        showRestartConfirm={showRestartConfirm}
        setShowRestartConfirm={setShowRestartConfirm}
        showRestartSuccess={showRestartSuccess}
        setShowRestartSuccess={setShowRestartSuccess}
        showLogoutConfirm={showLogoutConfirm}
        setShowLogoutConfirm={setShowLogoutConfirm}
        timerIntervalRef={timerIntervalRef}
        timerStartRef={timerStartRef}
        timerBaseRef={timerBaseRef}
        countdownIntervalRef={countdownIntervalRef}
        countdownSecondsRef={countdownSecondsRef}
        lastTimerSecondsRef={lastTimerSecondsRef}
        handleTimerStop={handleTimerStop}
        handleDeleteLog={handleDeleteLog}
        confirmDeleteLog={confirmDeleteLog}
        confirmRestartCycle={confirmRestartCycle}
        confirmLogout={confirmLogout}
        handleRestartCycle={handleRestartCycle}
        handleTimeClear={handleTimeClear}
        handleAddSubject={handleAddSubject}
        handleDeleteSubject={handleDeleteSubject}
        handleUpdateSubject={handleUpdateSubject}
        handleReorderSubjects={handleReorderSubjects}
        handleAddLog={handleAddLog}
        handleEditLog={handleEditLog}
        handleTogglePerformance={handleTogglePerformance}
        handleCancelDeleteLog={handleCancelDeleteLog}
        handleCancelRestartCycle={handleCancelRestartCycle}
        handleCloseRestartSuccess={handleCloseRestartSuccess}
        handleCancelLogout={handleCancelLogout}
        handleNavigateToAchievements={handleNavigateToAchievements}
        handleNavigateToElo={handleNavigateToElo}
        handleNavigateToMore={handleNavigateToMore}
        handleOpenHistory={handleOpenHistory}
        handleNavigateToTutorial={handleNavigateToTutorial}
        handleOpenSecurity={handleOpenSecurity}
        handleNavigateToStats={handleNavigateToStats}
        handleNavigateToAppearance={handleNavigateToAppearance}
        handleNavigateToGoals={handleNavigateToGoals}
        handleNavigateToAbout={handleNavigateToAbout}
        handleOpenSettings={handleOpenSettings}
        handleLogout={handleLogout}
        handleNavigateToProfile={handleNavigateToProfile}
        addSubject={addSubject}
        deleteSubject={deleteSubject}
        updateSubject={updateSubject}
        reorderSubjects={reorderSubjects}
        addLog={addLog}
        deleteLog={deleteLog}
        editLog={editLog}
        updateSettings={updateSettings}
        markTutorialCompleted={markTutorialCompleted}
        sendNotification={sendNotification}
        addToast={addToast}
        hasMoreLogs={hasMoreLogs}
        loadingMoreLogs={loadingMoreLogs}
        loadMoreLogs={loadMoreLogs}
        searchLogs={searchLogs}
        searchTerm={searchTerm}
        daysFilter={daysFilter}
        onDaysFilterChange={applyDaysFilter}
      />
      </AchievementsProvider>
    </XPProvider>
  );
}

// Componente interno que usa o contexto
function MainAppContent({
  session,
  onHardReset: _onHardReset,
  subjects = [],
  logs = [],
  cycleStartDate = Date.now(),
  dailyGoal = 0,
  showPerformance = true,
  loadingData = false,
  subscriptionStatus = null,
  subscriptionType: subType = null,
  trialEndsAt = null,
  welcomeSeen = true,
  streak = 0,
  activeTab,
  setActiveTab,
  showFeedbackModal,
  setShowFeedbackModal,
  showHistoryModal,
  setShowHistoryModal,
  showChangePasswordModal,
  setShowChangePasswordModal,
  prefilledTime,
  setPrefilledTime: _setPrefilledTime,
  timerSeconds,
  setTimerSeconds,
  isTimerRunning,
  setIsTimerRunning,
  timerMode,
  setTimerMode,
  deleteLogId,
  setDeleteLogId: _setDeleteLogId,
  showRestartConfirm,
  setShowRestartConfirm: _setShowRestartConfirm,
  showRestartSuccess,
  setShowRestartSuccess: _setShowRestartSuccess,
  showLogoutConfirm,
  setShowLogoutConfirm: _setShowLogoutConfirm,
  timerIntervalRef: _timerIntervalRef,
  timerStartRef: _timerStartRef,
  timerBaseRef: _timerBaseRef,
  countdownIntervalRef: _countdownIntervalRef,
  countdownSecondsRef: _countdownSecondsRef,
  lastTimerSecondsRef: _lastTimerSecondsRef,
  handleTimerStop,
  handleDeleteLog,
  confirmDeleteLog,
  confirmRestartCycle,
  confirmLogout,
  handleRestartCycle,
  handleTimeClear,
  handleAddSubject,
  handleDeleteSubject,
  handleUpdateSubject,
  handleReorderSubjects,
  handleAddLog,
  handleEditLog,
  handleTogglePerformance,
  handleCancelDeleteLog,
  handleCancelRestartCycle,
  handleCloseRestartSuccess,
  handleCancelLogout,
  handleNavigateToAchievements,
  handleNavigateToElo,
  handleNavigateToMore,
  handleOpenHistory,
  handleNavigateToTutorial,
  handleOpenSecurity,
  handleNavigateToStats,
  handleNavigateToAppearance,
  handleNavigateToGoals,
  handleNavigateToAbout,
  handleOpenSettings,
  handleLogout,
  handleNavigateToProfile: _handleNavigateToProfile,
  addSubject: _addSubject,
  deleteSubject: _deleteSubject,
  updateSubject: _updateSubject,
  reorderSubjects: _reorderSubjects,
  addLog: _addLog,
  deleteLog: _deleteLog,
  editLog: _editLog,
  updateSettings: _updateSettings,
  markTutorialCompleted: _markTutorialCompleted,
  sendNotification: _sendNotification,
  addToast: _addToast,
  hasMoreLogs,
  loadingMoreLogs,
  loadMoreLogs,
  searchLogs,
  searchTerm,
  daysFilter,
  onDaysFilterChange
}: any) {
  const { pendingCount } = useAchievementsContext();
  const xpContext = useXPContext();

  // Função wrapper para deletar log com remoção de XP
  const handleConfirmDeleteLog = useCallback(() => {
    if (deleteLogId) {
      // Buscar o log que está sendo deletado
      const logToDelete = logs.find((log: import('../types').StudyLog) => log.id === deleteLogId);
      
      if (logToDelete) {
        // Calcular XP a remover
        const xpToRemove = calculateXPFromLog(logToDelete);
        
        // Remover XP se houver
        if (xpToRemove > 0) {
          xpContext.removeXP(xpToRemove, 'Registro excluído');
        }
      }
      
      // Deletar o log
      confirmDeleteLog();
    }
  }, [deleteLogId, logs, xpContext, confirmDeleteLog]);

  const handleWelcomeSeen = useCallback(() => {
    _updateSettings({ welcomeSeen: true });
  }, [_updateSettings]);

  const userName = useMemo(() => {
    return session?.user?.user_metadata?.full_name?.split(' ')[0] || session?.user?.user_metadata?.name?.split(' ')[0] || '';
  }, [session]);

  // Função renderPage dentro do MainAppContent
  const renderPage = useCallback(() => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage 
          subjects={subjects} 
          logs={logs} 
          cycleStartDate={cycleStartDate} 
          onDeleteLog={handleDeleteLog} 
          onEditLog={handleEditLog} 
          dailyGoal={dailyGoal} 
          showPerformance={showPerformance} 
          streak={streak} 
          isLoading={loadingData} 
          onNavigateToCycle={() => setActiveTab('cycle')}
          subscriptionStatus={subscriptionStatus}
          trialEndsAt={trialEndsAt}
          onNavigateToPlans={() => setActiveTab('plans')}
          welcomeSeen={welcomeSeen}
          onWelcomeSeen={handleWelcomeSeen}
          onNavigateToTutorial={handleNavigateToTutorial}
          userName={userName}
        />;
      case 'timer':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <TimerPage onTimerStop={handleTimerStop} timerSeconds={timerSeconds} setTimerSeconds={setTimerSeconds} isTimerRunning={isTimerRunning} setIsTimerRunning={setIsTimerRunning} timerMode={timerMode} setTimerMode={setTimerMode} />
          </Suspense>
        );
      case 'register':
        return <RegisterPage subjects={subjects} onAddLog={handleAddLog} onUpdateSubject={handleUpdateSubject} prefilledTime={prefilledTime} onTimeClear={handleTimeClear} timerSeconds={timerSeconds} isTimerRunning={isTimerRunning} />;
      case 'cycle':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <CyclePage subjects={subjects} logs={logs} cycleStartDate={cycleStartDate} onAddSubject={handleAddSubject} onDeleteSubject={handleDeleteSubject} onUpdateSubject={handleUpdateSubject} onRestartCycle={handleRestartCycle} onReorderSubjects={handleReorderSubjects} isLoading={loadingData} />
          </Suspense>
        );
      case 'achievements':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <AchievementsPage 
              isLoading={loadingData}
              onNavigateToMore={handleNavigateToMore}
            />
          </Suspense>
        );
      case 'elo':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <EloPage 
              logs={logs}
              userId={session?.user?.id}
              onNavigateToMore={handleNavigateToMore}
            />
          </Suspense>
        );
      case 'more':
        return (
          <MorePage
            session={session}
            onNavigateToAchievements={handleNavigateToAchievements}
            onNavigateToElo={handleNavigateToElo}
            onNavigateToGoals={handleNavigateToGoals}
            onNavigateToStats={handleNavigateToStats}
            onNavigateToAppearance={handleNavigateToAppearance}
            onOpenHistory={handleOpenHistory}
            onOpenFeedback={() => setShowFeedbackModal(true)}
            onOpenTutorial={handleNavigateToTutorial}
            onOpenSecurity={handleOpenSecurity}
            onOpenSettings={handleOpenSettings}
            onNavigateToAbout={handleNavigateToAbout}
            onNavigateToPlans={() => setActiveTab('plans')}
            onLogout={handleLogout}
            onNavigateToProfile={_handleNavigateToProfile}
          />
        );
      case 'goals':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <GoalsPage
              logs={logs}
              onNavigateBack={() => setActiveTab('more')}
            />
          </Suspense>
        );
      case 'stats':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <StatsPage
              logs={logs}
              subjects={subjects}
              cycleStartDate={cycleStartDate}
              streak={streak}
              onNavigateBack={() => setActiveTab('more')}
            />
          </Suspense>
        );
      case 'history':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <HistoryPage 
              logs={logs} 
              subjects={subjects} 
              onDeleteLog={handleDeleteLog} 
              onEditLog={handleEditLog}
              onNavigateBack={() => setActiveTab('more')}
              hasMoreLogs={hasMoreLogs}
              loadingMoreLogs={loadingMoreLogs}
              onLoadMore={loadMoreLogs}
              onSearch={searchLogs}
              searchTerm={searchTerm}
              daysFilter={daysFilter}
              onDaysFilterChange={onDaysFilterChange}
            />
          </Suspense>
        );
      case 'appearance':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <AppearancePage
              onNavigateBack={() => setActiveTab('more')}
            />
          </Suspense>
        );
      case 'about':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <AboutPage
              onNavigateBack={() => setActiveTab('more')}
            />
          </Suspense>
        );
      case 'tutorial':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <TutorialPage 
              onNavigateBack={() => setActiveTab('more')}
            />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <SettingsPage
              onNavigateBack={() => setActiveTab('more')}
              showPerformance={showPerformance}
              onTogglePerformance={handleTogglePerformance}
              subjects={subjects}
              logs={logs}
              userEmail={session?.user?.email}
            />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>}>
            <ProfilePage
              session={session}
              onNavigateBack={() => setActiveTab('more')}
              subscriptionStatus={subscriptionStatus}
              subscriptionType={subType}
              trialEndsAt={trialEndsAt}
              onNavigateToPlans={() => setActiveTab('plans')}
            />
          </Suspense>
        );
      case 'plans':
        return (
          <PlanPage 
            subscriptionStatus={subscriptionStatus}
            subscriptionType={subType}
            onNavigateBack={() => setActiveTab('more')}
          />
        );
      default:
        return null;
    }
  }, [
    activeTab, subjects, logs, cycleStartDate, handleDeleteLog, handleEditLog, 
    dailyGoal, showPerformance, streak, loadingData, handleTimerStop, 
    timerSeconds, setTimerSeconds, isTimerRunning, setIsTimerRunning, 
    timerMode, setTimerMode, handleAddLog, prefilledTime, handleTimeClear, 
    handleAddSubject, handleDeleteSubject, handleUpdateSubject, 
    handleRestartCycle, handleReorderSubjects, session, 
    handleNavigateToAchievements, handleNavigateToElo, handleNavigateToStats, 
    handleNavigateToGoals, handleNavigateToAppearance, handleNavigateToAbout, 
    handleOpenHistory, setShowFeedbackModal, handleNavigateToTutorial, 
    handleOpenSecurity, handleOpenSettings, handleLogout, _handleNavigateToProfile, 
    setActiveTab, handleTogglePerformance, subscriptionStatus, subType, trialEndsAt,
    welcomeSeen, handleWelcomeSeen, handleNavigateToTutorial, userName
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative transition-colors duration-300">

      <ConfirmModal 
        isOpen={deleteLogId !== null} 
        title="Excluir Registro" 
        message="Tem certeza?" 
        confirmText="Excluir" 
        cancelText="Cancelar" 
        variant="danger" 
        onConfirm={handleConfirmDeleteLog} 
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
        message="Foco na missão!" 
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
        pendingAchievementsCount={pendingCount}
        onOpenFeedback={() => setShowFeedbackModal(true)}
        onOpenHistory={handleOpenHistory}
        onOpenTutorial={handleNavigateToTutorial}
        onOpenSecurity={handleOpenSecurity}
        isSecurityModalOpen={showChangePasswordModal}
        onNavigateToStats={handleNavigateToStats}
        onNavigateToAppearance={handleNavigateToAppearance}
        onNavigateToGoals={handleNavigateToGoals}
        onNavigateToAbout={handleNavigateToAbout}
        onOpenSettings={handleOpenSettings}
        onLogout={handleLogout}
        onNavigateToProfile={_handleNavigateToProfile}
      />

      {/* Conteúdo Principal com Ajuste de Margem para Desktop */}
      <div className="pb-24 pt-2 md:ml-64 md:pb-8"> 
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} {...FADE_UP_ANIMATION}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* BottomNav - Apenas Mobile */}
      <div className="md:hidden">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} pendingAchievementsCount={pendingCount} />
      </div>

      {/* FAB Timer - Apenas Desktop */}
      {activeTab !== 'timer' && (
        <FabTimer 
          onClick={() => setActiveTab('timer')} 
          isRunning={isTimerRunning} 
        />
      )}

      {/* Modal de Upgrade de Elo */}
      <EloUpgradeModal
        isOpen={xpContext.showUpgradeModal}
        onClose={xpContext.closeUpgradeModal}
        oldElo={xpContext.oldLevelData}
        newElo={xpContext.newLevelData}
        totalXP={xpContext.totalXP}
      />
    </div>
  );
}
