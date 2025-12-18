import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Calendar, BarChart3, Flame, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudyLog } from '../types';

interface HeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: StudyLog[];
  dailyGoal: number;
}

type Period = 30 | 90 | 365;
type IntensityLevel = 0 | 1 | 2 | 3 | 4;

interface HeatmapDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0-6 (domingo-sábado)
  logs: StudyLog[];
  totalMinutes: number;
  intensity: IntensityLevel;
  dateObj: Date;
}

const DAYS_OF_WEEK_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Quantos dias tem no mês
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

// Que dia da semana começa o mês (0=Dom, 1=Seg, ..., 6=Sáb)
const getMonthStartDay = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

// Gerar array de meses a exibir baseado no período
const getMonthsToDisplay = (period: 30 | 90 | 365): Array<{year: number, month: number}> => {
  const months: Array<{year: number, month: number}> = [];
  const today = new Date();
  const monthsBack = period === 30 ? 1 : period === 90 ? 3 : 12;
  
  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({ year: date.getFullYear(), month: date.getMonth() });
  }
  
  return months;
};

// Calcular intensidade (0-4) baseado em minutos
const getIntensityLevel = (minutes: number): IntensityLevel => {
  if (minutes === 0) return 0;
  if (minutes < 60) return 1;      // Menos de 1h
  if (minutes < 180) return 2;     // 1h - 3h
  if (minutes < 300) return 3;     // 3h - 5h
  return 4;                        // 5h+
};

// Agrupar logs por data (YYYY-MM-DD)
const groupLogsByDate = (logs: StudyLog[]): Record<string, StudyLog[]> => {
  const grouped: Record<string, StudyLog[]> = {};
  logs.forEach(log => {
    if (!grouped[log.date]) grouped[log.date] = [];
    grouped[log.date].push(log);
  });
  return grouped;
};

// Calcular minutos totais de uma data
const getTotalMinutesForDate = (logs: StudyLog[]): number => {
  return logs.reduce((sum, log) => 
    sum + (log.hours * 60) + log.minutes + Math.floor((log.seconds || 0) / 60), 
  0);
};

// Gerar array de últimos N dias
const generateDaysArray = (days: number): Date[] => {
  const result: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    result.push(date);
  }
  return result;
};

