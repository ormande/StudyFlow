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
        // Carregar Matérias
        const { data: subData, error: subError } = await supabase
          .from('subjects')
          .select('*, subtopics(*)')
          .order('position');
        
        if (subError) console.error('Erro matérias:', subError);
        setSubjects(subData || []);

        // Carregar Logs
        const { data: logData, error: logError } = await supabase
          .from('study_logs')
          .select('*')
          .order('created_at', { ascending: true });

        if (logError) console.error('Erro logs:', logError);
        setLogs(logData || []);

        // Carregar Configurações (CORREÇÃO AQUI)
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle(); // <--- USA maybeSingle PARA NÃO DAR ERRO 406

        if (settingsData) {
          setCycleStartDate(settingsData.cycle_start_date || Date.now());
          setDailyGoal(settingsData.daily_goal || 0);
          setShowPerformance(settingsData.show_performance ?? true);
        } else {
          // Se não existir, cria agora
          const { error: insertError } = await supabase.from('user_settings').insert([{ 
            user_id: session.user.id,
            cycle_start_date: Date.now(),
            daily_goal: 0,
            show_performance: true
          }]);
          
          if (insertError) console.error('Erro ao criar settings:', insertError);
        }

      } catch (error) {
        console.error('Erro geral ao carregar dados:', error);
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [session]);

  // ... (Resto das funções mantidas iguais para economizar espaço visual, mas o arquivo completo deve tê-las) ...
  // Vou recolocar as funções abaixo para garantir que você copie tudo certo:

  const addSubject = async (subject: Omit<Subject, 'id'>) => {
    if (!session?.user) return;
    try {
      const newSubject = {
        user_id: session.user.id,
        name: subject.name,
        goal_minutes: subject.goalMinutes,
        color: subject.color,
        position: subjects.length
      };
      const { data, error } = await supabase.from('subjects').insert([newSubject]).select().single();
      if (error) throw error;
      setSubjects([...subjects, { ...data, subtopics: [] }]);
    } catch (error) {
      console.error('Erro ao adicionar matéria:', error);
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      await supabase.from('subjects').delete().eq('id', id);
      setSubjects(subjects.filter(s => s.id !== id));
    } catch (error) { console.error(error); }
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    try {
      const { subtopics, ...subjectFields } = updates;
      if (Object.keys(subjectFields).length > 0) {
        await supabase.from('subjects').update(subjectFields).eq('id', id);
      }
      setSubjects(subjects.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (error) { console.error(error); }
  };

  const reorderSubjects = async (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    try {
      for (let i = 0; i < newSubjects.length; i++) {
         await supabase.from('subjects').update({ position: i }).eq('id', newSubjects[i].id);
      }
    } catch (error) { console.error(error); }
  };

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
    } catch (error) { console.error(error); }
  };

  const deleteLog = async (id: string) => {
    try {
      await supabase.from('study_logs').delete().eq('id', id);
      setLogs(logs.filter(l => l.id !== id));
    } catch (error) { console.error(error); }
  };

  const editLog = async (id: string, updates: Partial<StudyLog>) => {
     try {
       await supabase.from('study_logs').update(updates).eq('id', id);
       setLogs(logs.map(l => l.id === id ? { ...l, ...updates } : l));
     } catch(error) { console.error(error); }
  }

  const updateSettings = async (updates: any) => {
    if (!session?.user) return;
    try {
      const dbUpdates: any = {};
      if (updates.cycleStartDate !== undefined) dbUpdates.cycle_start_date = updates.cycleStartDate;
      if (updates.dailyGoal !== undefined) dbUpdates.daily_goal = updates.dailyGoal;
      if (updates.showPerformance !== undefined) dbUpdates.show_performance = updates.showPerformance;

      await supabase.from('user_settings').update(dbUpdates).eq('user_id', session.user.id);

      if (updates.cycleStartDate !== undefined) setCycleStartDate(updates.cycleStartDate);
      if (updates.dailyGoal !== undefined) setDailyGoal(updates.dailyGoal);
      if (updates.showPerformance !== undefined) setShowPerformance(updates.showPerformance);
    } catch (error) { console.error(error); }
  };

  return {
    subjects, logs, cycleStartDate, dailyGoal, showPerformance, loadingData,
    addSubject, deleteSubject, updateSubject, reorderSubjects,
    addLog, deleteLog, editLog, updateSettings
  };
}