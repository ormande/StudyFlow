import { useState, useEffect, useCallback } from 'react';
import { StudyLog } from '../types';
import { useToast } from '../contexts/ToastContext';

export interface GoalsSettings {
  countWeekends: boolean;
  strictMode: boolean;
  notifications: boolean;
}

export interface Goals {
  dailyTimeGoal: number; // horas
  weeklyTimeGoal: number; // horas
  dailyQuestionsGoal: number;
  weeklyQuestionsGoal: number;
  settings: GoalsSettings;
}

const DEFAULT_GOALS: Goals = {
  dailyTimeGoal: 3,
  weeklyTimeGoal: 18,
  dailyQuestionsGoal: 20,
  weeklyQuestionsGoal: 100,
  settings: {
    countWeekends: true,
    strictMode: false,
    notifications: true,
  },
};

export function useGoals(logs: StudyLog[]) {
  const { addToast } = useToast();
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);

  // Carregar metas do localStorage ao inicializar
  useEffect(() => {
    const loadGoals = () => {
      try {
        const dailyTime = localStorage.getItem('studyflow_daily_time_goal');
        const weeklyTime = localStorage.getItem('studyflow_weekly_time_goal');
        const dailyQuestions = localStorage.getItem('studyflow_daily_questions_goal');
        const weeklyQuestions = localStorage.getItem('studyflow_weekly_questions_goal');
        const settingsStr = localStorage.getItem('studyflow_goals_settings');

        const loadedGoals: Goals = {
          dailyTimeGoal: dailyTime ? parseFloat(dailyTime) : DEFAULT_GOALS.dailyTimeGoal,
          weeklyTimeGoal: weeklyTime ? parseFloat(weeklyTime) : DEFAULT_GOALS.weeklyTimeGoal,
          dailyQuestionsGoal: dailyQuestions ? parseInt(dailyQuestions) : DEFAULT_GOALS.dailyQuestionsGoal,
          weeklyQuestionsGoal: weeklyQuestions ? parseInt(weeklyQuestions) : DEFAULT_GOALS.weeklyQuestionsGoal,
          settings: settingsStr ? JSON.parse(settingsStr) : DEFAULT_GOALS.settings,
        };

        setGoals(loadedGoals);
      } catch (error) {
        console.error('Erro ao carregar metas:', error);
        setGoals(DEFAULT_GOALS);
      }
    };

    loadGoals();
  }, []);

  // Salvar metas no localStorage
  const saveGoals = useCallback((newGoals: Goals) => {
    try {
      localStorage.setItem('studyflow_daily_time_goal', newGoals.dailyTimeGoal.toString());
      localStorage.setItem('studyflow_weekly_time_goal', newGoals.weeklyTimeGoal.toString());
      localStorage.setItem('studyflow_daily_questions_goal', newGoals.dailyQuestionsGoal.toString());
      localStorage.setItem('studyflow_weekly_questions_goal', newGoals.weeklyQuestionsGoal.toString());
      localStorage.setItem('studyflow_goals_settings', JSON.stringify(newGoals.settings));
      setGoals(newGoals);
      addToast('Metas atualizadas com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar metas:', error);
      addToast('Erro ao salvar metas. Tente novamente.', 'error');
    }
  }, [addToast]);

  // Atualizar metas
  const updateGoals = useCallback((updates: Partial<Goals>) => {
    const newGoals = { ...goals, ...updates };
    if (updates.settings) {
      newGoals.settings = { ...goals.settings, ...updates.settings };
    }
    saveGoals(newGoals);
  }, [goals, saveGoals]);

  // Calcular progresso diário
  const getDailyProgress = useCallback(() => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const todayLogs = logs.filter(log => log.date === todayString);
    
    // Tempo em horas
    const totalMinutes = todayLogs.reduce((sum, log) => 
      sum + log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60), 0
    );
    const totalHours = totalMinutes / 60;
    
    // Questões corretas
    const totalQuestions = todayLogs.reduce((sum, log) => sum + (log.correct || 0), 0);
    
    return {
      time: {
        current: totalHours,
        goal: goals.dailyTimeGoal,
        percentage: goals.dailyTimeGoal > 0 ? Math.min((totalHours / goals.dailyTimeGoal) * 100, 200) : 0,
      },
      questions: {
        current: totalQuestions,
        goal: goals.dailyQuestionsGoal,
        percentage: goals.dailyQuestionsGoal > 0 ? Math.min((totalQuestions / goals.dailyQuestionsGoal) * 100, 200) : 0,
      },
    };
  }, [logs, goals]);

  // Calcular progresso semanal
  const getWeeklyProgress = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc.
    
    // Calcular início da semana (domingo)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    
    // Calcular fim da semana (sábado)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Filtrar logs da semana
    const weekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= weekStart && logDate <= weekEnd;
    });
    
    // Tempo em horas
    const totalMinutes = weekLogs.reduce((sum, log) => 
      sum + log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60), 0
    );
    const totalHours = totalMinutes / 60;
    
    // Questões corretas
    const totalQuestions = weekLogs.reduce((sum, log) => sum + (log.correct || 0), 0);
    
    return {
      time: {
        current: totalHours,
        goal: goals.weeklyTimeGoal,
        percentage: goals.weeklyTimeGoal > 0 ? Math.min((totalHours / goals.weeklyTimeGoal) * 100, 200) : 0,
      },
      questions: {
        current: totalQuestions,
        goal: goals.weeklyQuestionsGoal,
        percentage: goals.weeklyQuestionsGoal > 0 ? Math.min((totalQuestions / goals.weeklyQuestionsGoal) * 100, 200) : 0,
      },
    };
  }, [logs, goals]);

  // Obter cor do progresso baseado na porcentagem
  const getProgressColor = useCallback((percentage: number): string => {
    if (percentage < 50) return 'bg-red-500';
    if (percentage < 80) return 'bg-amber-500';
    if (percentage < 100) return 'bg-emerald-400';
    if (percentage < 150) return 'bg-emerald-600';
    return 'bg-gradient-to-r from-amber-400 to-yellow-500';
  }, []);

  // Obter badge de status
  const getProgressBadge = useCallback((percentage: number): string => {
    if (percentage < 50) return 'Atenção';
    if (percentage < 80) return 'No caminho';
    if (percentage < 100) return 'Quase lá';
    if (percentage < 150) return 'Meta batida!';
    return 'Superou!';
  }, []);

  return {
    goals,
    updateGoals,
    saveGoals,
    getDailyProgress,
    getWeeklyProgress,
    getProgressColor,
    getProgressBadge,
  };
}