// Calcular estatísticas
const calculateStats = (logs: StudyLog[], days: number) => {
  const groupedByDate = groupLogsByDate(logs);
  const daysArray = generateDaysArray(days);
  
  // Filtrar apenas dias com estudo dentro do período
  const datesWithStudy = daysArray.filter(date => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return groupedByDate[dateStr] && groupedByDate[dateStr].length > 0;
  }).length;
  
  const percentage = Math.round((datesWithStudy / days) * 100);
  
  // Calcular maior sequência e sequência atual
  let maxStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;
  
  // Calcular maior sequência (percorrer do mais antigo para o mais recente)
  for (let i = 0; i < daysArray.length; i++) {
    const dateStr = `${daysArray[i].getFullYear()}-${String(daysArray[i].getMonth() + 1).padStart(2, '0')}-${String(daysArray[i].getDate()).padStart(2, '0')}`;
    const hasStudy = groupedByDate[dateStr] && groupedByDate[dateStr].length > 0;
    
    if (hasStudy) {
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  // Calcular sequência atual (do dia mais recente para trás)
  for (let i = daysArray.length - 1; i >= 0; i--) {
    const dateStr = `${daysArray[i].getFullYear()}-${String(daysArray[i].getMonth() + 1).padStart(2, '0')}-${String(daysArray[i].getDate()).padStart(2, '0')}`;
    const hasStudy = groupedByDate[dateStr] && groupedByDate[dateStr].length > 0;
    
    if (hasStudy) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  return {
    daysStudied: datesWithStudy,
    totalDays: days,
    percentage,
    maxStreak,
    currentStreak
  };
};

export default function HeatmapModal({ isOpen, onClose, logs, dailyGoal }: HeatmapModalProps) {
  const [period, setPeriod] = useState<Period>(90);
  const [tooltipData, setTooltipData] = useState<{ day: HeatmapDay; x: number; y: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Fechar com ESC e travar scroll externo
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      // Travar scroll do body
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      document.addEventListener('keydown', handleEscape);
      closeButtonRef.current?.focus();
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        // Restaurar scroll do body
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, onClose]);

  // Agrupar logs por data para lookup rápido
  const groupedByDate = useMemo(() => groupLogsByDate(logs), [logs]);

  // Obter meses a exibir
  const monthsToDisplay = useMemo(() => getMonthsToDisplay(period), [period]);

  // Gerar dados do heatmap organizados por mês
  const heatmapByMonth = useMemo(() => {
    const result: Record<string, Record<number, HeatmapDay>> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const periodStart = new Date(today);
    periodStart.setDate(periodStart.getDate() - period);
    
    monthsToDisplay.forEach(({ year, month }) => {
      const monthKey = `${year}-${month}`;
      result[monthKey] = {};
      
      const daysInMonth = getDaysInMonth(year, month);
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        
        // Verificar se o dia está dentro do período
        if (date < periodStart || date > today) {
          continue;
        }
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayLogs = groupedByDate[dateStr] || [];
        const totalMinutes = getTotalMinutesForDate(dayLogs);
        const intensity = getIntensityLevel(totalMinutes);
        
        result[monthKey][day] = {
          date: dateStr,
          dayOfWeek: date.getDay(),
          logs: dayLogs,
          totalMinutes,
          intensity,
          dateObj: date
        };
      }
    });
    
    return result;
  }, [monthsToDisplay, groupedByDate, period]);

  // Estatísticas
  const stats = useMemo(() => {
    return calculateStats(logs, period);
  }, [logs, period]);

  // Cores por intensidade
  const getIntensityColor = (intensity: IntensityLevel): string => {
    const colors = {
      0: 'bg-gray-200 dark:bg-gray-700',
      1: 'bg-emerald-200 dark:bg-emerald-900',
      2: 'bg-emerald-400 dark:bg-emerald-700',
      3: 'bg-emerald-600 dark:bg-emerald-500',
      4: 'bg-emerald-800 dark:bg-emerald-400',
    };
    return colors[intensity];
  };

  // Formatar data para tooltip
  const formatDateForTooltip = (day: HeatmapDay): string => {
    const date = day.dateObj;
    const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    return `${weekdays[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  // Calcular porcentagem da meta
  const getGoalPercentage = (totalMinutes: number): number => {
    if (dailyGoal === 0) return 0;
    return Math.round((totalMinutes / dailyGoal) * 100);
  };

  // Handler para hover no quadrado
  const handleSquareHover = (day: HeatmapDay, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const modalRect = event.currentTarget.closest('[role="dialog"]')?.getBoundingClientRect();
    
    if (modalRect) {
      setTooltipData({
        day,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
  };

  const handleSquareLeave = () => {
    setTooltipData(null);
  };


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-hidden">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col my-8"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="heatmap-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div>
              <h2 id="heatmap-title" className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar size={24} className="text-emerald-500" />
                Mapa de Calor - Seus Estudos
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Visualize sua constância ao longo do tempo
              </p>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Toggle de Período */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3 flex-shrink-0">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Período:</span>
            {([30, 90, 365] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {p === 30 ? '30 dias' : p === 90 ? '90 dias' : '1 ano'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Calendar size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  Comece a estudar para preencher seu mapa de calor!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Registre seus estudos e acompanhe sua evolução.
                </p>
              </div>
            ) : (
              <>
                {/* Heatmap - Grid de Meses */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={period}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    layout
                    transition={{ 
                      layout: {
                        duration: 0.3,
                        ease: [0.4, 0, 0.2, 1]
                      },
                      opacity: { duration: 0.25 },
                      y: { duration: 0.25 }
                    }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                  >
                    {monthsToDisplay.map(({ year, month }, monthIndex) => {
                    const monthKey = `${year}-${month}`;
                    const monthData = heatmapByMonth[monthKey] || {};
                    const daysInMonth = getDaysInMonth(year, month);
                    const startDay = getMonthStartDay(year, month);
                    const monthName = MONTHS_FULL[month];
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    // Criar array de dias do mês
                    const daysArray: (HeatmapDay | null)[] = [];
                    
                    // Preencher dias vazios antes do mês começar
                    for (let i = 0; i < startDay; i++) {
                      daysArray.push(null);
                    }
                    
                    // Adicionar dias do mês
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day);
                      date.setHours(0, 0, 0, 0);
                      
                      // Se o dia está no futuro, não renderizar
                      if (date > today) {
                        daysArray.push(null);
                      } else {
                        daysArray.push(monthData[day] || null);
                      }
                    }
                    
                    return (
                      <motion.div
                        key={monthKey}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: monthIndex * 0.05 }}
                        className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4"
                      >
                        {/* Nome do Mês */}
                        <h3 className="text-center text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          {monthName}
                        </h3>
                        
                        {/* Labels dos Dias da Semana */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {DAYS_OF_WEEK_SHORT.map((day, index) => (
                            <span
                              key={index}
                              className="text-[10px] text-center text-gray-500 dark:text-gray-400 font-medium"
                            >
                              {day}
                            </span>
                          ))}
                        </div>
                        
                        {/* Grid de Dias */}
                        <div className="grid grid-cols-7 gap-0.5 md:gap-1">
                          {daysArray.map((day, index) => {
                            if (!day) {
                              return (
                                <div
                                  key={`empty-${index}`}
                                  className="w-5 h-5 md:w-8 md:h-8"
                                />
                              );
                            }

                            const intensity = day.intensity;
                            const color = getIntensityColor(intensity);
                            const hours = Math.floor(day.totalMinutes / 60);
                            const minutes = day.totalMinutes % 60;

                            return (
                              <motion.div
                                key={day.date}
                                role="button"
                                tabIndex={0}
                                aria-label={`${formatDateForTooltip(day)}, ${hours}h ${minutes}min estudadas`}
                                className={`w-5 h-5 md:w-8 md:h-8 rounded-full cursor-pointer transition-all ${color} ${
                                  intensity > 0 ? 'hover:ring-2 hover:ring-emerald-400 dark:hover:ring-emerald-500 hover:ring-offset-1' : ''
                                }`}
                                onMouseEnter={(e) => handleSquareHover(day, e)}
                                onMouseLeave={handleSquareLeave}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.2 }}
                                transition={{ duration: 0.15, delay: index * 0.01 }}
                              />
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                  </motion.div>
                </AnimatePresence>

                {/* Tooltip */}
                {tooltipData && (
                  <motion.div
                    ref={tooltipRef}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bg-gray-900 text-white text-xs p-3 rounded-lg shadow-xl z-[80] pointer-events-none"
                    style={{
                      left: `${tooltipData.x}px`,
                      top: `${tooltipData.y}px`,
                      transform: 'translateX(-50%) translateY(-100%)',
                    }}
                  >
                    <div className="font-semibold mb-1">
                      {formatDateForTooltip(tooltipData.day)}
                    </div>
                    <div className="space-y-1">
                      <div>
                        {Math.floor(tooltipData.day.totalMinutes / 60)}h {tooltipData.day.totalMinutes % 60}min estudadas
                      </div>
                      <div>
                        {tooltipData.day.logs.length} {tooltipData.day.logs.length === 1 ? 'sessão' : 'sessões'} registrada{tooltipData.day.logs.length === 1 ? '' : 's'}
                      </div>
                      {dailyGoal > 0 && (
                        <div>
                          {getGoalPercentage(tooltipData.day.totalMinutes)}% da meta diária
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Legenda */}
                <div className="flex items-center justify-center gap-3 mt-8 mb-6">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Menos</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((intensity) => (
                      <div
                        key={intensity}
                        className={`w-5 h-5 md:w-8 md:h-8 rounded-full ${getIntensityColor(intensity as IntensityLevel)}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Mais</span>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 size={18} className="text-emerald-500" />
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Dias Estudados</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.daysStudied}/{stats.totalDays}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stats.percentage}% de constância
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame size={18} className="text-orange-500" />
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Maior Sequência</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.maxStreak} {stats.maxStreak === 1 ? 'dia' : 'dias'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Seu recorde de dias seguidos
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={18} className="text-yellow-500" />
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Sequência Atual</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.currentStreak} {stats.currentStreak === 1 ? 'dia' : 'dias'}
                    </p>
                    {stats.currentStreak > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                        <Flame size={12} className="text-orange-500" />
                        Mantenha o foco!
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
