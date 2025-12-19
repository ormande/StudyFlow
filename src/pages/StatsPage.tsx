import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Clock, HelpCircle, Target, Flame, TrendingUp, BarChart3, PieChart, Calendar, BookOpen, ChevronDown } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Subject, StudyLog } from '../types';
import IOSSwitch from '../components/IOSSwitch';

interface StatsPageProps {
  logs: StudyLog[];
  subjects: Subject[];
  cycleStartDate: number;
  streak: number;
  onNavigateBack: () => void;
}

type PeriodOption = '7days' | '30days' | '3months' | 'cycle' | 'all' | 'custom';

export default function StatsPage({
  logs,
  subjects,
  cycleStartDate,
  streak,
  onNavigateBack
}: StatsPageProps) {
  const [period, setPeriod] = useState<PeriodOption>('30days');
  const [cycleOnly, setCycleOnly] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setShowPeriodDropdown(false);
      setShowSubjectDropdown(false);
    };
    if (showPeriodDropdown || showSubjectDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showPeriodDropdown, showSubjectDropdown]);

  // Filtrar logs baseado nos filtros
  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    // Filtro de ciclo
    if (cycleOnly) {
      filtered = filtered.filter(log => log.timestamp >= cycleStartDate);
    }

    // Filtro de matéria
    if (selectedSubjectId !== 'all') {
      filtered = filtered.filter(log => log.subjectId === selectedSubjectId);
    }

    // Filtro de período
    const now = new Date();
    switch (period) {
      case '7days':
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter(log => new Date(log.date) >= sevenDaysAgo);
        break;
      case '30days':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(log => new Date(log.date) >= thirtyDaysAgo);
        break;
      case '3months':
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        filtered = filtered.filter(log => new Date(log.date) >= threeMonthsAgo);
        break;
      case 'cycle':
        filtered = filtered.filter(log => log.timestamp >= cycleStartDate);
        break;
      case 'all':
        // Não filtrar por data
        break;
      case 'custom':
        // TODO: Implementar date picker customizado
        break;
    }

    return filtered;
  }, [logs, period, cycleOnly, selectedSubjectId, cycleStartDate]);

  // Calcular totais
  const summaryData = useMemo(() => {
    const totalMinutes = filteredLogs.reduce((sum, log) => 
      sum + log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60), 0
    );
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMinutesRemainder = totalMinutes % 60;

    const questionLogs = filteredLogs.filter(log => 
      (log.correct || 0) + (log.wrong || 0) + (log.blank || 0) > 0
    );
    const totalQuestions = questionLogs.reduce((sum, log) => 
      sum + (log.correct || 0) + (log.wrong || 0) + (log.blank || 0), 0
    );
    const totalCorrect = questionLogs.reduce((sum, log) => sum + (log.correct || 0), 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // Calcular dias estudados (dias únicos com logs)
    const uniqueDates = new Set(filteredLogs.map(log => log.date));
    const daysStudied = uniqueDates.size;

    return {
      totalHours,
      totalMinutes: totalMinutesRemainder,
      totalQuestions,
      accuracy,
      daysStudied
    };
  }, [filteredLogs]);

  // Dados para gráfico de evolução
  const evolutionData = useMemo(() => {
    const daysMap = new Map<string, { hours: number; questions: number }>();
    
    filteredLogs.forEach(log => {
      const dateKey = new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const existing = daysMap.get(dateKey) || { hours: 0, questions: 0 };
      
      const logMinutes = log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60);
      existing.hours += logMinutes / 60;
      existing.questions += (log.correct || 0) + (log.wrong || 0) + (log.blank || 0);
      
      daysMap.set(dateKey, existing);
    });

    // Ordenar por data
    return Array.from(daysMap.entries())
      .map(([date, data]) => ({ date, hours: Number(data.hours.toFixed(2)), questions: data.questions }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-30); // Últimos 30 dias
  }, [filteredLogs]);

  // Dados para gráfico de tempo por disciplina
  const subjectTimeData = useMemo(() => {
    const subjectMap = new Map<string, number>();
    
    filteredLogs.forEach(log => {
      const subject = subjects.find(s => s.id === log.subjectId);
      const subjectName = subject?.name || 'Sem matéria';
      const logMinutes = log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60);
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
    const questionLogs = filteredLogs.filter(log => 
      (log.correct || 0) + (log.wrong || 0) + (log.blank || 0) > 0
    );
    
    const totalCorrect = questionLogs.reduce((sum, log) => sum + (log.correct || 0), 0);
    const totalWrong = questionLogs.reduce((sum, log) => sum + (log.wrong || 0), 0);
    const totalBlank = questionLogs.reduce((sum, log) => sum + (log.blank || 0), 0);

    return [
      { name: 'Corretas', value: totalCorrect, color: '#10b981' },
      { name: 'Erradas', value: totalWrong, color: '#ef4444' },
      { name: 'Em Branco', value: totalBlank, color: '#3b82f6' }
    ].filter(item => item.value > 0);
  }, [filteredLogs]);

  // Dados para tabela de desempenho por matéria
  const subjectPerformanceData = useMemo(() => {
    const subjectMap = new Map<string, { total: number; correct: number; wrong: number; blank: number }>();
    
    filteredLogs.forEach(log => {
      const subject = subjects.find(s => s.id === log.subjectId);
      const subjectName = subject?.name || 'Sem matéria';
      
      const total = (log.correct || 0) + (log.wrong || 0) + (log.blank || 0);
      if (total === 0) return;
      
      const existing = subjectMap.get(subjectName) || { total: 0, correct: 0, wrong: 0, blank: 0 };
      existing.total += total;
      existing.correct += (log.correct || 0);
      existing.wrong += (log.wrong || 0);
      existing.blank += (log.blank || 0);
      
      subjectMap.set(subjectName, existing);
    });

    return Array.from(subjectMap.entries())
      .map(([subject, data]) => {
        const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        return {
          subject,
          total: data.total,
          correct: data.correct,
          wrong: data.wrong,
          blank: data.blank,
          accuracy
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy); // Pior primeiro
  }, [filteredLogs, subjects]);

  // Dados para evolução da taxa de acerto
  const accuracyEvolutionData = useMemo(() => {
    const daysMap = new Map<string, { correct: number; total: number }>();
    
    filteredLogs.forEach(log => {
      const total = (log.correct || 0) + (log.wrong || 0) + (log.blank || 0);
      if (total === 0) return;
      
      const dateKey = new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const existing = daysMap.get(dateKey) || { correct: 0, total: 0 };
      
      existing.correct += (log.correct || 0);
      existing.total += total;
      
      daysMap.set(dateKey, existing);
    });

    return Array.from(daysMap.entries())
      .map(([date, data]) => ({
        date,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-30);
  }, [filteredLogs]);

  // Dados para distribuição por horário
  const timeDistributionData = useMemo(() => {
    const periods = {
      madrugada: { hours: 0, label: 'Madrugada', color: '#6366f1' },
      manha: { hours: 0, label: 'Manhã', color: '#f59e0b' },
      tarde: { hours: 0, label: 'Tarde', color: '#10b981' },
      noite: { hours: 0, label: 'Noite', color: '#8b5cf6' }
    };

    filteredLogs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const hour = logDate.getHours();
      const logMinutes = log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60);
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

    return Object.values(periods).map(period => ({
      period: period.label,
      hours: Number(period.hours.toFixed(2)),
      color: period.color
    }));
  }, [filteredLogs]);

  // Função para obter cor da taxa de acerto
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return 'text-emerald-600 dark:text-emerald-400';
    if (accuracy >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Estado vazio
  if (filteredLogs.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onNavigateBack}
            className="md:hidden flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">Voltar</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Estatísticas</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Gráficos e análises detalhadas</p>
        </div>

        {/* Estado Vazio */}
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <BarChart3 size={64} className="text-gray-400 dark:text-gray-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Nenhuma estatística ainda</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            Comece registrando seus estudos para ver gráficos e análises aqui!
          </p>
        </div>
      </div>
    );
  }

  const periodLabels: Record<PeriodOption, string> = {
    '7days': 'Últimos 7 dias',
    '30days': 'Últimos 30 dias',
    '3months': 'Últimos 3 meses',
    'cycle': 'Ciclo atual',
    'all': 'Todos os tempos',
    'custom': 'Personalizado'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <button
              onClick={onNavigateBack}
              className="md:hidden flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              <span className="font-semibold">Voltar</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Estatísticas</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Gráficos e análises detalhadas</p>
          </div>

          {/* Filtros - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {/* Filtro Período */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPeriodDropdown(!showPeriodDropdown);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Calendar size={16} />
                {periodLabels[period]}
                <ChevronDown size={16} />
              </button>
              {showPeriodDropdown && (
                <div 
                  className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 min-w-[200px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {Object.entries(periodLabels).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setPeriod(key as PeriodOption);
                        setShowPeriodDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        period === key ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Toggle Ciclo/Todos */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
              <IOSSwitch
                checked={cycleOnly}
                onChange={setCycleOnly}
                aria-label={cycleOnly ? 'Ciclo atual' : 'Todos os tempos'}
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {cycleOnly ? 'Ciclo Atual' : 'Todos os Tempos'}
              </span>
            </div>

            {/* Filtro Matéria */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSubjectDropdown(!showSubjectDropdown);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <BookOpen size={16} />
                {selectedSubjectId === 'all' ? 'Todas as matérias' : subjects.find(s => s.id === selectedSubjectId)?.name || 'Todas'}
                <ChevronDown size={16} />
              </button>
              {showSubjectDropdown && (
                <div 
                  className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 min-w-[200px] max-h-[300px] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubjectId('all');
                      setShowSubjectDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedSubjectId === 'all' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Todas as matérias
                  </button>
                  {subjects.map(subject => (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubjectId(subject.id);
                        setShowSubjectDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedSubjectId === subject.id ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {subject.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filtros - Mobile */}
        <div className="md:hidden space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodOption)}
              className="flex-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
            >
              {Object.entries(periodLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {cycleOnly ? 'Ciclo Atual' : 'Todos os Tempos'}
            </span>
            <IOSSwitch
              checked={cycleOnly}
              onChange={setCycleOnly}
              aria-label={cycleOnly ? 'Ciclo atual' : 'Todos os tempos'}
            />
          </div>
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-gray-500" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="flex-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
            >
              <option value="all">Todas as matérias</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SEÇÃO A: RESUMO GERAL (Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Card 1 - Total de Horas */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-emerald-500" />
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Total de Horas</span>
          </div>
          <p className="text-2xl font-black text-gray-800 dark:text-white">
            {summaryData.totalHours}h {summaryData.totalMinutes}min
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Estudadas no período</p>
        </div>

        {/* Card 2 - Total de Questões */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle size={20} className="text-blue-500" />
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Questões Resolvidas</span>
          </div>
          <p className="text-2xl font-black text-gray-800 dark:text-white">
            {summaryData.totalQuestions.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No período selecionado</p>
        </div>

        {/* Card 3 - Taxa de Acerto */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target size={20} className="text-amber-500" />
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Taxa de Acerto</span>
          </div>
          <p className={`text-2xl font-black ${getAccuracyColor(summaryData.accuracy)}`}>
            {summaryData.accuracy}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Média geral</p>
        </div>

        {/* Card 4 - Dias Estudados */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={20} className="text-orange-500" />
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Dias Estudados</span>
          </div>
          <p className="text-2xl font-black text-gray-800 dark:text-white">
            {summaryData.daysStudied} dias
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Streak atual: {streak} dias</p>
        </div>
      </div>

      {/* SEÇÃO B: EVOLUÇÃO TEMPORAL */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-emerald-500" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Evolução nos Últimos 30 Dias</h2>
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <LineChart data={evolutionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280" 
              className="dark:stroke-gray-400"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              yAxisId="left"
              stroke="#10b981" 
              className="dark:stroke-emerald-400"
              tick={{ fill: '#10b981' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right" 
              stroke="#3b82f6"
              className="dark:stroke-blue-400"
              tick={{ fill: '#3b82f6' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#1f2937'
              }}
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="hours" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Horas"
              dot={{ fill: '#10b981', r: 4 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="questions" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Questões"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SEÇÃO C: TEMPO POR DISCIPLINA */}
      {subjectTimeData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Tempo por Disciplina</h2>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
            <BarChart data={subjectTimeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis type="number" stroke="#6b7280" className="dark:stroke-gray-400" />
              <YAxis 
                dataKey="subject" 
                type="category" 
                width={120} 
                stroke="#6b7280"
                className="dark:stroke-gray-400"
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(1)}h`}
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#1f2937'
                }}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Desempenho em Questões</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico de Pizza */}
            <div>
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <RechartsPieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={isMobile ? 80 : 100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => value.toLocaleString('pt-BR')}
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: '#1f2937'
                    }}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Tabela por Matéria */}
            {subjectPerformanceData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Matéria</th>
                      <th className="text-center p-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Total</th>
                      <th className="text-center p-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Acerto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectPerformanceData.map((item) => (
                      <tr key={item.subject} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="p-2 text-sm text-gray-800 dark:text-gray-200">{item.subject}</td>
                        <td className="text-center p-2 text-sm text-gray-600 dark:text-gray-400">{item.total}</td>
                        <td className={`text-center p-2 text-sm font-bold ${getAccuracyColor(item.accuracy)}`}>
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
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Evolução da Taxa de Acerto</h2>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <LineChart data={accuracyEvolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                className="dark:stroke-gray-400"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#6b7280"
                className="dark:stroke-gray-400"
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip 
                formatter={(value: number) => `${value}%`}
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#1f2937'
                }}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Taxa de Acerto"
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey={() => 70} 
                stroke="#6b7280" 
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Meta (70%)"
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
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Distribuição por Horário</h2>
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <BarChart data={timeDistributionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis 
              dataKey="period" 
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(1)}h`}
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#1f2937'
              }}
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
            <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
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
