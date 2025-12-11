import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Subject, StudyLog } from '../types';

// ✅ FUNÇÃO DE VALIDAÇÃO - Garante que números nunca sejam negativos
const sanitizeNumber = (value: number | undefined | null, defaultValue = 0): number => {
  if (value === undefined || value === null || isNaN(value)) return defaultValue;
  return Math.max(0, Math.floor(value)); // Nunca negativo, sempre inteiro
};

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
        // --- CARREGAR MATÉRIAS ---
        const { data: subData, error: subError } = await supabase
          .from('subjects')
          .select('*, subtopics(*)')
          .order('position');
        
        if (subError) console.error('Erro matérias:', subError);
        
        // TRADUÇÃO DO BANCO PARA O APP (snake_case -> camelCase)
        const mappedSubjects = (subData || []).map((s: any) => ({
          ...s,
          goalMinutes: sanitizeNumber(s.goal_minutes),
        }));
        setSubjects(mappedSubjects);

        // --- CARREGAR LOGS ---
        const { data: logData, error: logError } = await supabase
          .from('study_logs')
          .select('*')
          .order('created_at', { ascending: true });

        if (logError) console.error('Erro logs:', logError);

        // TRADUÇÃO DO BANCO PARA O APP
        const mappedLogs = (logData || []).map((l: any) => ({
          ...l,
          subjectId: l.subject_id,
          subtopicId: l.subtopic_id,
          hours: sanitizeNumber(l.hours),
          minutes: sanitizeNumber(l.minutes),
          seconds: sanitizeNumber(l.seconds),
          pages: sanitizeNumber(l.pages),
          correct: sanitizeNumber(l.correct),
          wrong: sanitizeNumber(l.wrong),
          blank: sanitizeNumber(l.blank),
        }));
        setLogs(mappedLogs);

        // --- CARREGAR CONFIGURAÇÕES ---
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (settingsData) {
          setCycleStartDate(settingsData.cycle_start_date || Date.now());
          setDailyGoal(sanitizeNumber(settingsData.daily_goal));
          setShowPerformance(settingsData.show_performance ?? true);
        } else {
          // Se não existir, cria agora
          await supabase.from('user_settings').insert([{ 
            user_id: session.user.id,
            cycle_start_date: Date.now(),
            daily_goal: 0,
            show_performance: true
          }]);
        }

      } catch (error) {
        console.error('Erro geral ao carregar dados:', error);
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
      // ✅ CORRIGIDO: Removida duplicação de goal_minutes + validação
      const newSubject = {
        user_id: session.user.id,
        name: subject.name,
        goal_minutes: sanitizeNumber(subject.goalMinutes),
        color: subject.color,
        position: subjects.length
      };

      const { data, error } = await supabase.from('subjects').insert([newSubject]).select().single();
      if (error) throw error;

      // Adiciona localmente já traduzido
      setSubjects([...subjects, { 
        ...data, 
        goalMinutes: sanitizeNumber(data.goal_minutes), 
        subtopics: [] 
      }]);
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
      const { subtopics, goalMinutes, ...otherFields } = updates;
      
      // Prepara objeto para o banco (snake_case) com validação
      const dbUpdates: any = { ...otherFields };
      if (goalMinutes !== undefined) {
        dbUpdates.goal_minutes = sanitizeNumber(goalMinutes);
      }

      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('subjects').update(dbUpdates).eq('id', id);
      }
      
      // Atualiza estado local com valor validado
      const validatedUpdates = { ...updates };
      if (goalMinutes !== undefined) {
        validatedUpdates.goalMinutes = sanitizeNumber(goalMinutes);
      }
      setSubjects(subjects.map(s => s.id === id ? { ...s, ...validatedUpdates } : s));
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

  // --- FUNÇÕES DE LOGS ---
  const addLog = async (log: any) => {
    if (!session?.user) return;
    try {
      // ✅ VALIDAÇÃO: Todos os campos numéricos são sanitizados
      const dbLog = {
        user_id: session.user.id,
        subject_id: log.subjectId,
        subtopic_id: log.subtopicId || null,
        type: log.type,
        hours: sanitizeNumber(log.hours),
        minutes: sanitizeNumber(log.minutes),
        seconds: sanitizeNumber(log.seconds),
        pages: sanitizeNumber(log.pages),
        correct: sanitizeNumber(log.correct),
        wrong: sanitizeNumber(log.wrong),
        blank: sanitizeNumber(log.blank),
        notes: log.notes,
        date: log.date,
        timestamp: log.timestamp || Date.now()
      };

      const { data, error } = await supabase.from('study_logs').insert([dbLog]).select().single();
      if (error) throw error;

      // Adiciona localmente já traduzido e validado
      const newLocalLog = {
        ...data,
        id: data.id,
        subjectId: data.subject_id,
        subtopicId: data.subtopic_id,
        hours: sanitizeNumber(data.hours),
        minutes: sanitizeNumber(data.minutes),
        seconds: sanitizeNumber(data.seconds),
        pages: sanitizeNumber(data.pages),
        correct: sanitizeNumber(data.correct),
        wrong: sanitizeNumber(data.wrong),
        blank: sanitizeNumber(data.blank),
      };
      setLogs([...logs, newLocalLog]);
    } catch (error) {
      console.error('Erro ao salvar log:', error);
    }
  };

  const deleteLog = async (id: string) => {
    try {
      await supabase.from('study_logs').delete().eq('id', id);
      setLogs(logs.filter(l => l.id !== id));
    } catch (error) { console.error(error); }
  };

  const editLog = async (id: string, updates: Partial<StudyLog>) => {
     try {
       // ✅ VALIDAÇÃO: Sanitiza campos numéricos na edição
       const sanitizedUpdates: any = { ...updates };
       if (updates.hours !== undefined) sanitizedUpdates.hours = sanitizeNumber(updates.hours);
       if (updates.minutes !== undefined) sanitizedUpdates.minutes = sanitizeNumber(updates.minutes);
       if (updates.seconds !== undefined) sanitizedUpdates.seconds = sanitizeNumber(updates.seconds);
       if (updates.pages !== undefined) sanitizedUpdates.pages = sanitizeNumber(updates.pages);
       if (updates.correct !== undefined) sanitizedUpdates.correct = sanitizeNumber(updates.correct);
       if (updates.wrong !== undefined) sanitizedUpdates.wrong = sanitizeNumber(updates.wrong);
       if (updates.blank !== undefined) sanitizedUpdates.blank = sanitizeNumber(updates.blank);

       await supabase.from('study_logs').update(sanitizedUpdates).eq('id', id);
       setLogs(logs.map(l => l.id === id ? { ...l, ...sanitizedUpdates } : l));
     } catch(error) { console.error(error); }
  }

  const updateSettings = async (updates: any) => {
    if (!session?.user) return;
    try {
      const dbUpdates: any = {};
      if (updates.cycleStartDate !== undefined) dbUpdates.cycle_start_date = updates.cycleStartDate;
      if (updates.dailyGoal !== undefined) dbUpdates.daily_goal = sanitizeNumber(updates.dailyGoal);
      if (updates.showPerformance !== undefined) dbUpdates.show_performance = updates.showPerformance;

      await supabase.from('user_settings').update(dbUpdates).eq('user_id', session.user.id);

      if (updates.cycleStartDate !== undefined) setCycleStartDate(updates.cycleStartDate);
      if (updates.dailyGoal !== undefined) setDailyGoal(sanitizeNumber(updates.dailyGoal));
      if (updates.showPerformance !== undefined) setShowPerformance(updates.showPerformance);
    } catch (error) { console.error(error); }
  };

  return {
    subjects, logs, cycleStartDate, dailyGoal, showPerformance, loadingData,
    addSubject, deleteSubject, updateSubject, reorderSubjects,
    addLog, deleteLog, editLog, updateSettings
  };
}