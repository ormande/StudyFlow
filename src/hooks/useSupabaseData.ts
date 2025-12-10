import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Subject, StudyLog } from '../types';

export function useSupabaseData(session: any) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [cycleStartDate, setCycleStartDate] = useState<number>(Date.now());
  const [dailyGoal, setDailyGoal] = useState<number>(0);
  const [showPerformance, setShowPerformance] = useState<boolean>(true);
  const [loadingData, setLoadingData] = useState(false);

  // 1. CARREGAR DADOS INICIAIS
  useEffect(() => {
    if (!session?.user) return;

    async function fetchData() {
      setLoadingData(true);
      try {
        // Carregar Matérias (com subtópicos)
        const { data: subData, error: subError } = await supabase
          .from('subjects')
          .select('*, subtopics(*)')
          .order('position');
        
        if (subError) throw subError;
        setSubjects(subData || []);

        // Carregar Logs
        const { data: logData, error: logError } = await supabase
          .from('study_logs')
          .select('*')
          .order('created_at', { ascending: true });

        if (logError) throw logError;
        setLogs(logData || []);

        // Carregar Configurações
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (settingsData) {
          setCycleStartDate(settingsData.cycle_start_date || Date.now());
          setDailyGoal(settingsData.daily_goal || 0);
          setShowPerformance(settingsData.show_performance ?? true);
        } else if (!settingsError) {
          // Se não existir settings, cria um padrão
          await supabase.from('user_settings').insert([{ 
            user_id: session.user.id,
            cycle_start_date: Date.now(),
            daily_goal: 0,
            show_performance: true
          }]);
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [session]);

  // --- FUNÇÕES DE MATÉRIAS ---
  const addSubject = async (subject: Omit<Subject, 'id'>) => {
    if (!session?.user) return;
    try {
      const newSubject = {
        user_id: session.user.id,
        name: subject.name,
        goal_minutes: subject.goalMinutes,
        color: subject.color,
        position: subjects.length // Vai para o final da fila
      };

      const { data, error } = await supabase.from('subjects').insert([newSubject]).select().single();
      if (error) throw error;

      // Atualiza a tela imediatamente (Optimistic UI)
      setSubjects([...subjects, { ...data, subtopics: [] }]);
    } catch (error) {
      console.error('Erro ao adicionar matéria:', error);
      alert('Erro ao salvar. Verifique sua conexão.');
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;
      setSubjects(subjects.filter(s => s.id !== id));
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    try {
      // Separa o que é campo da tabela subjects
      const { subtopics, ...subjectFields } = updates;
      
      if (Object.keys(subjectFields).length > 0) {
        const { error } = await supabase.from('subjects').update(subjectFields).eq('id', id);
        if (error) throw error;
      }
      
      // Atualiza localmente para refletir na hora
      setSubjects(subjects.map(s => s.id === id ? { ...s, ...updates } : s));

    } catch (error) {
      console.error('Erro ao atualizar:', error);
    }
  };

  const reorderSubjects = async (newSubjects: Subject[]) => {
    // Atualiza visualmente na hora
    setSubjects(newSubjects);

    // Atualiza no banco em segundo plano (cada um com sua nova posição)
    try {
      const updates = newSubjects.map((s, index) => ({
        id: s.id,
        position: index,
        user_id: session.user.id, // RLS exige isso as vezes
        name: s.name // Postgres pede campos obrigatórios no upsert as vezes, mas update simples resolve se for por ID
      }));

      // Forma simplificada: faz um update para cada (não é o mais eficiente do mundo, mas funciona para listas pequenas)
      for (let i = 0; i < newSubjects.length; i++) {
         await supabase.from('subjects').update({ position: i }).eq('id', newSubjects[i].id);
      }
    } catch (error) {
      console.error('Erro ao reordenar:', error);
    }
  };

  // --- FUNÇÕES DE LOGS ---
  const addLog = async (log: any) => {
    if (!session?.user) return;
    try {
      const dbLog = {
        user_id: session.user.id,
        subject_id: log.subjectId,
        subtopic_id: log.subtopicId || null,
        type: log.type,
        hours: log.hours,
        minutes: log.minutes,
        seconds: log.seconds,
        pages: log.pages,
        correct: log.correct,
        wrong: log.wrong,
        blank: log.blank,
        notes: log.notes,
        date: log.date,
        timestamp: log.timestamp || Date.now()
      };

      const { data, error } = await supabase.from('study_logs').insert([dbLog]).select().single();
      if (error) throw error;

      setLogs([...logs, { ...data, id: data.id }]);
    } catch (error) {
      console.error('Erro ao salvar log:', error);
    }
  };

  const deleteLog = async (id: string) => {
    try {
      const { error } = await supabase.from('study_logs').delete().eq('id', id);
      if (error) throw error;
      setLogs(logs.filter(l => l.id !== id));
    } catch (error) {
      console.error('Erro ao deletar log:', error);
    }
  };

  const editLog = async (id: string, updates: Partial<StudyLog>) => {
     try {
       const { error } = await supabase.from('study_logs').update(updates).eq('id', id);
       if (error) throw error;
       setLogs(logs.map(l => l.id === id ? { ...l, ...updates } : l));
     } catch(error) {
        console.error('Erro ao editar log:', error);
     }
  }

  // --- FUNÇÕES DE SETTINGS ---
  const updateSettings = async (updates: any) => {
    if (!session?.user) return;
    try {
      // Mapeia nomes do JS para nomes do Banco
      const dbUpdates: any = {};
      if (updates.cycleStartDate !== undefined) dbUpdates.cycle_start_date = updates.cycleStartDate;
      if (updates.dailyGoal !== undefined) dbUpdates.daily_goal = updates.dailyGoal;
      if (updates.showPerformance !== undefined) dbUpdates.show_performance = updates.showPerformance;

      const { error } = await supabase.from('user_settings').update(dbUpdates).eq('user_id', session.user.id);
      if (error) throw error;

      // Atualiza Estado Local
      if (updates.cycleStartDate !== undefined) setCycleStartDate(updates.cycleStartDate);
      if (updates.dailyGoal !== undefined) setDailyGoal(updates.dailyGoal);
      if (updates.showPerformance !== undefined) setShowPerformance(updates.showPerformance);

    } catch (error) {
      console.error('Erro ao atualizar settings:', error);
    }
  };

  return {
    subjects,
    logs,
    cycleStartDate,
    dailyGoal,
    showPerformance,
    loadingData,
    addSubject,
    deleteSubject,
    updateSubject,
    reorderSubjects,
    addLog,
    deleteLog,
    editLog,
    updateSettings
  };
}