import { useState, useMemo } from 'react';
import { Flame, Clock, BookOpen, Share2, TrendingUp, BarChart2, Zap, Trash2, History, Target, ChevronDown, ChevronUp, Calendar, Sparkles, CheckCircle, XCircle, Circle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import HistoryModal from '../components/HistoryModal';
import HeatmapModal from '../components/HeatmapModal';
import { Subject, StudyLog } from '../types';
import ShareModal from '../components/ShareModal';
import Skeleton from '../components/Skeleton';
import { getQuoteOfTheDay } from '../data/motivationalQuotes';
import { useGoals } from '../hooks/useGoals';

interface DashboardPageProps {
  subjects: Subject[];
  logs: StudyLog[];
  cycleStartDate: number;
  onDeleteLog: (id: string) => void;
  onEditLog: (id: string, updates: Partial<StudyLog>) => void;
  dailyGoal: number;
  showPerformance: boolean;
  streak: number;
  isLoading: boolean;
}

export default function DashboardPage({ subjects, logs, cycleStartDate, onDeleteLog, onEditLog, dailyGoal, showPerformance, streak, isLoading }: DashboardPageProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);
  
  const [isGeneralPerformanceExpanded, setIsGeneralPerformanceExpanded] = useState(false);
  const [expandedPerformanceSubjects, setExpandedPerformanceSubjects] = useState<Set<string>>(new Set());

  // Hook de metas
  const { getDailyProgress, getWeeklyProgress, getProgressColor, getProgressBadge } = useGoals(logs);
  const dailyProgress = getDailyProgress();
  const weeklyProgress = getWeeklyProgress();

  // --- LÓGICA ---

  const getTodayStats = () => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayLogs = logs.filter((log) => log.date === todayString);
    const totalMinutes = todayLogs.reduce((sum, log) => sum + log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60), 0);
    const totalPages = todayLogs.filter(log => log.type === 'teoria').reduce((sum, log) => sum + (log.pages || 0), 0);
    const totalQuestionsCount = todayLogs.filter((log) => log.type === 'questoes').reduce((sum, log) => sum + (log.correct || 0) + (log.wrong || 0) + (log.blank || 0), 0);
    const totalCorrect = todayLogs.filter((log) => log.type === 'questoes').reduce((sum, log) => sum + (log.correct || 0), 0);
    return { totalMinutes, totalPages, todayQuestions: totalQuestionsCount, totalCorrect };
  };

  const getSubjectProgress = (subjectId: string, goalMinutes: number) => {
    const totalMinutes = logs.filter((log) => log.subjectId === subjectId && log.timestamp >= cycleStartDate).reduce((sum, log) => sum + log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60), 0);
    const percentage = Math.min((totalMinutes / goalMinutes) * 100, 100);
    return { totalMinutes, percentage };
  };

  const getSubjectPerformance = (subjectId: string) => {
    // Contar questões de TODOS os tipos de estudo, não apenas 'questoes'
    const subjectLogs = logs.filter(log => log.subjectId === subjectId && log.timestamp >= cycleStartDate);
    const totalQuestions = subjectLogs.reduce((sum, log) => sum + (log.correct || 0) + (log.wrong || 0) + (log.blank || 0), 0);
    const totalCorrect = subjectLogs.reduce((sum, log) => sum + (log.correct || 0), 0);
    const totalWrong = subjectLogs.reduce((sum, log) => sum + (log.wrong || 0), 0);
    const totalBlank = subjectLogs.reduce((sum, log) => sum + (log.blank || 0), 0);
    const correctPct = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const wrongPct = totalQuestions > 0 ? (totalWrong / totalQuestions) * 100 : 0;
    const blankPct = totalQuestions > 0 ? (totalBlank / totalQuestions) * 100 : 0;
    const accuracy = Math.round(correctPct);
    return { totalQuestions, totalCorrect, totalWrong, totalBlank, correctPct, wrongPct, blankPct, accuracy };
  };

  // Calcula desempenho geral (todas as matérias juntas)
  const getGeneralPerformance = useMemo(() => {
    // Contar questões de TODOS os tipos de estudo, não apenas 'questoes'
    const cycleLogs = logs.filter(log => log.timestamp >= cycleStartDate);
    const totalQuestions = cycleLogs.reduce((sum, log) => sum + (log.correct || 0) + (log.wrong || 0) + (log.blank || 0), 0);
    const totalCorrect = cycleLogs.reduce((sum, log) => sum + (log.correct || 0), 0);
    const totalWrong = cycleLogs.reduce((sum, log) => sum + (log.wrong || 0), 0);
    const totalBlank = cycleLogs.reduce((sum, log) => sum + (log.blank || 0), 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    return { totalQuestions, totalCorrect, totalWrong, totalBlank, accuracy };
  }, [logs, cycleStartDate]);

  // Ordena matérias por desempenho (pior primeiro)
  const sortedSubjectsByPerformance = useMemo(() => {
    const mapped = [...subjects]
      .map(subject => {
        const perf = getSubjectPerformance(subject.id);
        return { subject, performance: perf };
      });
    // Mostrar TODAS as matérias, mesmo sem questões (removido filtro)
    return mapped.sort((a, b) => {
      // Ordenar: matérias com questões primeiro (por desempenho), depois matérias sem questões
      if (a.performance.totalQuestions === 0 && b.performance.totalQuestions === 0) return 0;
      if (a.performance.totalQuestions === 0) return 1;
      if (b.performance.totalQuestions === 0) return -1;
      return a.performance.accuracy - b.performance.accuracy; // Ordena por pior desempenho primeiro
    });
  }, [subjects, logs, cycleStartDate]);

  const toggleSubjectExpansion = (subjectId: string) => {
    setExpandedPerformanceSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };

  const getRecentActivities = () => { return [...logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5); };
  
  const getTotalHours = () => {
    const totalMinutes = logs.reduce((sum, log) => sum + log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { totalMinutes, hours, minutes };
  };

  const getLast7DaysStats = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const dayLogs = logs.filter(l => l.date === dateKey);
      const minutes = dayLogs.reduce((acc, log) => acc + (log.hours * 60) + log.minutes, 0);
      
      days.push({
        label: i === 0 ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3), 
        fullDate: d.toLocaleDateString('pt-BR'),
        minutes,
        heightPercentage: 0
      });
    }

    const maxMinutes = Math.max(...days.map(d => d.minutes), 1);
    return days.map(d => ({
      ...d,
      heightPercentage: Math.round((d.minutes / maxMinutes) * 100)
    }));
  };

  const weeklyStats = getLast7DaysStats();
  
  const { totalMinutes, totalPages, todayQuestions, totalCorrect } = getTodayStats();
  const { hours: totalHours } = getTotalHours();
  const recentActivities = getRecentActivities();
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const getTypeLabel = (type: string) => { const labels = { teoria: 'Teoria', questoes: 'Questões', revisao: 'Revisão' }; return labels[type as keyof typeof labels] || type; };
  const getAccuracyColor = (acc: number) => { if (acc >= 80) return 'bg-emerald-500'; if (acc >= 60) return 'bg-amber-500'; return 'bg-red-500'; };
  const getAccuracyTextColor = (acc: number) => { if (acc >= 80) return 'text-emerald-600 dark:text-emerald-400'; if (acc >= 60) return 'text-amber-600 dark:text-amber-400'; return 'text-red-600 dark:text-red-400'; };
  

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Acompanhe seu progresso</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* MOBILE LAYOUT - Skeletons */}
          <div className="lg:hidden space-y-6">
            {/* LINHA 1 - Mobile: 2 Skeletons */}
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            {/* LINHA 2 - Mobile: Gráfico */}
            <Skeleton className="h-48 w-full" />
            {/* LINHA 3 - Mobile: Meta */}
            <Skeleton className="h-32 w-full" />
            {/* LINHA 4 - Mobile: Progresso */}
            <Skeleton className="h-64 w-full" />
          </div>

          {/* DESKTOP LAYOUT - Skeletons */}
          <div className="hidden lg:block space-y-6">
            {/* LINHA 1 - Desktop: 2 Skeletons */}
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            {/* LINHA 2 - Desktop: Gráfico e Progresso */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="col-span-2 h-64 w-full" />
            </div>
            {/* LINHA 3 - Desktop: Desempenho e Recentes */}
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="col-span-2 h-80 w-full" />
              <Skeleton className="col-span-1 h-80 w-full" />
            </div>
          </div>
        </div>
      ) : (subjects.length > 0 || logs.length > 0) ? (
        <div className="space-y-6">
          
          {/* MOBILE LAYOUT */}
          <div className="lg:hidden space-y-6">
            {/* LINHA 1 - Mobile: Hoje e Total */}
            <div className="grid grid-cols-2 gap-6" data-tour="stats-cards-wrapper" data-tour-mobile="true">
              {/* Card Hoje */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 text-white shadow-lg transition-transform hover:scale-[1.02] duration-300" data-tour="stats-card">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="absolute top-3 right-3 z-20 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 active:scale-95"
                  title="Compartilhar Progresso do Dia"
                >
                  <Share2 size={18} />
                </button>
                <Clock className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20 rotate-12" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1 opacity-90">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">Hoje</span>
                  </div>
                  <p className="text-3xl font-black tracking-tight">{hours > 0 ? `${hours}h` : `${minutes}m`}</p>
                  <p className="text-xs font-medium opacity-80">{hours > 0 && minutes > 0 ? `${minutes}m adicionais` : 'Foco total!'}</p>
                </div>
              </div>

              {/* Card Total */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 text-white shadow-lg transition-transform hover:scale-[1.02] duration-300" data-tour="stats-card">
                <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20 rotate-12" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1 opacity-90">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">Total</span>
                  </div>
                  <p className="text-3xl font-black tracking-tight">{totalHours > 0 ? `${totalHours}h` : '0h'}</p>
                  <p className="text-xs font-medium opacity-80">{totalHours > 0 ? 'acumuladas no app' : 'Vamos começar?'}</p>
                </div>
              </div>
            </div>

            {/* LINHA 2 - Mobile: Ritmo da Semana (altura reduzida) */}
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg p-4 text-white transition-transform hover:scale-[1.005] duration-300">
              <Flame className="absolute -right-8 -bottom-8 w-40 h-40 text-white opacity-10 rotate-12" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-white" />
                    <h2 className="text-base font-bold text-white">Ritmo da Semana</h2>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl">
                    <Flame className="w-4 h-4 text-white" />
                    <div className="flex flex-col">
                      <span className="text-xl font-black leading-none">{streak}</span>
                      <span className="text-xs font-medium opacity-90 uppercase tracking-wide">dias</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between h-28 gap-1.5">
                  {weeklyStats.map((day, index) => (
                    <div key={index} className="flex flex-col items-center justify-end flex-1 h-full group cursor-pointer">
                      <div className="mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-6 bg-white/20 backdrop-blur-sm text-white text-xs py-0.5 px-1.5 rounded whitespace-nowrap z-10 pointer-events-none">
                        {Math.floor(day.minutes / 60)}h {day.minutes % 60}m
                      </div>
                      <div 
                        className={`w-full max-w-[35px] rounded-t transition-all duration-700 ease-out relative ${
                          day.label === 'Hoje' 
                            ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)]' 
                            : 'bg-white/30 hover:bg-white/50'
                        }`}
                        style={{ height: `${day.heightPercentage > 0 ? day.heightPercentage : 4}%` }} 
                      >
                      </div>
                      <span className={`text-xs mt-1 font-medium ${
                        day.label === 'Hoje' ? 'text-white font-bold' : 'text-white/80'
                      }`}>
                        {day.label}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Botão Ver mais */}
                <button
                  onClick={() => setShowHeatmapModal(true)}
                  className="mt-3 text-white hover:text-white/80 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Calendar size={14} />
                  Ver calendário completo →
                </button>
              </div>
            </div>

            {/* LINHA 2.5 - Mobile: Frase Motivacional */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 transition-colors duration-300 border border-gray-100 dark:border-gray-700 relative overflow-hidden"
            >
              <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500 dark:text-emerald-400 opacity-10 rotate-12" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <blockquote className="text-base md:text-lg font-medium text-gray-800 dark:text-white leading-relaxed">
                  "{getQuoteOfTheDay().text}"
                </blockquote>
              </div>
            </motion.div>

            {/* LINHA 3 - Mobile: Progresso Hoje */}
            <div className="space-y-4">
              {/* Card Progresso Hoje */}
              {(dailyProgress.time.goal > 0 || dailyProgress.questions.goal > 0) && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-100 dark:border-gray-700">
                  <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Target size={16} className="text-emerald-500" />
                    Progresso Hoje
                  </h2>

                  {/* Tempo de Estudo */}
                  {dailyProgress.time.goal > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <Clock size={14} className="text-emerald-500" />
                          Tempo de Estudo
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {dailyProgress.time.current.toFixed(1)}h / {dailyProgress.time.goal}h ({Math.floor(dailyProgress.time.percentage)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out rounded-full flex items-center justify-end pr-2 ${getProgressColor(dailyProgress.time.percentage)}`}
                          style={{ width: `${Math.min(dailyProgress.time.percentage, 100)}%` }}
                        >
                          {dailyProgress.time.percentage > 0 && dailyProgress.time.percentage < 100 && (
                            <div className="w-1 h-1 bg-white/60 rounded-full" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">0h</span>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          {getProgressBadge(dailyProgress.time.percentage)}
                        </span>
                        <span className="text-xs text-gray-400">{dailyProgress.time.goal}h</span>
                      </div>
                    </div>
                  )}

                  {/* Questões Resolvidas */}
                  {dailyProgress.questions.goal > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <HelpCircle size={14} className="text-emerald-500" />
                          Questões Resolvidas
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {dailyProgress.questions.current} / {dailyProgress.questions.goal} ({Math.floor(dailyProgress.questions.percentage)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out rounded-full flex items-center justify-end pr-2 ${getProgressColor(dailyProgress.questions.percentage)}`}
                          style={{ width: `${Math.min(dailyProgress.questions.percentage, 100)}%` }}
                        >
                          {dailyProgress.questions.percentage > 0 && dailyProgress.questions.percentage < 100 && (
                            <div className="w-1 h-1 bg-white/60 rounded-full" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">0</span>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          {getProgressBadge(dailyProgress.questions.percentage)}
                        </span>
                        <span className="text-xs text-gray-400">{dailyProgress.questions.goal}</span>
                      </div>
                    </div>
                  )}

                  {/* Resumo Semanal */}
                  {(weeklyProgress.time.goal > 0 || weeklyProgress.questions.goal > 0) && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <BarChart2 size={14} className="text-emerald-500" />
                          Progresso Semanal
                        </span>
                      </div>
                      {weeklyProgress.time.goal > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {weeklyProgress.time.current.toFixed(1)}h / {weeklyProgress.time.goal}h ({Math.floor(weeklyProgress.time.percentage)}%)
                        </p>
                      )}
                      {weeklyProgress.questions.goal > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {weeklyProgress.questions.current} / {weeklyProgress.questions.goal} questões ({Math.floor(weeklyProgress.questions.percentage)}%)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LINHA 4 - Mobile: Progresso */}
            {subjects.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 transition-colors duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">Progresso</h2>
                </div>
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {subjects.map((subject) => { 
                    const { totalMinutes, percentage } = getSubjectProgress(subject.id, subject.goalMinutes); 
                    return ( 
                      <div key={subject.id}> 
                        <div className="flex items-center justify-between mb-2"> 
                          <div className="flex items-center gap-2"> 
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} /> 
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{subject.name}</span> 
                          </div> 
                          <span className="text-xs text-gray-600 dark:text-gray-400">{totalMinutes}/{subject.goalMinutes} min</span> 
                        </div> 
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"> 
                          <div className="h-full transition-all duration-300 rounded-full" style={{ width: `${percentage}%`, backgroundColor: subject.color }} /> 
                        </div> 
                      </div> 
                    ); 
                  })}
                </div>
              </div>
            )}

            {/* LINHA 5 - Mobile: Desempenho */}
            {subjects.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 md:p-5 transition-colors duration-300 border border-gray-100 dark:border-gray-700">
                {/* Nível 0 - Header e Resumo Geral */}
                <button
                  onClick={() => setIsGeneralPerformanceExpanded(!isGeneralPerformanceExpanded)}
                  className="w-full flex items-center justify-between mb-4 group outline-none"
                  aria-expanded={isGeneralPerformanceExpanded}
                  aria-label={isGeneralPerformanceExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                >
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Desempenho Geral</h2>
                  </div>
                  {isGeneralPerformanceExpanded ? (
                    <ChevronUp size={20} className="text-gray-500 group-hover:text-emerald-500 transition-colors duration-200" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-500 group-hover:text-emerald-500 transition-colors duration-200" />
                  )}
                </button>

                {/* Resumo Geral - Sempre Visível */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-2xl font-black ${getAccuracyTextColor(getGeneralPerformance.accuracy)}`}>
                      {getGeneralPerformance.accuracy}%
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      {getGeneralPerformance.totalQuestions} questões • 
                      <span className="flex items-center gap-1">
                        <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                        {getGeneralPerformance.totalCorrect}
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle size={14} className="text-red-600 dark:text-red-400" />
                        {getGeneralPerformance.totalWrong}
                      </span>
                      <span className="flex items-center gap-1">
                        <Circle size={14} className="text-blue-500 dark:text-blue-400" />
                        {getGeneralPerformance.totalBlank}
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${getAccuracyColor(getGeneralPerformance.accuracy)}`}
                      style={{ width: `${getGeneralPerformance.accuracy}%` }}
                    />
                  </div>
                </div>

                {/* Nível 1 - Lista de Matérias (quando expandido) */}
                <motion.div
                  initial={false}
                  animate={{
                    height: isGeneralPerformanceExpanded ? 'auto' : 0,
                    opacity: isGeneralPerformanceExpanded ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  {isGeneralPerformanceExpanded && sortedSubjectsByPerformance.length > 0 && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <BookOpen size={16} className="text-emerald-600 dark:text-emerald-400" />
                            Por Matéria:
                          </h3>
                          <div className="space-y-3">
                            {sortedSubjectsByPerformance.map(({ subject, performance }) => {
                              const isSubjectExpanded = expandedPerformanceSubjects.has(subject.id);
                              return (
                                <div
                                  key={`perf-${subject.id}`}
                                  className={`bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 transition-all duration-200 ${
                                    isSubjectExpanded ? 'border-2 border-emerald-500' : 'border border-gray-200 dark:border-gray-600'
                                  }`}
                                >
                                  {/* Header da Matéria */}
                                  <button
                                    onClick={() => toggleSubjectExpansion(subject.id)}
                                    className="w-full flex items-center justify-between mb-2 group outline-none"
                                    aria-expanded={isSubjectExpanded}
                                    aria-label={isSubjectExpanded ? `Recolher detalhes de ${subject.name}` : `Expandir detalhes de ${subject.name}`}
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate text-left">
                                        {subject.name}
                                      </span>
                                      <ChevronDown 
                                        size={14} 
                                        className={`text-gray-400 group-hover:text-emerald-500 transition-all duration-300 flex-shrink-0 ${
                                          isSubjectExpanded ? 'rotate-180' : 'rotate-0'
                                        }`}
                                      />
                                    </div>
                                    <div className="text-right ml-2 flex-shrink-0">
                                      <span className={`text-sm font-bold ${getAccuracyTextColor(performance.accuracy)}`}>
                                        {performance.accuracy}%
                                      </span>
                                    </div>
                                  </button>

                                  {/* Barra Simples (quando fechada) */}
                                  {!isSubjectExpanded && (
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden mb-2">
                                      <div
                                        className={`h-full transition-all duration-500 rounded-full ${getAccuracyColor(performance.accuracy)}`}
                                        style={{ width: `${performance.accuracy}%` }}
                                      />
                                    </div>
                                  )}

                                  {/* Total de questões */}
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {performance.totalQuestions} questões
                                  </p>

                                  {/* Nível 2 - Detalhes da Matéria (quando expandida) */}
                                  <div className={`grid transition-all duration-300 ease-in-out ${isSubjectExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden">
                                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                        {/* Barra Tricolor */}
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden flex mb-3">
                                          <div
                                            style={{ width: `${performance.correctPct}%` }}
                                            className="h-full bg-emerald-500"
                                          />
                                          <div
                                            style={{ width: `${performance.wrongPct}%` }}
                                            className="h-full bg-red-500"
                                          />
                                          <div
                                            style={{ width: `${performance.blankPct}%` }}
                                            className="h-full bg-blue-400"
                                          />
                                        </div>
                                        {/* Breakdown */}
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                            <CheckCircle size={14} />
                                            {performance.totalCorrect} certas
                                          </span>
                                          <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                                            <XCircle size={14} />
                                            {performance.totalWrong} erradas
                                          </span>
                                          <span className="text-blue-500 dark:text-blue-400 font-medium flex items-center gap-1">
                                            <Circle size={14} />
                                            {performance.totalBlank} em branco
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {isGeneralPerformanceExpanded && sortedSubjectsByPerformance.length === 0 && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-center text-gray-400 py-2 italic">
                            Nenhuma matéria no ciclo atual.
                          </p>
                        </div>
                      )}
                    </motion.div>
              </div>
            )}

            {/* LINHA 6 - Mobile: Recentes */}
            {recentActivities.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 transition-colors duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">Recentes</h2>
                </div>
                <div className="space-y-3">
                  {recentActivities.map((log) => { 
                    const subject = subjects.find((s) => s.id === log.subjectId); 
                    const logMinutes = log.hours * 60 + log.minutes; 
                    return ( 
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 transition-colors"> 
                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: subject?.color || '#6b7280' }} /> 
                        <div className="flex-1 min-w-0"> 
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{subject?.name || 'Matéria Excluída'}</p> 
                          <p className="text-xs text-gray-600 dark:text-gray-400">{getTypeLabel(log.type)} • {logMinutes} min</p> 
                          {log.notes && (<p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">{log.notes}</p>)} 
                        </div> 
                        <div className="flex items-center gap-2 flex-shrink-0"> 
                          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span> 
                          <button 
                            onClick={() => onDeleteLog(log.id)} 
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors active:scale-95"
                            aria-label="Excluir registro"
                            title="Excluir registro"
                          > 
                            <Trash2 size={16} /> 
                          </button> 
                        </div> 
                      </div> 
                    ); 
                  })}
                </div>
                <button onClick={() => setShowHistoryModal(true)} className="w-full mt-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"> <History size={18} /> Ver histórico </button>
              </div>
            )}
          </div>

          {/* DESKTOP LAYOUT */}
          <div className="hidden lg:block space-y-6">
            {/* LINHA 1 - Desktop: Hoje, Total, Meta Diária */}
            <div className="grid grid-cols-3 gap-6" data-tour="dashboard-stats" data-tour-desktop="true">
              {/* Wrapper para os cards de estatísticas (apenas para o tour) */}
              <div className="col-span-2 grid grid-cols-2 gap-6" data-tour="stats-cards-wrapper" data-tour-desktop="true">
                {/* Card Hoje */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 md:p-6 text-white shadow-lg transition-transform hover:scale-[1.02] duration-300" data-tour="stats-card">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="absolute top-3 right-3 z-20 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 active:scale-95"
                    title="Compartilhar Progresso do Dia"
                  >
                    <Share2 size={18} />
                  </button>
                  <Clock className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20 rotate-12" />
                  <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px] md:min-h-[140px]">
                    <div className="flex items-center gap-2 mb-2 md:mb-3 opacity-90">
                      <Clock className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="text-xs md:text-sm font-bold uppercase tracking-wide">Hoje</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-3xl md:text-6xl font-black tracking-tight leading-none mb-1 md:mb-2">{hours > 0 ? `${hours}h` : `${minutes}m`}</p>
                      <p className="text-xs md:text-xs font-medium opacity-80">{hours > 0 && minutes > 0 ? `${minutes}m adicionais` : 'Foco total!'}</p>
                    </div>
                  </div>
                </div>

                {/* Card Total */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 md:p-6 text-white shadow-lg transition-transform hover:scale-[1.02] duration-300" data-tour="stats-card">
                  <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20 rotate-12" />
                  <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px] md:min-h-[140px]">
                    <div className="flex items-center gap-2 mb-2 md:mb-3 opacity-90">
                      <Zap className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="text-xs md:text-sm font-bold uppercase tracking-wide">Total</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-3xl md:text-6xl font-black tracking-tight leading-none mb-1 md:mb-2">{totalHours > 0 ? `${totalHours}h` : '0h'}</p>
                      <p className="text-xs md:text-xs font-medium opacity-80">{totalHours > 0 ? 'acumuladas no app' : 'Vamos começar?'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna Esquerda: Progresso Hoje */}
              <div className="col-span-1 space-y-4">
                {/* Card Progresso Hoje */}
                {(dailyProgress.time.goal > 0 || dailyProgress.questions.goal > 0) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <Target size={16} className="text-emerald-500" />
                      Progresso Hoje
                    </h2>

                    {/* Tempo de Estudo */}
                    {dailyProgress.time.goal > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <Clock size={14} className="text-emerald-500" />
                            Tempo de Estudo
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {dailyProgress.time.current.toFixed(1)}h / {dailyProgress.time.goal}h ({Math.floor(dailyProgress.time.percentage)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out rounded-full flex items-center justify-end pr-2 ${getProgressColor(dailyProgress.time.percentage)}`}
                            style={{ width: `${Math.min(dailyProgress.time.percentage, 100)}%` }}
                          >
                            {dailyProgress.time.percentage > 0 && dailyProgress.time.percentage < 100 && (
                              <div className="w-1 h-1 bg-white/60 rounded-full" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">0h</span>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {getProgressBadge(dailyProgress.time.percentage)}
                          </span>
                          <span className="text-xs text-gray-400">{dailyProgress.time.goal}h</span>
                        </div>
                      </div>
                    )}

                    {/* Questões Resolvidas */}
                    {dailyProgress.questions.goal > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <HelpCircle size={14} className="text-emerald-500" />
                            Questões Resolvidas
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {dailyProgress.questions.current} / {dailyProgress.questions.goal} ({Math.floor(dailyProgress.questions.percentage)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out rounded-full flex items-center justify-end pr-2 ${getProgressColor(dailyProgress.questions.percentage)}`}
                            style={{ width: `${Math.min(dailyProgress.questions.percentage, 100)}%` }}
                          >
                            {dailyProgress.questions.percentage > 0 && dailyProgress.questions.percentage < 100 && (
                              <div className="w-1 h-1 bg-white/60 rounded-full" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">0</span>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {getProgressBadge(dailyProgress.questions.percentage)}
                          </span>
                          <span className="text-xs text-gray-400">{dailyProgress.questions.goal}</span>
                        </div>
                      </div>
                    )}

                    {/* Resumo Semanal */}
                    {(weeklyProgress.time.goal > 0 || weeklyProgress.questions.goal > 0) && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <BarChart2 size={14} className="text-emerald-500" />
                            Progresso Semanal
                          </span>
                        </div>
                        {weeklyProgress.time.goal > 0 && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {weeklyProgress.time.current.toFixed(1)}h / {weeklyProgress.time.goal}h ({Math.floor(weeklyProgress.time.percentage)}%)
                          </p>
                        )}
                        {weeklyProgress.questions.goal > 0 && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {weeklyProgress.questions.current} / {weeklyProgress.questions.goal} questões ({Math.floor(weeklyProgress.questions.percentage)}%)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* LINHA 2 - Desktop: Ritmo da Semana e Progresso */}
            <div className="grid grid-cols-3 gap-6">
              {/* GRÁFICO SEMANAL */}
              <div className="col-span-2 relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg p-6 text-white transition-transform hover:scale-[1.005] duration-300">
                <Flame className="absolute -right-8 -bottom-8 w-40 h-40 text-white opacity-10 rotate-12" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-white" />
                      <h2 className="text-lg font-bold text-white">Ritmo da Semana</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                        <Flame className="w-5 h-5 text-white" />
                        <div className="flex flex-col">
                          <span className="text-2xl font-black leading-none">{streak}</span>
                          <span className="text-xs font-medium opacity-90 uppercase tracking-wide">dias seguidos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between h-40 gap-2">
                    {weeklyStats.map((day, index) => (
                      <div key={index} className="flex flex-col items-center justify-end flex-1 h-full group cursor-pointer">
                        <div className="mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-8 bg-white/20 backdrop-blur-sm text-white text-xs py-1 px-2 rounded-lg whitespace-nowrap z-10 pointer-events-none">
                          {Math.floor(day.minutes / 60)}h {day.minutes % 60}m
                        </div>
                        <div 
                          className={`w-full max-w-[40px] rounded-t-lg transition-all duration-700 ease-out relative ${
                            day.label === 'Hoje' 
                              ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' 
                              : 'bg-white/30 hover:bg-white/50'
                          }`}
                          style={{ height: `${day.heightPercentage > 0 ? day.heightPercentage : 4}%` }} 
                        >
                        </div>
                        <span className={`text-xs mt-2 font-medium ${
                          day.label === 'Hoje' ? 'text-white font-bold' : 'text-white/80'
                        }`}>
                          {day.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Botão Ver mais */}
                  <button
                    onClick={() => setShowHeatmapModal(true)}
                    className="mt-4 text-white hover:text-white/80 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Calendar size={14} />
                    Ver calendário completo →
                  </button>
                </div>
              </div>

              {/* Progresso do Ciclo */}
              {subjects.length > 0 && (
                <div className="col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Progresso</h2>
                  </div>
                  <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {subjects.map((subject) => { 
                      const { totalMinutes, percentage } = getSubjectProgress(subject.id, subject.goalMinutes); 
                      return ( 
                        <div key={subject.id}> 
                          <div className="flex items-center justify-between mb-2"> 
                            <div className="flex items-center gap-2"> 
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} /> 
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{subject.name}</span> 
                            </div> 
                            <span className="text-xs text-gray-600 dark:text-gray-400">{totalMinutes}/{subject.goalMinutes} min</span> 
                          </div> 
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"> 
                            <div className="h-full transition-all duration-300 rounded-full" style={{ width: `${percentage}%`, backgroundColor: subject.color }} /> 
                          </div> 
                        </div> 
                      ); 
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* LINHA 2.5 - Desktop: Frase Motivacional */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 transition-colors duration-300 border border-gray-100 dark:border-gray-700 relative overflow-hidden"
            >
              <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500 dark:text-emerald-400 opacity-10 rotate-12" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <blockquote className="text-base md:text-lg font-medium text-gray-800 dark:text-white leading-relaxed max-w-3xl">
                  "{getQuoteOfTheDay().text}"
                </blockquote>
              </div>
            </motion.div>

            {/* LINHA 3 - Desktop: Desempenho e Recentes */}
            <div className="grid grid-cols-3 gap-6">
              {/* Card Desempenho */}
              {subjects.length > 0 && (
                <div className="col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 transition-colors duration-300 border border-gray-100 dark:border-gray-700">
                  {/* Nível 0 - Header e Resumo Geral */}
                  <button
                    onClick={() => setIsGeneralPerformanceExpanded(!isGeneralPerformanceExpanded)}
                    className="w-full flex items-center justify-between mb-4 group outline-none"
                    aria-expanded={isGeneralPerformanceExpanded}
                    aria-label={isGeneralPerformanceExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                  >
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h2 className="text-lg font-bold text-gray-800 dark:text-white">Desempenho Geral</h2>
                    </div>
                    {isGeneralPerformanceExpanded ? (
                      <ChevronUp size={20} className="text-gray-500 group-hover:text-emerald-500 transition-colors duration-200" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-500 group-hover:text-emerald-500 transition-colors duration-200" />
                    )}
                  </button>

                  {/* Resumo Geral - Sempre Visível */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-2xl font-black ${getAccuracyTextColor(getGeneralPerformance.accuracy)}`}>
                        {getGeneralPerformance.accuracy}%
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        {getGeneralPerformance.totalQuestions} questões • 
                        <span className="flex items-center gap-1">
                          <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                          {getGeneralPerformance.totalCorrect}
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle size={14} className="text-red-600 dark:text-red-400" />
                          {getGeneralPerformance.totalWrong}
                        </span>
                        <span className="flex items-center gap-1">
                          <Circle size={14} className="text-blue-500 dark:text-blue-400" />
                          {getGeneralPerformance.totalBlank}
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${getAccuracyColor(getGeneralPerformance.accuracy)}`}
                        style={{ width: `${getGeneralPerformance.accuracy}%` }}
                      />
                    </div>
                  </div>

                  {/* Nível 1 - Lista de Matérias (quando expandido) */}
                  <motion.div
                    initial={false}
                    animate={{
                      height: isGeneralPerformanceExpanded ? 'auto' : 0,
                      opacity: isGeneralPerformanceExpanded ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {isGeneralPerformanceExpanded && sortedSubjectsByPerformance.length > 0 && (
                          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <BookOpen size={16} className="text-emerald-600 dark:text-emerald-400" />
                              Por Matéria:
                            </h3>
                            <div className="space-y-3">
                              {sortedSubjectsByPerformance.map(({ subject, performance }) => {
                                const isSubjectExpanded = expandedPerformanceSubjects.has(subject.id);
                                return (
                                  <div
                                    key={`perf-${subject.id}`}
                                    className={`bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 transition-all duration-200 ${
                                      isSubjectExpanded ? 'border-2 border-emerald-500' : 'border border-gray-200 dark:border-gray-600'
                                    }`}
                                  >
                                    {/* Header da Matéria */}
                                    <button
                                      onClick={() => toggleSubjectExpansion(subject.id)}
                                      className="w-full flex items-center justify-between mb-2 group outline-none"
                                      aria-expanded={isSubjectExpanded}
                                      aria-label={isSubjectExpanded ? `Recolher detalhes de ${subject.name}` : `Expandir detalhes de ${subject.name}`}
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate text-left">
                                          {subject.name}
                                        </span>
                                        <ChevronDown 
                                          size={14} 
                                          className={`text-gray-400 group-hover:text-emerald-500 transition-all duration-300 flex-shrink-0 ${
                                            isSubjectExpanded ? 'rotate-180' : 'rotate-0'
                                          }`}
                                        />
                                      </div>
                                      <div className="text-right ml-2 flex-shrink-0">
                                        <span className={`text-sm font-bold ${getAccuracyTextColor(performance.accuracy)}`}>
                                          {performance.accuracy}%
                                        </span>
                                      </div>
                                    </button>

                                    {/* Barra Simples (quando fechada) */}
                                    {!isSubjectExpanded && (
                                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden mb-2">
                                        <div
                                          className={`h-full transition-all duration-500 rounded-full ${getAccuracyColor(performance.accuracy)}`}
                                          style={{ width: `${performance.accuracy}%` }}
                                        />
                                      </div>
                                    )}

                                    {/* Total de questões */}
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {performance.totalQuestions} questões
                                    </p>

                                    {/* Nível 2 - Detalhes da Matéria (quando expandida) */}
                                    <div className={`grid transition-all duration-300 ease-in-out ${isSubjectExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                      <div className="overflow-hidden">
                                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                          {/* Barra Tricolor */}
                                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden flex mb-3">
                                            <div
                                              style={{ width: `${performance.correctPct}%` }}
                                              className="h-full bg-emerald-500"
                                            />
                                            <div
                                              style={{ width: `${performance.wrongPct}%` }}
                                              className="h-full bg-red-500"
                                            />
                                            <div
                                              style={{ width: `${performance.blankPct}%` }}
                                              className="h-full bg-blue-400"
                                            />
                                          </div>
                                          {/* Breakdown */}
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                              <CheckCircle size={14} />
                                              {performance.totalCorrect} certas
                                            </span>
                                            <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                                              <XCircle size={14} />
                                              {performance.totalWrong} erradas
                                            </span>
                                            <span className="text-blue-500 dark:text-blue-400 font-medium flex items-center gap-1">
                                              <Circle size={14} />
                                              {performance.totalBlank} em branco
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {isGeneralPerformanceExpanded && sortedSubjectsByPerformance.length === 0 && (
                          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-center text-gray-400 py-2 italic">
                              Nenhuma matéria no ciclo atual.
                            </p>
                          </div>
                        )}
                      </motion.div>
                </div>
              )}

              {/* Atividades Recentes */}
              {recentActivities.length > 0 && (
                <div className="col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Recentes</h2>
                  </div>
                  <div className="space-y-3">
                    {recentActivities.map((log) => { 
                      const subject = subjects.find((s) => s.id === log.subjectId); 
                      const logMinutes = log.hours * 60 + log.minutes; 
                      return ( 
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 transition-colors"> 
                          <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: subject?.color || '#6b7280' }} /> 
                          <div className="flex-1 min-w-0"> 
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{subject?.name || 'Matéria Excluída'}</p> 
                            <p className="text-xs text-gray-600 dark:text-gray-400">{getTypeLabel(log.type)} • {logMinutes} min</p> 
                            {log.notes && (<p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">{log.notes}</p>)} 
                          </div> 
                          <div className="flex items-center gap-2 flex-shrink-0"> 
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span> 
                            <button 
                            onClick={() => onDeleteLog(log.id)} 
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors active:scale-95"
                            aria-label="Excluir registro"
                            title="Excluir registro"
                          > 
                            <Trash2 size={16} /> 
                          </button> 
                          </div> 
                        </div> 
                      ); 
                    })}
                  </div>
                  <button onClick={() => setShowHistoryModal(true)} className="w-full mt-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"> <History size={18} /> Ver histórico </button>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 text-center transition-colors duration-300 mt-10">
          <p className="text-gray-600 dark:text-gray-300 mb-2">Bem-vindo ao StudyFlow!</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Comece adicionando matérias na aba <strong className="text-emerald-500">Ciclo</strong>.</p>
        </div>
      )}

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        todayMinutes={totalMinutes}
        todayPages={totalPages}
        todayQuestions={todayQuestions}
        todayCorrect={totalCorrect}
        showPerformance={showPerformance}
      />

      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        logs={logs}
        subjects={subjects}
        onDeleteLog={onDeleteLog}
        onEditLog={onEditLog}
      />

      <HeatmapModal
        isOpen={showHeatmapModal}
        onClose={() => setShowHeatmapModal(false)}
        logs={logs}
        dailyGoal={dailyGoal}
      />
    </div>
  );
}