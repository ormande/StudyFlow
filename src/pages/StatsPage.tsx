import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Clock,
  HelpCircle,
  Target,
  Flame,
  TrendingUp,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Subject, StudyLog } from "../types";
import Button from "../components/Button";
import FloatingBackButton from "../components/FloatingBackButton";
import CustomDateRangeModal from "../components/CustomDateRangeModal";
import { getLocalDateString } from "../utils/dateUtils";

// Função helper para formatar horas em "Xh Ymin" ou apenas "Ymin"
const formatHoursToTime = (hours: number | undefined | null | string): string => {
  // Converter para número e validar entrada
  const numHours = typeof hours === 'string' ? parseFloat(hours) : hours;
  
  if (numHours === undefined || numHours === null || isNaN(numHours) || numHours < 0) {
    return "0min";
  }
  
  if (numHours === 0) return "0min";
  
  const totalMinutes = Math.round(numHours * 60);
  const h = Math.floor(totalMinutes / 60);
  const min = totalMinutes % 60;
  
  if (h === 0) {
    return `${min}min`;
  }
  if (min === 0) {
    return `${h}h`;
  }
  return `${h}h ${min}min`;
};

// Componente CustomTooltip para gráficos Recharts
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg"
      style={{
        fontFamily: "Poppins, system-ui, sans-serif",
      }}
    >
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
        {label}
      </p>
      {payload.map((entry: any, index: number) => {
        // Se o valor já foi formatado (string), usar diretamente
        // Caso contrário, formatar se necessário
        let displayValue = entry.value;
        
        // Se o valor já é uma string formatada (contém "min" ou "h"), usar diretamente
        if (typeof displayValue === 'string' && (displayValue.includes('min') || displayValue.includes('h'))) {
          // Já está formatado, usar como está
        } else if (formatter && typeof formatter === 'function') {
          displayValue = formatter(entry.value, entry.name, entry);
        } else if (entry.name === "Horas" || entry.name === "Tempo") {
          // Formatar horas para "Xh Ymin"
          const hoursValue = typeof entry.value === 'number' ? entry.value : parseFloat(entry.value) || 0;
          displayValue = formatHoursToTime(hoursValue);
        } else if (entry.dataKey === "hours") {
          // Para gráficos de distribuição por horário
          const hoursValue = typeof entry.value === 'number' ? entry.value : parseFloat(entry.value) || 0;
          displayValue = formatHoursToTime(hoursValue);
        }
        
        return (
          <p
            key={index}
            className="text-sm font-medium"
            style={{ color: entry.color }}
          >
            {entry.name}: {displayValue}
          </p>
        );
      })}
    </div>
  );
};

interface StatsPageProps {
  logs: StudyLog[];
  subjects: Subject[];
  cycleStartDate: number;
  streak: number;
  accuracyGoal?: number; // Meta de taxa de acerto (padrão: 70)
  onNavigateBack: () => void;
}

type TimeRangeOption =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "allTime"
  | "custom";

