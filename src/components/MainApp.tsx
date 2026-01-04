import {
  useState,
  useEffect,
  useRef,
  lazy,
  Suspense,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TabType } from "../types";
import { FADE_UP_ANIMATION } from "../utils/animations";
import { getLocalDateString, getPreviousDateString } from "../utils/dateUtils";
import { useSupabaseData } from "../hooks/useSupabaseData";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import DashboardPage from "../pages/DashboardPage";
import RegisterPage from "../pages/RegisterPage";
import MorePage from "../pages/MorePage";
// Lazy loading para páginas grandes
const TimerPage = lazy(() => import("../pages/TimerPage"));
const CyclePage = lazy(() => import("../pages/CyclePage"));
const AchievementsPage = lazy(() => import("../pages/AchievementsPage"));
const EloPage = lazy(() => import("../pages/EloPage"));
const GoalsPage = lazy(() => import("../pages/GoalsPage"));
const StatsPage = lazy(() => import("../pages/StatsPage"));
const AppearancePage = lazy(() => import("../pages/AppearancePage"));
const HistoryPage = lazy(() => import("../pages/HistoryPage"));
const AboutPage = lazy(() => import("../pages/AboutPage"));
const TutorialPage = lazy(() => import("../pages/TutorialPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
import PricingPage from "../pages/PricingPage";
import PlanPage from "../pages/PlanPage";
import FeedbackModal from "./FeedbackModal";
import HistoryModal from "./HistoryModal";
import ChangePasswordModal from "./ChangePasswordModal";
import { Loader2 } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import AlertModal from "./AlertModal";
import { useNotification } from "../hooks/useNotification";
import { useToast } from "../contexts/ToastContext";
import {
  AchievementsProvider,
  useAchievementsContext,
} from "../contexts/AchievementsContext";
import { XPProvider, useXPContext } from "../contexts/XPContext";
import { calculateXPFromLog } from "../hooks/useXP";
import FabTimer from "./FabTimer";
import EloUpgradeModal from "./EloUpgradeModal";

const CURRENT_PAGE_KEY = "studyflow_current_page";
const MORE_PAGE_SCROLL_KEY = "studyflow_more_scroll";

interface MainAppProps {
  session: any;
  onHardReset: () => void;
}

export default function MainApp({ session, onHardReset }: MainAppProps) {
  // DATA HOOK
  const {
    subjects,
    logs,
    stats,
    allLogDates,
    cycleStartDate,
    dailyGoal,
    showPerformance,
    loadingData,
    subscriptionStatus,
    trialEndsAt,
    nextBillingDate,
    subscriptionType: subType,
    welcomeSeen,
    hasMoreLogs,
    loadingMoreLogs,
    loadMoreLogs,
    searchLogs,
    searchTerm,
    daysFilter,
    applyDaysFilter,
    addSubject,
    deleteSubject,
    updateSubject,
    reorderSubjects,
    addLog,
    deleteLog,
    editLog,
    updateSettings,
  } = useSupabaseData(session);

  // UI STATE
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // 1. Prioridade para redirecionamento após login (Deep Link)
    const redirectedTab = sessionStorage.getItem("studyflow_redirect_tab");
    if (redirectedTab) {
      sessionStorage.removeItem("studyflow_redirect_tab");
      // Validar se é uma aba válida
      const validTabs: TabType[] = [
        "dashboard",
        "timer",
        "register",
        "cycle",
        "more",
        "achievements",
        "elo",
        "goals",
        "stats",
        "history",
        "appearance",
        "about",
        "tutorial",
        "settings",
        "profile",
        "plans",
      ];
      if (validTabs.includes(redirectedTab as TabType)) {
        return redirectedTab as TabType;
      }
    }

    // 2. Persistência (F5)
    const saved = localStorage.getItem(CURRENT_PAGE_KEY);
    // Lista de tabs válidas que devem ser persistidas
    const validTabs: TabType[] = [
      "dashboard",
      "timer",
      "register",
      "cycle",
      "more",
      "achievements",
      "elo",
      "goals",
      "stats",
      "history",
      "appearance",
      "about",
      "tutorial",
      "settings",
      "profile",
      "plans",
    ];
    if (saved && validTabs.includes(saved as TabType)) {
      return saved as TabType;
    }
    return "dashboard";
  });

  // Persistir página atual no localStorage
  useEffect(() => {
    localStorage.setItem(CURRENT_PAGE_KEY, activeTab);
  }, [activeTab]);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [prefilledTime, setPrefilledTime] = useState<
    { hours: number; minutes: number; seconds: number } | undefined
  >();
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<
    "cronometro" | "temporizador" | "pomodoro"
  >("cronometro");
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
  const morePageScrollRef = useRef<number>(
    parseInt(localStorage.getItem(MORE_PAGE_SCROLL_KEY) || "0")
  );

  // useMemo para calcular streak (evita recálculo desnecessário) - DEVE VIR ANTES DE useAchievements
  // ✅ CORRIGIDO: Usa log.date (YYYY-MM-DD) ao invés de timestamp com toLocaleDateString
  // Timezone local é respeitado e formato é consistente
  const streak = useMemo(() => {
    if (allLogDates.length === 0) return 0;

    // Criar Set com todas as datas em formato YYYY-MM-DD
    const studyDates = new Set(allLogDates.map((log) => log.date));

    const today = getLocalDateString();
    const yesterday = getPreviousDateString(today);

    // Se não estudou nem hoje nem ontem, streak = 0
    if (!studyDates.has(today) && !studyDates.has(yesterday)) return 0;

    let streak = 0;
    let currentCheckDate = today;

    // Loop para contar dias consecutivos
    for (let i = 0; i < 365; i++) {
      if (studyDates.has(currentCheckDate)) {
        streak++;
      } else {
        // Se é o primeiro dia (i === 0) e não estudou hoje, pula para ontem
        if (i === 0 && !studyDates.has(today)) {
          currentCheckDate = yesterday;
          continue;
        }
        break;
      }
      currentCheckDate = getPreviousDateString(currentCheckDate);
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
    if (
      timerMode !== "cronometro" &&
      timerSeconds > lastTimerSecondsRef.current
    ) {
      countdownSecondsRef.current = timerSeconds;
    }
    lastTimerSecondsRef.current = timerSeconds;
  }, [timerSeconds, timerMode]);

  // TIMER - Cronômetro (incrementa) ou Temporizador/Pomodoro (decrementa)
  useEffect(() => {
    // Limpar intervalos anteriores
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);

    if (isTimerRunning) {
      if (timerMode === "cronometro") {
        // Cronômetro: contagem progressiva
        if (timerStartRef.current === null) {
          timerStartRef.current = Date.now();
          timerBaseRef.current = timerSeconds;
        }
        const tick = () => {
          const elapsed = Math.floor(
            (Date.now() - timerStartRef.current!) / 1000
          );
          setTimerSeconds(timerBaseRef.current + elapsed);
        };
        timerIntervalRef.current = window.setInterval(tick, 250);
        tick();
      } else {
        // Temporizador/Pomodoro: contagem regressiva
        // Sincronizar countdownSecondsRef apenas quando inicia pela primeira vez (countdownSecondsRef === 0)
        // OU quando timerSeconds aumenta (novo tempo configurado)
        // NÃO sincronizar quando retoma (countdownSecondsRef > 0 e timerSeconds menor)
        if (
          countdownSecondsRef.current === 0 ||
          (countdownSecondsRef.current < timerSeconds && timerSeconds > 0)
        ) {
          countdownSecondsRef.current = timerSeconds;
        }
        const tick = () => {
          if (countdownSecondsRef.current <= 0) {
            setIsTimerRunning(false);
            clearInterval(countdownIntervalRef.current!);
            countdownSecondsRef.current = 0;
            // Enviar notificação quando timer acaba
            // (só chega aqui se estava rodando, pois o intervalo só existe quando isTimerRunning é true)
            const modeLabel = timerMode === "pomodoro" ? "Pomodoro" : "Ciclo";
            sendNotification(`${modeLabel} Finalizado ⏰`, {
              body: `Seu ${modeLabel.toLowerCase()} chegou ao fim. Bom trabalho! 🎉`,
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
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [
    isTimerRunning,
    timerMode,
    sendNotification,
    setIsTimerRunning,
    setTimerSeconds,
  ]);

  // useCallback para funções de callback
  const handleTimerStop = useCallback(
    (hours: number, minutes: number, seconds: number) => {
      setPrefilledTime({ hours, minutes, seconds });
      setActiveTab("register");
    },
    []
  );

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
  const handleAddSubject = useCallback(
    (subject: Omit<import("../types").Subject, "id">) => {
      addSubject(subject);
    },
    [addSubject]
  );

  const handleDeleteSubject = useCallback(
    (id: string) => {
      deleteSubject(id);
    },
    [deleteSubject]
  );

  const handleUpdateSubject = useCallback(
    (id: string, subject: Partial<import("../types").Subject>) => {
      updateSubject(id, subject);
    },
    [updateSubject]
  );

  const handleReorderSubjects = useCallback(
    (subjects: import("../types").Subject[]) => {
      reorderSubjects(subjects);
    },
    [reorderSubjects]
  );

  const handleAddLog = useCallback(
    (log: Omit<import("../types").StudyLog, "id" | "timestamp" | "date">) => {
      addLog(log);
    },
    [addLog]
  );

  // handleEditLog básico - será sobrescrito por handleEditLogWithXP no MainAppContent
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleEditLogBase = useCallback(
    (id: string, updates: Partial<import("../types").StudyLog>) => {
      editLog(id, updates);
    },
    [editLog]
  );

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
    if (activeTab === "more") {
      const scrollY = window.scrollY;
      morePageScrollRef.current = scrollY;
      localStorage.setItem(MORE_PAGE_SCROLL_KEY, scrollY.toString());
    }
    setActiveTab("achievements");
  }, [activeTab]);

  const handleNavigateToElo = useCallback(() => {
    if (activeTab === "more") {
      const scrollY = window.scrollY;
      morePageScrollRef.current = scrollY;
      localStorage.setItem(MORE_PAGE_SCROLL_KEY, scrollY.toString());
    }
    setActiveTab("elo");
  }, [activeTab]);

  const handleNavigateToMore = useCallback(() => {
    setActiveTab("more");
  }, []);

  const handleOpenHistory = useCallback(() => {
    if (activeTab === "more") {
      const scrollY = window.scrollY;
      morePageScrollRef.current = scrollY;
      localStorage.setItem(MORE_PAGE_SCROLL_KEY, scrollY.toString());
    }
    setActiveTab("history");
  }, [activeTab]);

  const handleNavigateToTutorial = useCallback(() => {
    if (activeTab === "more") {
      const scrollY = window.scrollY;
      morePageScrollRef.current = scrollY;
      localStorage.setItem(MORE_PAGE_SCROLL_KEY, scrollY.toString());
    }
    setActiveTab("tutorial");
  }, [activeTab]);

  const handleOpenSecurity = useCallback(() => {
    setShowChangePasswordModal(true);
  }, []);

  const handleNavigateToStats = useCallback(() => {
    if (activeTab === "more") {
      const scrollY = window.scrollY;
      morePageScrollRef.current = scrollY;
      localStorage.setItem(MORE_PAGE_SCROLL_KEY, scrollY.toString());
    }
    setActiveTab("stats");
  }, [activeTab]);

  const handleNavigateToAppearance = useCallback(() => {
    if (activeTab === "more") {
      const scrollY = window.scrollY;
      morePageScrollRef.current = scrollY;
      localStorage.setItem(MORE_PAGE_SCROLL_KEY, scrollY.toString());
    }
    setActiveTab("appearance");
  }, [activeTab]);

  const handleNavigateToGoals = useCallback(() => {
    if (activeTab === "more") {
      const scrollY = window.scrollY;
      morePageScrollRef.current = scrollY;
      localStorage.setItem(MORE_PAGE_SCROLL_KEY, scrollY.toString());
    }
    setActiveTab("goals");
  }, [activeTab]);

  const handleNavigateToAbout = useCallback(() => {
    if (activeTab === "more") {
      const scrollY = window.scrollY;
      morePageScrollRef.current = scrollY;
      localStorage.setItem(MORE_PAGE_SCROLL_KEY, scrollY.toString());
    }
    setActiveTab("about");
  }, [activeTab]);

  const handleOpenSettings = useCallback(() => {
    if (activeTab === "more") {
      const scrollY = window.scrollY;
      morePageScrollRef.current = scrollY;
      localStorage.setItem(MORE_PAGE_SCROLL_KEY, scrollY.toString());
    }
    setActiveTab("settings");
  }, [activeTab]);

  const handleLogout = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const handleNavigateToProfile = useCallback(() => {
    if (activeTab === "more") {
      const scrollY = window.scrollY;
      morePageScrollRef.current = scrollY;
      localStorage.setItem(MORE_PAGE_SCROLL_KEY, scrollY.toString());
    }
    setActiveTab("profile");
  }, [activeTab]);

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
      </div>
    );
  }

  if (!loadingData) {
    // Verificar expiração do trial comparando apenas datas (sem horário)
    const isTrialExpired =
      subscriptionStatus === "trial" &&
      trialEndsAt &&
      (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(trialEndsAt);
        endDate.setHours(0, 0, 0, 0);
        return endDate < today;
      })();

    // Verificar expiração do mensal
    const isMonthlyExpired =
      subscriptionStatus === "active" &&
      subType === "monthly" &&
      nextBillingDate &&
      (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const billingDate = new Date(nextBillingDate);
        billingDate.setHours(0, 0, 0, 0);
        return billingDate < today;
      })();

    const isSubscriptionCancelled = subscriptionStatus === "cancelled";
    const hasNoSubscription = !subscriptionStatus;

    // Redirecionar para pricing apenas se não tiver assinatura ativa/trial válido
    if (
      hasNoSubscription ||
      isTrialExpired ||
      isMonthlyExpired ||
      isSubscriptionCancelled
    ) {
      return (
        <PricingPage
          fromExpiredTrial={!!(isTrialExpired || isMonthlyExpired)}
          expirationType={isMonthlyExpired ? "monthly" : "trial"}
          onBack={onHardReset}
          onNavigateToLogin={() => {}}
          onNavigateToSignup={() => {}}
          onPaymentConfirmed={() => {
            // Limpar página salva para garantir que vá para o Dashboard
            localStorage.removeItem("studyflow_current_page");
            // Pequeno delay para garantir que o banco de dados sincronizou
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }}
        />
      );
    }
  }

  return (
    <XPProvider logs={logs} userId={session?.user?.id}>
      <AchievementsProvider
        logs={logs}
        stats={stats}
        streak={streak}
        dailyGoal={dailyGoal}
        cycleStartDate={cycleStartDate}
        userCreatedAt={
          session?.user?.created_at
            ? new Date(session.user.created_at).getTime()
            : undefined
        }
        userId={session?.user?.id}
        onNavigateToAchievements={() => setActiveTab("achievements")}
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
          handleEditLog={_handleEditLogBase}
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
          sendNotification={sendNotification}
          addToast={addToast}
          hasMoreLogs={hasMoreLogs}
          loadingMoreLogs={loadingMoreLogs}
          loadMoreLogs={loadMoreLogs}
          searchLogs={searchLogs}
          searchTerm={searchTerm}
          daysFilter={daysFilter}
          onDaysFilterChange={applyDaysFilter}
          morePageScrollRef={morePageScrollRef}
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
  handleEditLog: _handleEditLogFromParent, // Não usado - substituído por handleEditLogWithXP
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
  sendNotification: _sendNotification,
  addToast: _addToast,
  hasMoreLogs,
  loadingMoreLogs,
  loadMoreLogs,
  searchLogs,
  searchTerm,
  daysFilter,
  onDaysFilterChange,
  morePageScrollRef,
}: any) {
  const { pendingCount } = useAchievementsContext();
  const xpContext = useXPContext();

  // Scroll to top quando muda de página (exceto ao voltar para MorePage)
  useEffect(() => {
    if (activeTab === "more" && morePageScrollRef.current > 0) {
      // Restaurar scroll da MorePage
      setTimeout(() => {
        window.scrollTo({
          top: morePageScrollRef.current,
          behavior: "instant",
        });
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [activeTab]);

  // Função wrapper para deletar log com remoção de XP
  const handleConfirmDeleteLog = useCallback(() => {
    if (deleteLogId) {
      // Buscar o log que está sendo deletado
      const logToDelete = logs.find(
        (log: import("../types").StudyLog) => log.id === deleteLogId
      );

      if (logToDelete) {
        // Calcular XP a remover
        const xpToRemove = calculateXPFromLog(logToDelete);

        // Remover XP se houver
        if (xpToRemove > 0) {
          xpContext.removeXP(xpToRemove, "Registro excluído");
        }
      }

      // Deletar o log
      confirmDeleteLog();
    }
  }, [deleteLogId, logs, xpContext, confirmDeleteLog]);

  // Função wrapper para editar log COM recálculo de XP
  const handleEditLogWithXP = useCallback(
    (id: string, updates: Partial<import("../types").StudyLog>) => {
      // 1. Buscar log antigo
      const oldLog = logs.find(
        (log: import("../types").StudyLog) => log.id === id
      );

      if (oldLog) {
        // 2. Calcular XP antigo
        const oldXP = calculateXPFromLog(oldLog);

        // 3. Calcular XP novo (com updates aplicados)
        const newLog = { ...oldLog, ...updates };
        const newXP = calculateXPFromLog(newLog);

        // 4. Calcular diferença de XP
        const xpDiff = newXP - oldXP;

        // 5. Ajustar XP se houver diferença
        if (xpDiff > 0) {
          // Ganhou XP (editou para mais tempo/questões)
          xpContext.addXP(xpDiff, "Registro editado", "", false);
        } else if (xpDiff < 0) {
          // Perdeu XP (editou para menos tempo/questões)
          xpContext.removeXP(Math.abs(xpDiff), "Registro editado");
        }
      }

      // 6. Atualizar log no banco
      _editLog(id, updates);
    },
    [logs, xpContext, _editLog]
  );

  const handleWelcomeSeen = useCallback(() => {
    _updateSettings({ welcomeSeen: true });
  }, [_updateSettings]);

  const userName = useMemo(() => {
    return (
      session?.user?.user_metadata?.full_name?.split(" ")[0] ||
      session?.user?.user_metadata?.name?.split(" ")[0] ||
      ""
    );
  }, [session]);

  // Função renderPage dentro do MainAppContent
  const renderPage = useCallback(() => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardPage
            subjects={subjects}
            logs={logs}
            cycleStartDate={cycleStartDate}
            onDeleteLog={handleDeleteLog}
            onEditLog={handleEditLogWithXP}
            dailyGoal={dailyGoal}
            showPerformance={showPerformance}
            streak={streak}
            isLoading={loadingData}
            onNavigateToCycle={() => setActiveTab("cycle")}
            subscriptionStatus={subscriptionStatus}
            trialEndsAt={trialEndsAt}
            onNavigateToPlans={() => setActiveTab("plans")}
            welcomeSeen={welcomeSeen}
            onWelcomeSeen={handleWelcomeSeen}
            onNavigateToTutorial={handleNavigateToTutorial}
            userName={userName}
          />
        );
      case "timer":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
              </div>
            }
          >
            <TimerPage
              onTimerStop={handleTimerStop}
              timerSeconds={timerSeconds}
              setTimerSeconds={setTimerSeconds}
              isTimerRunning={isTimerRunning}
              setIsTimerRunning={setIsTimerRunning}
              timerMode={timerMode}
              setTimerMode={setTimerMode}
              logs={logs}
              dailyGoal={dailyGoal}
            />
          </Suspense>
        );
      case "register":
        return (
          <RegisterPage
            subjects={subjects}
            onAddLog={handleAddLog}
            onUpdateSubject={handleUpdateSubject}
            prefilledTime={prefilledTime}
            onTimeClear={handleTimeClear}
            timerSeconds={timerSeconds}
            isTimerRunning={isTimerRunning}
          />
        );
      case "cycle":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
              </div>
            }
          >
            <CyclePage
              subjects={subjects}
              logs={logs}
              cycleStartDate={cycleStartDate}
              onAddSubject={handleAddSubject}
              onDeleteSubject={handleDeleteSubject}
              onUpdateSubject={handleUpdateSubject}
              onRestartCycle={handleRestartCycle}
              onReorderSubjects={handleReorderSubjects}
              isLoading={loadingData}
            />
          </Suspense>
        );
      case "achievements":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
              </div>
            }
          >
            <AchievementsPage
              isLoading={loadingData}
              onNavigateToMore={handleNavigateToMore}
            />
          </Suspense>
        );
      case "elo":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
              </div>
            }
          >
            <EloPage
              logs={logs}
              userId={session?.user?.id}
              onNavigateToMore={handleNavigateToMore}
            />
          </Suspense>
        );
      case "more":
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
            onNavigateToPlans={() => setActiveTab("plans")}
            onLogout={handleLogout}
            onNavigateToProfile={_handleNavigateToProfile}
          />
        );
      case "goals":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
              </div>
            }
          >
            <GoalsPage
              logs={logs}
              onNavigateBack={() => setActiveTab("more")}
            />
          </Suspense>
        );
      case "stats":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
              </div>
            }
          >
            <StatsPage
              logs={logs}
              subjects={subjects}
              cycleStartDate={cycleStartDate}
              streak={streak}
              onNavigateBack={() => setActiveTab("more")}
            />
          </Suspense>
        );
      case "history":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
              </div>
            }
          >
            <HistoryPage
              logs={logs}
              subjects={subjects}
              onDeleteLog={handleDeleteLog}
              onEditLog={handleEditLogWithXP}
              onNavigateBack={() => setActiveTab("more")}
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
      case "appearance":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
              </div>
            }
          >
            <AppearancePage onNavigateBack={() => setActiveTab("more")} />
          </Suspense>
        );
      case "about":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
              </div>
            }
          >
            <AboutPage onNavigateBack={() => setActiveTab("more")} />
          </Suspense>
        );
      case "tutorial":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
              </div>
            }
          >
            <TutorialPage onNavigateBack={() => setActiveTab("more")} />
          </Suspense>
        );
      case "settings":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
              </div>
            }
          >
            <SettingsPage
              onNavigateBack={() => setActiveTab("more")}
              showPerformance={showPerformance}
              onTogglePerformance={handleTogglePerformance}
              subjects={subjects}
              logs={logs}
              userEmail={session?.user?.email}
            />
          </Suspense>
        );
      case "profile":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
              </div>
            }
          >
            <ProfilePage
              session={session}
              onNavigateBack={() => setActiveTab("more")}
              subscriptionStatus={subscriptionStatus}
              subscriptionType={subType}
              trialEndsAt={trialEndsAt}
              onNavigateToPlans={() => setActiveTab("plans")}
            />
          </Suspense>
        );
      case "plans":
        return (
          <PlanPage
            subscriptionStatus={subscriptionStatus}
            subscriptionType={subType}
            onNavigateBack={() => setActiveTab("more")}
          />
        );
      default:
        return null;
    }
  }, [
    activeTab,
    subjects,
    logs,
    cycleStartDate,
    handleDeleteLog,
    handleEditLogWithXP,
    dailyGoal,
    showPerformance,
    streak,
    loadingData,
    handleTimerStop,
    timerSeconds,
    setTimerSeconds,
    isTimerRunning,
    setIsTimerRunning,
    timerMode,
    setTimerMode,
    handleAddLog,
    prefilledTime,
    handleTimeClear,
    handleAddSubject,
    handleDeleteSubject,
    handleUpdateSubject,
    handleRestartCycle,
    handleReorderSubjects,
    session,
    handleNavigateToAchievements,
    handleNavigateToElo,
    handleNavigateToStats,
    handleNavigateToGoals,
    handleNavigateToAppearance,
    handleNavigateToAbout,
    handleOpenHistory,
    setShowFeedbackModal,
    handleNavigateToTutorial,
    handleOpenSecurity,
    handleOpenSettings,
    handleLogout,
    _handleNavigateToProfile,
    setActiveTab,
    handleTogglePerformance,
    subscriptionStatus,
    subType,
    trialEndsAt,
    welcomeSeen,
    handleWelcomeSeen,
    handleNavigateToTutorial,
    userName,
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
        onEditLog={handleEditLogWithXP}
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
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingAchievementsCount={pendingCount}
        />
      </div>

      {/* FAB Timer - Apenas Desktop */}
      {activeTab !== "timer" && (
        <FabTimer
          onClick={() => setActiveTab("timer")}
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
