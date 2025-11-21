import { useState } from 'react';
import { Flame, Clock, BookOpen, Share2, TrendingUp, BarChart2 } from 'lucide-react';
import { Subject, StudyLog } from '../types';
import ShareModal from '../components/ShareModal';

interface DashboardPageProps {
  subjects: Subject[];
  logs: StudyLog[];
  cycleStartDate: number;
}

export default function DashboardPage({ subjects, logs, cycleStartDate }: DashboardPageProps) {
  const [showShareModal, setShowShareModal] = useState(false);

 // --- NOVA LÓGICA DE OFENSIVA (Fuso Horário BR) ---
  const calculateStreak = () => {
    if (logs.length === 0) return 0;

    // 1. Converte todos os logs para datas simples (DD/MM/AAAA) no fuso do usuário
    const studyDates = new Set(
      logs.map(log => new Date(log.timestamp).toLocaleDateString('pt-BR'))
    );

    const today = new Date();
    const todayStr = today.toLocaleDateString('pt-BR');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('pt-BR');

    let streak = 0;
    let currentCheckDate = new Date(); // Começa conferindo de hoje pra trás

    // Verificação inicial: A ofensiva está viva?
    // Se não estudei hoje E não estudei ontem, a ofensiva é zero.
    if (!studyDates.has(todayStr) && !studyDates.has(yesterdayStr)) {
      return 0;
    }

    // Loop para contar os dias para trás (até 365 dias)
    for (let i = 0; i < 365; i++) {
      const dateString = currentCheckDate.toLocaleDateString('pt-BR');
      
      if (studyDates.has(dateString)) {
        streak++;
      } else {
        // Se falhou hoje, mas tem ontem, não quebra ainda (o dia não acabou)
        if (i === 0 && !studyDates.has(todayStr)) {
           // Pula essa iteração e continua checando, pois pode ter estudado ontem
           // Mas não soma streak neste loop, pois o streak++ tá no if de cima
           currentCheckDate.setDate(currentCheckDate.getDate() - 1);
           continue;
        }
        // Se chegou aqui, é porque falhou num dia passado. Game over.
        break;
      }
      // Volta um dia no tempo
      currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    }

    return streak;
  };

  // --- ESTATÍSTICAS DE HOJE (Mantido) ---
  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter((log) => log.date === today);

    const totalMinutes = todayLogs.reduce(
      (sum, log) => sum + log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60),
      0
    );

    const totalPages = todayLogs
      .filter(log => log.type === 'teoria')
      .reduce((sum, log) => sum + (log.pages || 0), 0);

    const totalQuestions = todayLogs
      .filter((log) => log.type === 'questoes')
      .reduce((sum, log) => sum + (log.correct || 0) + (log.wrong || 0) + (log.blank || 0), 0);

    const totalCorrect = todayLogs
      .filter((log) => log.type === 'questoes')
      .reduce((sum, log) => sum + (log.correct || 0), 0);

    return {
      totalMinutes,
      totalPages,
      todayQuestions: totalQuestions,
      totalCorrect,
    };
  };

  // --- PROGRESSO DO CICLO (Mantido) ---
  const getSubjectProgress = (subjectId: string, goalMinutes: number) => {
    const totalMinutes = logs
      .filter((log) => log.subjectId === subjectId && log.timestamp >= cycleStartDate)
      .reduce((sum, log) => sum + log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60), 0);

    const percentage = Math.min((totalMinutes / goalMinutes) * 100, 100);
    return { totalMinutes, percentage };
  };

  // --- NOVO: CÁLCULO DE DESEMPENHO (ACERTOS) ---
  const getSubjectPerformance = (subjectId: string) => {
    // Pega todas as questões dessa matéria (Histórico total ou do ciclo? 
    // Geralmente desempenho é bom ver o histórico total, vou deixar total)
    const subjectLogs = logs.filter(log => log.subjectId === subjectId && log.type === 'questoes');
    
    const totalQuestions = subjectLogs.reduce((sum, log) => sum + (log.correct || 0) + (log.wrong || 0) + (log.blank || 0), 0);
    const totalCorrect = subjectLogs.reduce((sum, log) => sum + (log.correct || 0), 0);
    
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    
    return { totalQuestions, accuracy };
  };

  // --- ATIVIDADES RECENTES (Mantido) ---
  const getRecentActivities = () => {
    return [...logs]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  };

  // Variáveis calculadas
  const streak = calculateStreak();
  const { totalMinutes, totalPages, todayQuestions, totalCorrect } = getTodayStats();
  const recentActivities = getRecentActivities();
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Helpers visuais
  const getTypeLabel = (type: string) => {
    const labels = {
      teoria: 'Teoria',
      questoes: 'Questões',
      revisao: 'Revisão',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAccuracyColor = (acc: number) => {
    if (acc >= 80) return 'bg-emerald-500'; // Excelente
    if (acc >= 50) return 'bg-yellow-500';  // Atenção
    return 'bg-red-500';                    // Crítico
  };

  const getAccuracyTextColor = (acc: number) => {
    if (acc >= 80) return 'text-emerald-600';
    if (acc >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Painel</h1>
          <p className="text-gray-600 text-sm">Acompanhe seu progresso</p>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="p-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* Cards de Resumo (Ofensiva e Hoje) */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-semibold">Ofensiva</span>
          </div>
          <p className="text-4xl font-bold">{streak}</p>
          <p className="text-xs opacity-90 mt-1">dias seguidos</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-semibold">Hoje</span>
          </div>
          <p className="text-4xl font-bold">
            {hours > 0 ? `${hours}h` : `${minutes}m`}
          </p>
          <p className="text-xs opacity-90 mt-1">
            {hours > 0 && minutes > 0 && `${minutes} min`}
            {hours === 0 && minutes === 0 && 'Comece agora!'}
          </p>
        </div>
      </div>

      {/* 1. Card: Progresso do Ciclo (Horas) */}
      {subjects.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-800">Progresso do Ciclo Atual</h2>
          </div>

          <div className="space-y-4">
            {subjects.map((subject) => {
              const { totalMinutes, percentage } = getSubjectProgress(
                subject.id,
                subject.goalMinutes
              );

              return (
                <div key={subject.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="text-sm font-semibold text-gray-800">
                        {subject.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">
                      {totalMinutes}/{subject.goalMinutes} min
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. NOVO CARD: Desempenho Geral (Acertos) */}
      {subjects.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-5 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-800">Desempenho Geral</h2>
          </div>

          <div className="space-y-5">
            {subjects.map((subject) => {
              const { totalQuestions, accuracy } = getSubjectPerformance(subject.id);

              return (
                <div key={`perf-${subject.id}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700 truncate max-w-[60%]">
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
                  
                  {/* Barra de Precisão */}
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    {totalQuestions > 0 ? (
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${getAccuracyColor(accuracy)}`} 
                        style={{ width: `${accuracy}%` }} 
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-100" /> // Barra vazia
                    )}
                  </div>
                </div>
              );
            })}
          </div>
           {/* Mensagem se não tiver nenhuma questão ainda */}
           {subjects.every(s => getSubjectPerformance(s.id).totalQuestions === 0) && (
             <p className="text-xs text-center text-gray-400 mt-4 italic">
               Nenhuma questão registrada. Bora praticar, guerreiro!
             </p>
          )}
        </div>
      )}

      {/* 3. Card: Atividades Recentes */}
      {recentActivities.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-800">Atividades Recentes</h2>
          </div>

          <div className="space-y-3">
            {recentActivities.map((log) => {
              const subject = subjects.find((s) => s.id === log.subjectId);
              const logMinutes = log.hours * 60 + log.minutes;

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50"
                >
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: subject?.color || '#6b7280' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {subject?.name || 'Matéria Excluída'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {getTypeLabel(log.type)} • {logMinutes} min
                    </p>
                    {log.notes && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {log.notes}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {subjects.length === 0 && logs.length === 0 && (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center">
          <p className="text-gray-600 mb-2">Bem-vindo ao StudyFlow!</p>
          <p className="text-sm text-gray-500">
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