export default function StatsPage({
  logs,
  subjects,
  cycleStartDate: _cycleStartDate,
  streak,
  accuracyGoal = 70, // Valor padrão caso não seja passado
  onNavigateBack,
}: StatsPageProps) {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>("last30days");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Detectar dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Observar mudanças na classe do HTML
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Função helper para calcular ranges de data
  const calculateDateRange = useCallback((range: TimeRangeOption): { startDate: Date; endDate: Date } => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);

      switch (range) {
        case "today":
          return { startDate: startOfToday, endDate: today };
        case "yesterday":
          const yesterday = new Date(startOfToday);
          yesterday.setDate(yesterday.getDate() - 1);
          const endOfYesterday = new Date(startOfToday);
          endOfYesterday.setMilliseconds(-1);
          return { startDate: yesterday, endDate: endOfYesterday };
        case "last7days":
          const last7 = new Date(startOfToday);
          last7.setDate(last7.getDate() - 7);
          return { startDate: last7, endDate: today };
        case "last30days":
          const last30 = new Date(startOfToday);
          last30.setDate(last30.getDate() - 30);
          return { startDate: last30, endDate: today };
        case "thisMonth":
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          return { startDate: startOfMonth, endDate: today };
        case "lastMonth":
          const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
          return { startDate: lastMonthStart, endDate: lastMonthEnd };
        case "thisYear":
          const startOfYear = new Date(today.getFullYear(), 0, 1);
          return { startDate: startOfYear, endDate: today };
        case "allTime":
          return { startDate: new Date(0), endDate: today };
        case "custom":
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            return { startDate: start, endDate: end };
          }
          return { startDate: startOfToday, endDate: today };
        default:
          return { startDate: startOfToday, endDate: today };
      }
  }, [customStartDate, customEndDate]);

  // Inicializar datas quando o componente montar ou timeRange mudar
  useEffect(() => {
    if (timeRange !== "custom") {
      const { startDate, endDate } = calculateDateRange(timeRange);
      setCustomStartDate(getLocalDateString(startDate));
      setCustomEndDate(getLocalDateString(endDate));
    }
  }, [timeRange, calculateDateRange]);

  // Handler para mudança de período
  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TimeRangeOption;

    if (value === "custom") {
      setShowCustomDateModal(true);
    } else {
      setTimeRange(value);
    }
  };

  // Handler para aplicar data personalizada
  const handleApplyCustomDate = (startDate: string, endDate: string) => {
    setTimeRange("custom");
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  // Filtrar logs baseado nos filtros
  const filteredLogs = useMemo(() => {
    const { startDate, endDate } = calculateDateRange(timeRange);

    const filtered = logs
      .filter((log) => {
        // Filtro de matéria
        if (selectedSubjectId !== "all" && log.subjectId !== selectedSubjectId) {
          return false;
        }

        // Filtro de tempo - usar log.date (YYYY-MM-DD) para comparação
        const logDate = log.date ? new Date(log.date + "T00:00:00") : null;
        if (!logDate) return false;

        // Verificar se está dentro do range
        if (logDate < startDate || logDate > endDate) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const ta = a.timestamp
          ? new Date(a.timestamp).getTime()
          : new Date(a.date).getTime();
        const tb = b.timestamp
          ? new Date(b.timestamp).getTime()
          : new Date(b.date).getTime();
        return ta - tb;
      });

    return filtered;
  }, [logs, timeRange, selectedSubjectId, customStartDate, customEndDate]);

  // Dados de evolução temporal (horas e questões por dia)
  const evolutionData = useMemo(() => {
    const daysMap = new Map<string, { hours: number; questions: number }>();

    filteredLogs.forEach((log) => {
      const dateKey = new Date(log.date || log.timestamp).toLocaleDateString(
        "pt-BR",
        { day: "2-digit", month: "2-digit" }
      );
      const existing = daysMap.get(dateKey) || { hours: 0, questions: 0 };
      const logMinutes =
        (log.hours || 0) * 60 +
        (log.minutes || 0) +
        Math.floor((log.seconds || 0) / 60);
      existing.hours += logMinutes / 60;
      existing.questions +=
        (log.correct || 0) + (log.wrong || 0) + (log.blank || 0);
      daysMap.set(dateKey, existing);
    });

    return Array.from(daysMap.entries())
      .map(([date, data]) => ({
        date,
        hours: Number(data.hours.toFixed(2)),
        questions: data.questions,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-"));
        const dateB = new Date(b.date.split("/").reverse().join("-"));
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-30);
  }, [filteredLogs]);

  // Resumo (summary) usado nos cards
  const summaryData = useMemo(() => {
    let totalMinutes = 0;
    let totalQuestions = 0;
    let correct = 0;
    const daysSet = new Set<string>();

    filteredLogs.forEach((log) => {
      const logMinutes =
        (log.hours || 0) * 60 +
        (log.minutes || 0) +
        Math.floor((log.seconds || 0) / 60);
      totalMinutes += logMinutes;
      const q = (log.correct || 0) + (log.wrong || 0) + (log.blank || 0);
      totalQuestions += q;
      correct += log.correct || 0;
      const dateKey = new Date(log.date || log.timestamp).toLocaleDateString(
        "pt-BR",
        { day: "2-digit", month: "2-digit" }
      );
      daysSet.add(dateKey);
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const totalRemainingMinutes = totalMinutes % 60;
    const accuracy =
      totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    return {
      totalHours,
      totalMinutes: totalRemainingMinutes,
      totalQuestions,
      accuracy,
      daysStudied: daysSet.size,
    };
  }, [filteredLogs]);

  // Dados para gráfico de tempo por disciplina
  const subjectTimeData = useMemo(() => {
    const subjectMap = new Map<string, number>();

    filteredLogs.forEach((log) => {
      const subject = subjects.find((s) => s.id === log.subjectId);
      const subjectName = subject?.name || "Sem matéria";
      const logMinutes =
        log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60);
      const logHours = logMinutes / 60;

      const existing = subjectMap.get(subjectName) || 0;
      subjectMap.set(subjectName, existing + logHours);
    });

    return Array.from(subjectMap.entries())
      .map(([subject, hours]) => ({ subject, hours: Number(hours.toFixed(2)) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);
  }, [filteredLogs, subjects]);

  // Dados para gráfico de desempenho (pizza)
  const performanceData = useMemo(() => {
    const questionLogs = filteredLogs.filter(
      (log) => (log.correct || 0) + (log.wrong || 0) + (log.blank || 0) > 0
    );

    const totalCorrect = questionLogs.reduce(
      (sum, log) => sum + (log.correct || 0),
      0
    );
    const totalWrong = questionLogs.reduce(
      (sum, log) => sum + (log.wrong || 0),
      0
    );
    const totalBlank = questionLogs.reduce(
      (sum, log) => sum + (log.blank || 0),
      0
    );

    return [
      { name: "Corretas", value: totalCorrect, color: "#10b981" },
      { name: "Erradas", value: totalWrong, color: "#ef4444" },
      { name: "Em Branco", value: totalBlank, color: "#3b82f6" },
    ].filter((item) => item.value > 0);
  }, [filteredLogs]);

  // Dados para tabela de desempenho por matéria
  const subjectPerformanceData = useMemo(() => {
    const subjectMap = new Map<
      string,
      { total: number; correct: number; wrong: number; blank: number }
    >();

    filteredLogs.forEach((log) => {
      const subject = subjects.find((s) => s.id === log.subjectId);
      const subjectName = subject?.name || "Sem matéria";

      const total = (log.correct || 0) + (log.wrong || 0) + (log.blank || 0);
      if (total === 0) return;

      const existing = subjectMap.get(subjectName) || {
        total: 0,
        correct: 0,
        wrong: 0,
        blank: 0,
      };
      existing.total += total;
      existing.correct += log.correct || 0;
      existing.wrong += log.wrong || 0;
      existing.blank += log.blank || 0;

      subjectMap.set(subjectName, existing);
    });

    return Array.from(subjectMap.entries())
      .map(([subject, data]) => {
        const accuracy =
          data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        return {
          subject,
          total: data.total,
          correct: data.correct,
          wrong: data.wrong,
          blank: data.blank,
          accuracy,
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [filteredLogs, subjects]);

  // Dados para evolução da taxa de acerto
  const accuracyEvolutionData = useMemo(() => {
    const daysMap = new Map<string, { correct: number; total: number }>();

    filteredLogs.forEach((log) => {
      const total = (log.correct || 0) + (log.wrong || 0) + (log.blank || 0);
      if (total === 0) return;

      const dateKey = new Date(log.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      const existing = daysMap.get(dateKey) || { correct: 0, total: 0 };

      existing.correct += log.correct || 0;
      existing.total += total;

      daysMap.set(dateKey, existing);
    });

    return Array.from(daysMap.entries())
      .map(([date, data]) => ({
        date,
        accuracy:
          data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-"));
        const dateB = new Date(b.date.split("/").reverse().join("-"));
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-30);
  }, [filteredLogs]);

  // Dados para distribuição por horário
  const timeDistributionData = useMemo(() => {
    const periods = {
      madrugada: { hours: 0, label: "Madrugada", color: "#6366f1" },
      manha: { hours: 0, label: "Manhã", color: "#f59e0b" },
      tarde: { hours: 0, label: "Tarde", color: "#10b981" },
      noite: { hours: 0, label: "Noite", color: "#8b5cf6" },
    };

    filteredLogs.forEach((log) => {
      const logDate = new Date(log.timestamp);
      const hour = logDate.getHours();
      const logMinutes =
        log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60);
      const logHours = logMinutes / 60;

      if (hour >= 0 && hour < 6) {
        periods.madrugada.hours += logHours;
      } else if (hour >= 6 && hour < 12) {
        periods.manha.hours += logHours;
      } else if (hour >= 12 && hour < 18) {
        periods.tarde.hours += logHours;
      } else {
        periods.noite.hours += logHours;
      }
    });

    return Object.values(periods).map((period) => ({
      period: period.label,
      hours: Number(period.hours.toFixed(2)),
      color: period.color,
    }));
  }, [filteredLogs]);

  // Função para obter cor da taxa de acerto (baseada na meta configurável)
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= accuracyGoal) return "text-emerald-600 dark:text-emerald-400";
    // Se a meta é alta (>=80), ajusta os limites
    const warningThreshold = accuracyGoal >= 80 ? accuracyGoal - 15 : accuracyGoal - 10;
    if (accuracy >= warningThreshold) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  // Cores para os gráficos baseadas no tema
  const chartTextColor = isDarkMode ? "#e5e7eb" : "#4b5563";
  const chartGridColor = isDarkMode ? "#374151" : "#e5e7eb";

  // Estado vazio
  const hasAnyLogs = logs.length > 0;
  const hasFilteredLogs = filteredLogs.length > 0;

  if (!hasFilteredLogs) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        {onNavigateBack && <FloatingBackButton onClick={onNavigateBack} />}

        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Estatísticas
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Gráficos e análises detalhadas
          </p>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <BarChart3
            size={64}
            className="text-gray-400 dark:text-gray-500 mb-4"
          />
          {hasAnyLogs ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Nenhum dado encontrado
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                Os filtros aplicados não retornaram nenhum resultado. Tente:
              </p>
              <div className="space-y-2 mb-6 text-left max-w-md">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Alterar o período para "Todos os tempos"
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Selecionar "Todas as matérias"
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Verificar se há registros no período selecionado
                </p>
              </div>
              <Button
                onClick={() => {
                  setTimeRange("allTime");
                  setSelectedSubjectId("all");
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
                variant="primary"
                size="md"
              >
                Limpar Filtros
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Nenhuma estatística ainda
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Comece registrando seus estudos para ver gráficos e análises
                aqui!
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const timeRangeOptions = [
    { value: "today", label: "Hoje" },
    { value: "yesterday", label: "Ontem" },
    { value: "last7days", label: "Últimos 7 dias" },
    { value: "last30days", label: "Últimos 30 dias" },
    { value: "thisMonth", label: "Este mês" },
    { value: "lastMonth", label: "Mês passado" },
    { value: "thisYear", label: "Este ano" },
    { value: "allTime", label: "Todos os tempos" },
    { value: "custom", label: "Personalizado..." },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {onNavigateBack && <FloatingBackButton onClick={onNavigateBack} />}

      {/* Header */}
      <div className="mb-6">
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Estatísticas
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Gráficos e análises detalhadas
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          {/* Filtro de Tempo */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Período
            </label>
            <select
              value={timeRange}
              onChange={handleTimeRangeChange}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-900 dark:text-white transition-colors text-sm"
            >
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Matéria */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Matéria
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-900 dark:text-white transition-colors text-sm"
            >
              <option value="all">Todas as matérias</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal de Data Personalizada */}
        <CustomDateRangeModal
          isOpen={showCustomDateModal}
          onClose={() => setShowCustomDateModal(false)}
          onApply={handleApplyCustomDate}
          initialStartDate={customStartDate}
          initialEndDate={customEndDate}
        />
      </div>

      {/* SEÇÃO A: RESUMO GERAL (Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-emerald-500" />
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
              Total de Horas
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {summaryData.totalHours}h {summaryData.totalMinutes}min
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Estudadas no período
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle size={20} className="text-blue-500" />
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
              Questões
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {summaryData.totalQuestions.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            No período
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target size={20} className="text-amber-500" />
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
              Taxa Acerto
            </span>
          </div>
          <p
            className={`text-xl sm:text-2xl font-black ${getAccuracyColor(
              summaryData.accuracy
            )}`}
          >
            {summaryData.accuracy}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Média geral
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={20} className="text-orange-500" />
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
              Dias
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {summaryData.daysStudied}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Streak: {streak} dias
          </p>
        </div>
      </div>

      {/* SEÇÃO B: EVOLUÇÃO TEMPORAL */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-emerald-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Evolução nos Últimos 30 Dias
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <LineChart data={evolutionData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
            <XAxis
              dataKey="date"
              stroke={chartTextColor}
              tick={{
                fill: chartTextColor,
                fontSize: 11,
                fontFamily: "Poppins, system-ui, sans-serif",
                fontWeight: 500,
              }}
            />
            <YAxis
              yAxisId="left"
              stroke={isDarkMode ? "#34d399" : "#10b981"}
              tick={{
                fill: isDarkMode ? "#34d399" : "#10b981",
                fontSize: 11,
                fontFamily: "Poppins, system-ui, sans-serif",
                fontWeight: 500,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke={isDarkMode ? "#60a5fa" : "#3b82f6"}
              tick={{
                fill: isDarkMode ? "#60a5fa" : "#3b82f6",
                fontSize: 11,
                fontFamily: "Poppins, system-ui, sans-serif",
                fontWeight: 500,
              }}
            />
            <Tooltip 
              content={(props: any) => {
                // Customizar o tooltip para formatar horas
                if (props.active && props.payload) {
                  const formattedPayload = props.payload.map((entry: any) => {
                    if (entry.dataKey === "hours") {
                      const hoursValue = typeof entry.value === 'number' ? entry.value : parseFloat(entry.value) || 0;
                      return {
                        ...entry,
                        value: formatHoursToTime(hoursValue),
                        name: "Tempo"
                      };
                    }
                    return entry;
                  });
                  return <CustomTooltip {...props} payload={formattedPayload} />;
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{
                fontFamily: "Poppins, system-ui, sans-serif",
                fontSize: "13px",
                fontWeight: 500,
                color: chartTextColor,
              }}
              iconType="line"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="hours"
              stroke="#10b981"
              strokeWidth={2}
              name="Tempo"
              dot={{ fill: "#10b981", r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="questions"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Questões"
              dot={{ fill: "#3b82f6", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SEÇÃO C: TEMPO POR DISCIPLINA */}
      {subjectTimeData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Tempo por Disciplina
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
            <BarChart data={subjectTimeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis
                type="number"
                stroke={chartTextColor}
                tick={{
                  fill: chartTextColor,
                  fontSize: 11,
                  fontFamily: "Poppins, system-ui, sans-serif",
                  fontWeight: 500,
                }}
              />
              <YAxis
                dataKey="subject"
                type="category"
                width={120}
                stroke={chartTextColor}
                tick={{
                  fill: chartTextColor,
                  fontSize: 11,
                  fontFamily: "Poppins, system-ui, sans-serif",
                  fontWeight: 500,
                }}
              />
              <Tooltip
                content={(props: any) => {
                  // Customizar o tooltip para formatar horas
                  if (props.active && props.payload) {
                    const formattedPayload = props.payload.map((entry: any) => {
                      if (entry.dataKey === "hours") {
                        const hoursValue = typeof entry.value === 'number' ? entry.value : parseFloat(entry.value) || 0;
                        return {
                          ...entry,
                          value: formatHoursToTime(hoursValue),
                          name: "Tempo"
                        };
                      }
                      return entry;
                    });
                    return <CustomTooltip {...props} payload={formattedPayload} />;
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="hours"
                fill="#10b981"
                radius={[0, 8, 8, 0]}
                name="Horas"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* SEÇÃO D: DESEMPENHO EM QUESTÕES */}
      {performanceData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={20} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Desempenho em Questões
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <RechartsPieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                    }
                    outerRadius={isMobile ? 80 : 100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value !== undefined ? value.toLocaleString("pt-BR") : ""
                    }
                    content={<CustomTooltip />}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {subjectPerformanceData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                        Matéria
                      </th>
                      <th className="text-center p-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                        Total
                      </th>
                      <th className="text-center p-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                        Acerto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectPerformanceData.map((item) => (
                      <tr
                        key={item.subject}
                        className="border-b border-gray-200 dark:border-gray-700"
                      >
                        <td className="p-2 text-sm text-gray-900 dark:text-gray-200">
                          {item.subject}
                        </td>
                        <td className="text-center p-2 text-sm text-gray-600 dark:text-gray-400">
                          {item.total}
                        </td>
                        <td
                          className={`text-center p-2 text-sm font-bold ${getAccuracyColor(
                            item.accuracy
                          )}`}
                        >
                          {item.accuracy}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEÇÃO E.1: EVOLUÇÃO DA TAXA DE ACERTO */}
      {accuracyEvolutionData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Evolução da Taxa de Acerto
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <LineChart data={accuracyEvolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis
                dataKey="date"
                stroke={chartTextColor}
                tick={{
                  fill: chartTextColor,
                  fontSize: 11,
                  fontFamily: "Poppins, system-ui, sans-serif",
                  fontWeight: 500,
                }}
              />
              <YAxis
                domain={[0, 100]}
                stroke={chartTextColor}
                tick={{
                  fill: chartTextColor,
                  fontSize: 11,
                  fontFamily: "Poppins, system-ui, sans-serif",
                  fontWeight: 500,
                }}
              />
              <Tooltip
                content={(props: any) => {
                  // Customizar o tooltip para taxa de acerto
                  if (props.active && props.payload) {
                    const formattedPayload = props.payload.map((entry: any) => {
                      if (entry.dataKey === "accuracy") {
                        return {
                          ...entry,
                          value: `${entry.value}%`,
                          name: "Taxa de acerto"
                        };
                      } else if (typeof entry.dataKey === 'function') {
                        // Linha da meta
                        return {
                          ...entry,
                          value: `${accuracyGoal}%`,
                          name: "Meta"
                        };
                      }
                      return entry;
                    });
                    return <CustomTooltip {...props} payload={formattedPayload} />;
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{
                  fontFamily: "Poppins, system-ui, sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: chartTextColor,
                }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#10b981"
                strokeWidth={2}
                name={`Taxa de acerto: ${accuracyEvolutionData.length > 0 ? accuracyEvolutionData[accuracyEvolutionData.length - 1]?.accuracy || 0 : 0}%`}
                dot={{ fill: "#10b981", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey={() => accuracyGoal}
                stroke="#6b7280"
                strokeWidth={1}
                strokeDasharray="5 5"
                name={`Meta: ${accuracyGoal}%`}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* SEÇÃO E.2: DISTRIBUIÇÃO POR HORÁRIO */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-emerald-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Distribuição por Horário
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <BarChart data={timeDistributionData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
            <XAxis
              dataKey="period"
              stroke={chartTextColor}
              tick={{
                fill: chartTextColor,
                fontSize: 11,
                fontFamily: "Poppins, system-ui, sans-serif",
                fontWeight: 500,
              }}
            />
            <YAxis
              stroke={chartTextColor}
              tick={{
                fill: chartTextColor,
                fontSize: 11,
                fontFamily: "Poppins, system-ui, sans-serif",
                fontWeight: 500,
              }}
            />
            <Tooltip
              content={(props: any) => {
                // Customizar o tooltip para distribuição por horário
                if (props.active && props.payload) {
                  const formattedPayload = props.payload.map((entry: any) => {
                    if (entry.dataKey === "hours") {
                      const hoursValue = typeof entry.value === 'number' ? entry.value : parseFloat(entry.value) || 0;
                      return {
                        ...entry,
                        value: formatHoursToTime(hoursValue),
                        name: "Tempo"
                      };
                    }
                    return entry;
                  });
                  return <CustomTooltip {...props} payload={formattedPayload} />;
                }
                return null;
              }}
            />
            <Bar dataKey="hours" radius={[8, 8, 0, 0]} name="Tempo">
              {timeDistributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
