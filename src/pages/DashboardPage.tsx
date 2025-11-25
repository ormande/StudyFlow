import { useState } from 'react';
import { Flame, Clock, BookOpen, Share2, TrendingUp, BarChart2, Zap, Trash2 } from 'lucide-react';
import { Subject, StudyLog } from '../types';
import ShareModal from '../components/ShareModal';

interface DashboardPageProps {
  subjects: Subject[];
  logs: StudyLog[];
  cycleStartDate: number;
  onDeleteLog: (id: string) => void;
}

export default function DashboardPage({ subjects, logs, cycleStartDate, onDeleteLog }: DashboardPageProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  // --- LÓGICA DE OFENSIVA E ESTATÍSTICAS (MANTIDAS IGUAIS) ---
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
    const subjectLogs = logs.filter(log => log.subjectId === subjectId && log.type === 'questoes');
    const totalQuestions = subjectLogs.reduce((sum, log) => sum + (log.correct || 0) + (log.wrong || 0) + (log.blank || 0), 0);
    const totalCorrect = subjectLogs.reduce((sum, log) => sum + (log.correct || 0), 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    return { totalQuestions, accuracy };
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

  return (
    <div className="max-w-lg mx-auto px-6 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Acompanhe seu progresso</p>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="p-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5" />
            <span className="text-xs font-semibold">Ofensiva</span>
          </div>
          <p className="text-3xl font-bold">{streak}</p>
          <p className="text-[11px] opacity-90 mt-1">dias</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-xs font-semibold">Hoje</span>
          </div>
          <p className="text-3xl font-bold">
            {hours > 0 ? `${hours}h` : `${minutes}m`}
          </p>
          <p className="text-[11px] opacity-90 mt-1">
            {hours > 0 && minutes > 0 && `${minutes}m`}
            {hours === 0 && minutes === 0 && 'Comece!'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5" />
            <span className="text-xs font-semibold">Total</span>
          </div>
          <p className="text-3xl font-bold">
            {totalHours > 0 ? `${totalHours}h` : '0h'}
          </p>
          <p className="text-[11px] opacity-90 mt-1">
            {totalHours > 0 && totalMin > 0 && `${totalMin}m`}
            {totalHours === 0 && totalMin === 0 && 'Sem dados'}
          </p>
        </div>
      </div>

      {/* 1. Card: Progresso do Ciclo */}
      {subjects.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 mb-6 transition-colors duration-300">
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

      {/* 2. Card: Desempenho Geral */}
      {subjects.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 mb-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Desempenho Geral</h2>
          </div>

          <div className="space-y-5">
            {subjects.map((subject) => {
              const { totalQuestions, accuracy } = getSubjectPerformance(subject.id);
              return (
                <div key={`perf-${subject.id}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                      {subject.name}
                    </span>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${totalQuestions === 0 ? 'text-gray-400' : getAccuracyTextColor(accuracy)}`}>
                        {totalQuestions > 0 ? `${accuracy}%` : '-'}
                      </span>
                      {totalQuestions > 0 && (
                        <p className="text-[10px] text-gray-400">{totalQuestions} questões</p>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    {totalQuestions > 0 ? (
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${getAccuracyColor(accuracy)}`} 
                        style={{ width: `${accuracy}%` }} 
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-100 dark:bg-gray-700" /> 
                    )}
                  </div>
                </div>
              );
            })}
          </div>
           {subjects.every(s => getSubjectPerformance(s.id).totalQuestions === 0) && (
             <p className="text-xs text-center text-gray-400 mt-4 italic">
               Nenhuma questão registrada. Bora praticar, guerreiro!
             </p>
          )}
        </div>
      )}

      {/* 3. Card: Atividades Recentes */}
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
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {subjects.length === 0 && logs.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 text-center transition-colors duration-300">
          <p className="text-gray-600 dark:text-gray-300 mb-2">Bem-vindo ao StudyFlow!</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Comece adicionando matérias na aba Ciclo e registre seus estudos.
          </p>
        </div>
      )}

      {/* Modal de Compartilhamento */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        todayMinutes={totalMinutes}
        todayPages={totalPages}
        todayQuestions={todayQuestions}
        todayCorrect={totalCorrect}
      />
    </div>
  );
}