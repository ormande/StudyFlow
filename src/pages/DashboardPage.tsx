import { useState } from 'react';
import { Flame, Clock, BookOpen, Share2, TrendingUp, BarChart2, Zap, Trash2, History, Target, ChevronDown, ChevronUp } from 'lucide-react';
import HistoryModal from '../components/HistoryModal';
import { Subject, StudyLog } from '../types';
import ShareModal from '../components/ShareModal';

interface DashboardPageProps {
  subjects: Subject[];
  logs: StudyLog[];
  cycleStartDate: number;
  onDeleteLog: (id: string) => void;
  onEditLog: (id: string, updates: Partial<StudyLog>) => void;
  dailyGoal: number;
  showPerformance: boolean;
}

export default function DashboardPage({ subjects, logs, cycleStartDate, onDeleteLog, onEditLog, dailyGoal, showPerformance }: DashboardPageProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const [expandedPerformanceId, setExpandedPerformanceId] = useState<string | null>(null);

  // --- LÓGICA DE ESTATÍSTICAS ---
  const calculateStreak = () => {
    if (logs.length === 0) return 0;
    const studyDates = new Set(
      logs.map(log => new Date(log.timestamp).toLocaleDateString('pt-BR'))
    );
    const today = new Date();
    const todayStr = today.toLocaleDateString('pt-BR');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('pt-BR');
    let streak = 0;
    let currentCheckDate = new Date();

    if (!studyDates.has(todayStr) && !studyDates.has(yesterdayStr)) {
      return 0;
    }

    for (let i = 0; i < 365; i++) {
      const dateString = currentCheckDate.toLocaleDateString('pt-BR');
      if (studyDates.has(dateString)) {
        streak++;
      } else {
        if (i === 0 && !studyDates.has(todayStr)) {
           currentCheckDate.setDate(currentCheckDate.getDate() - 1);
           continue;
        }
        break;
      }
      currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    }
    return streak;
  };

  const getTodayStats = (): { totalMinutes: number; totalPages: number; todayQuestions: number; totalCorrect: number } => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayLogs = logs.filter((log) => log.date === todayString);

    const totalMinutes = todayLogs.reduce(
      (sum, log) => sum + log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60),
      0
    );
    const totalPages = todayLogs
      .filter(log => log.type === 'teoria')
      .reduce((sum, log) => sum + (log.pages || 0), 0);
    const totalQuestionsCount = todayLogs
      .filter((log) => log.type === 'questoes')
      .reduce((sum, log) => sum + (log.correct || 0) + (log.wrong || 0) + (log.blank || 0), 0);
    const totalCorrect = todayLogs
      .filter((log) => log.type === 'questoes')
      .reduce((sum, log) => sum + (log.correct || 0), 0);

    return { totalMinutes, totalPages, todayQuestions: totalQuestionsCount, totalCorrect };
  };

  const getSubjectProgress = (subjectId: string, goalMinutes: number) => {
    const totalMinutes = logs
      .filter((log) => log.subjectId === subjectId && log.timestamp >= cycleStartDate)
      .reduce((sum, log) => sum + log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60), 0);
    const percentage = Math.min((totalMinutes / goalMinutes) * 100, 100);
    return { totalMinutes, percentage };
  };

  const getSubjectPerformance = (subjectId: string) => {
    const subjectLogs = logs.filter(log => 
      log.subjectId === subjectId && 
      log.type === 'questoes' &&
      log.timestamp >= cycleStartDate 
    );
    
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

  const getRecentActivities = () => {
    return [...logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  };

  const getTotalHours = () => {
    const totalMinutes = logs.reduce(
      (sum, log) => sum + log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60),
      0
    );
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { totalMinutes, hours, minutes };
  };

  const streak = calculateStreak();
  const { totalMinutes, totalPages, todayQuestions, totalCorrect } = getTodayStats();
  const { hours: totalHours, minutes: totalMin } = getTotalHours();
  const recentActivities = getRecentActivities();
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const getTypeLabel = (type: string) => {
    const labels = { teoria: 'Teoria', questoes: 'Questões', revisao: 'Revisão' };
    return labels[type as keyof typeof labels] || type;
  };

  const getAccuracyColor = (acc: number) => {
    if (acc >= 80) return 'bg-emerald-500'; 
    if (acc >= 50) return 'bg-yellow-500';  
    return 'bg-red-500';                    
  };

  const getAccuracyTextColor = (acc: number) => {
    if (acc >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (acc >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const goalPercentage = dailyGoal > 0 ? Math.min((totalMinutes / dailyGoal) * 100, 100) : 0;
  
  const getMotivationalMessage = () => {
    if (goalPercentage >= 100) return "MISSÃO CUMPRIDA! 🏆";
    if (goalPercentage >= 75) return "Reta final! Não pare agora! 🔥";
    if (goalPercentage >= 50) return "Metade já foi! Continue firme! 👊";
    if (goalPercentage > 0) return "Bom começo! Mantenha o foco. 🚀";
    return "Vamos começar os estudos de hoje?";
  };

  return (
    <div className="max-w-lg md:max-w-5xl mx-auto px-6 py-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Header */}
<div className="mb-8">
  <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Dashboard</h1>
  <p className="text-gray-600 dark:text-gray-400 text-sm">Acompanhe seu progresso</p>
</div>

{/* Botão Compartilhar - Fixo */}
<button
  onClick={() => setShowShareModal(true)}
  className="fixed top-6 left-6 z-50 h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all duration-300 active:scale-95 hover:scale-110"
  title="Compartilhar Progresso"
>
  <Share2 className="w-5 h-5" />
</button>

      {/* Cards de Resumo (KPIs) */}
      {(subjects.length > 0 || logs.length > 0) && (
      <div className="grid grid-cols-3 gap-3 mb-6">
        
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white shadow-lg transition-transform hover:scale-[1.02] duration-300">
          <Flame className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20 rotate-12" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">Ofensiva</span>
            </div>
            <p className="text-3xl font-black tracking-tight">{streak}</p>
            <p className="text-[10px] font-medium opacity-80">dias consecutivos</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 text-white shadow-lg transition-transform hover:scale-[1.02] duration-300">
          <Clock className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20 rotate-12" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">Hoje</span>
            </div>
            <p className="text-3xl font-black tracking-tight">
              {hours > 0 ? `${hours}h` : `${minutes}m`}
            </p>
            <p className="text-[10px] font-medium opacity-80">
              {hours > 0 && minutes > 0 ? `${minutes}m adicionais` : 'Foco total!'}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 text-white shadow-lg transition-transform hover:scale-[1.02] duration-300">
          <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20 rotate-12" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">Total</span>
            </div>
            <p className="text-3xl font-black tracking-tight">
              {totalHours > 0 ? `${totalHours}h` : '0h'}
            </p>
            <p className="text-[10px] font-medium opacity-80">
              {totalHours > 0 ? 'acumuladas no app' : 'Vamos começar?'}
            </p>
          </div>
        </div>
      </div>
)}
  
      {/* GRID: Esquerda / Direita */}
      {(subjects.length > 0 || logs.length > 0) && (
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8 gap-6">
        
        {/* COLUNA ESQUERDA */}
        <div className="space-y-6">
          
          {dailyGoal > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Target size={16} className={goalPercentage >= 100 ? "text-yellow-500" : "text-emerald-500"} />
                    Meta Diária
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {getMotivationalMessage()}
                  </p>
                </div>
                <span className="text-lg font-black text-gray-800 dark:text-white">
                  {Math.floor(goalPercentage)}%
                </span>
              </div>

              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 ease-out rounded-full flex items-center justify-end pr-2 ${
                    goalPercentage >= 100 
                      ? 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse' 
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${goalPercentage > 0 ? goalPercentage : 0}%` }}
                >
                  {goalPercentage > 0 && <div className="w-1 h-1 bg-white/50 rounded-full" />}
                </div>
              </div>
              
              <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase">
                <span>0h</span>
                <span>{Math.floor(dailyGoal / 60)}h</span>
              </div>
            </div>
          )}

          {subjects.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Progresso do Ciclo Atual</h2>
              </div>

              <div className="space-y-4">
                {subjects.map((subject) => {
                  const { totalMinutes, percentage } = getSubjectProgress(subject.id, subject.goalMinutes);
                  return (
                    <div key={subject.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{subject.name}</span>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {totalMinutes}/{subject.goalMinutes} min
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full transition-all duration-300 rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: subject.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-6">

          {/* DESEMPENHO COM ANIMAÇÃO SUAVE */}
          {subjects.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Desempenho (Ciclo Atual)</h2>
              </div>

              <div className="space-y-5">
                {subjects.map((subject) => {
                  const { totalQuestions, totalCorrect, totalWrong, totalBlank, correctPct, wrongPct, blankPct, accuracy } = getSubjectPerformance(subject.id);
                  const isExpanded = expandedPerformanceId === subject.id;

                  return (
                    <div key={`perf-${subject.id}`}>
                      <button 
                        onClick={() => setExpandedPerformanceId(isExpanded ? null : subject.id)}
                        className="w-full flex items-center justify-between mb-1 group outline-none"
                      >
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate text-left">
                             {subject.name}
                           </span>
                           {/* Ícone Gira Suavemente */}
                           <ChevronDown 
                              size={14} 
                              className={`text-gray-400 group-hover:text-emerald-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                           />
                        </div>
                        
                        <div className="text-right">
                          <span className={`text-sm font-bold ${totalQuestions === 0 ? 'text-gray-400' : getAccuracyTextColor(accuracy)}`}>
                            {totalQuestions > 0 ? `${accuracy}%` : '-'}
                          </span>
                          {totalQuestions > 0 && (
                            <p className="text-[10px] text-gray-400">{totalQuestions} questões</p>
                          )}
                        </div>
                      </button>

                      {/* Barra de Progresso Principal (Some suavemente) */}
                      <div 
                        className={`w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'opacity-0 h-0 mb-0' : 'opacity-100 h-1.5'}`}
                      >
                         {totalQuestions > 0 ? (
                           <div 
                             className={`h-full transition-all duration-500 rounded-full ${getAccuracyColor(accuracy)}`} 
                             style={{ width: `${accuracy}%` }} 
                           />
                         ) : (
                           <div className="h-full w-full bg-gray-100 dark:bg-gray-700" /> 
                         )}
                      </div>

                      {/* GAVETA ANIMADA (ACORDEÃO) */}
                      <div 
                        className={`grid transition-all duration-300 ease-in-out ${
                          isExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          {totalQuestions > 0 ? (
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden flex mb-2">
                                <div style={{ width: `${correctPct}%` }} className="h-full bg-emerald-500" />
                                <div style={{ width: `${wrongPct}%` }} className="h-full bg-red-500" />
                                <div style={{ width: `${blankPct}%` }} className="h-full bg-blue-400" />
                              </div>
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                <div className="text-emerald-600 dark:text-emerald-400 flex flex-col items-center">
                                  <span>Certas</span>
                                  <span className="text-sm">{totalCorrect}</span>
                                </div>
                                <div className="text-red-600 dark:text-red-400 flex flex-col items-center">
                                  <span>Erradas</span>
                                  <span className="text-sm">{totalWrong}</span>
                                </div>
                                <div className="text-blue-500 dark:text-blue-300 flex flex-col items-center">
                                  <span>Branco</span>
                                  <span className="text-sm">{totalBlank}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-center text-gray-400 py-2 italic">Nenhuma questão neste ciclo.</p>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
              
              {subjects.every(s => getSubjectPerformance(s.id).totalQuestions === 0) && (
                 <p className="text-xs text-center text-gray-400 mt-4 italic">
                   Nenhuma questão registrada no ciclo atual.
                 </p>
              )}
            </div>
          )}

          {/* Atividades Recentes */}
          {recentActivities.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Atividades Recentes</h2>
              </div>

              <div className="space-y-3">
                {recentActivities.map((log) => {
                  const subject = subjects.find((s) => s.id === log.subjectId);
                  const logMinutes = log.hours * 60 + log.minutes;

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 transition-colors"
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: subject?.color || '#6b7280' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {subject?.name || 'Matéria Excluída'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {getTypeLabel(log.type)} • {logMinutes} min
                        </p>
                        {log.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                            {log.notes}
                          </p>
                        )}
                      </div>
                       <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors active:scale-95"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowHistoryModal(true)}
                className="w-full mt-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <History size={18} />
                Ver histórico completo
              </button>
            </div>
          )}
        </div>
      </div>

      {subjects.length === 0 && logs.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 text-center transition-colors duration-300">
          <p className="text-gray-600 dark:text-gray-300 mb-2">Bem-vindo ao StudyFlow!</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Comece adicionando matérias na aba Ciclo e registre seus estudos.
          </p>
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
    </div>
  );
}