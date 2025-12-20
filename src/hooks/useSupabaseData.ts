import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Subject, StudyLog, UserStats } from '../types';
import { useToast } from '../contexts/ToastContext';

// ✅ FUNÇÃO DE VALIDAÇÃO - Garante que números nunca sejam negativos
const sanitizeNumber = (value: number | undefined | null, defaultValue = 0): number => {
  if (value === undefined || value === null || isNaN(value)) return defaultValue;
  return Math.max(0, Math.floor(value)); // Nunca negativo, sempre inteiro
};

export function useSupabaseData(session: any) {
  const { addToast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [allLogDates, setAllLogDates] = useState<Array<{ date: string; timestamp: number }>>([]);
  const [cycleStartDate, setCycleStartDate] = useState<number>(Date.now());
  const [dailyGoal, setDailyGoal] = useState<number>(0);
  const [showPerformance, setShowPerformance] = useState<boolean>(true);
  const [tutorialCompleted, setTutorialCompleted] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState(false);

  // 1. CARREGAR DADOS INICIAIS
  useEffect(() => {
    if (!session?.user?.id) return;

    async function fetchData() {
      setLoadingData(true);
      try {
        // --- CARREGAR MATÉRIAS ---
        const { data: subData, error: subError } = await supabase
          .from('subjects')
          .select('*, subtopics(*)')
          .order('position');
        
        if (subError) {
          console.error('Erro matérias:', subError);
          addToast('Erro ao carregar dados. Detalhe: ' + subError.message, 'error');
        }
        
        // TRADUÇÃO DO BANCO PARA O APP (snake_case -> camelCase)
        const mappedSubjects = (subData || []).map((s: any) => ({
          ...s,
          goalMinutes: sanitizeNumber(s.goal_minutes),
        }));
        setSubjects(mappedSubjects);

        // --- CARREGAR ESTATÍSTICAS AGREGADAS (Server-Side Aggregation) ---
        // Usa RPC para calcular totais no servidor, evitando transferir todos os logs
        const { data: statsData, error: statsError } = await supabase.rpc('get_user_stats', {
          p_user_id: session.user.id
        });

        if (statsError) {
          console.error('Erro ao carregar estatísticas:', statsError);
          addToast('Erro ao carregar estatísticas. Detalhe: ' + statsError.message, 'error');
        } else if (statsData) {
          setStats(statsData as UserStats);
        }

        // --- CARREGAR DATAS PARA CÁLCULO DE STREAK (Fetch Leve) ---
        // Busca apenas date e timestamp de TODOS os logs para calcular streak corretamente
        // Isso é muito mais leve que buscar todos os campos
        const { data: datesData, error: datesError } = await supabase
          .from('study_logs')
          .select('date, timestamp')
          .order('timestamp', { ascending: true });

        if (datesError) {
          console.error('Erro ao carregar datas para streak:', datesError);
          addToast('Erro ao carregar dados. Detalhe: ' + datesError.message, 'error');
        } else if (datesData) {
          // Armazena todas as datas para cálculo de streak
          setAllLogDates(datesData.map((d: any) => ({
            date: d.date,
            timestamp: d.timestamp
          })));
        }

        // --- CARREGAR LOGS COMPLETOS (Limitado aos últimos 100) ---
        // Busca apenas os últimos 100 registros para a lista de atividades
        // Isso garante que a UI não trave mesmo com muitos registros
        const { data: logData, error: logError } = await supabase
          .from('study_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (logError) {
          console.error('Erro logs:', logError);
          addToast('Erro ao carregar dados. Detalhe: ' + logError.message, 'error');
        }

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

        if (settingsError) {
          console.error('Erro configurações:', settingsError);
          addToast('Erro ao carregar dados. Detalhe: ' + settingsError.message, 'error');
        }

        if (settingsData) {
          setCycleStartDate(settingsData.cycle_start_date || Date.now());
          setDailyGoal(sanitizeNumber(settingsData.daily_goal));
          setShowPerformance(settingsData.show_performance ?? true);
          setTutorialCompleted(settingsData.tutorial_completed ?? false);
        } else {
          // Se não existir, cria agora usando upsert para evitar erro 409
          const { error: insertError } = await supabase.from('user_settings').upsert([{ 
            user_id: session.user.id,
            cycle_start_date: Date.now(),
            daily_goal: 0,
            show_performance: true,
            tutorial_completed: false
          }], {
            onConflict: 'user_id'
          });
          if (insertError) {
            console.error('Erro ao criar configurações:', insertError);
            addToast('Erro ao criar configurações. Detalhe: ' + insertError.message, 'error');
          }
        }

      } catch (error: any) {
        console.error('Erro geral ao carregar dados:', error);
        addToast('Erro ao carregar dados. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [session?.user?.id]);

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
    } catch (error: any) {
      console.error('Erro ao adicionar matéria:', error);
      addToast('Erro ao criar matéria. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;
      setSubjects(subjects.filter(s => s.id !== id));
    } catch (error: any) {
      console.error(error);
      addToast('Erro ao excluir matéria. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
    }
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
        const { error } = await supabase.from('subjects').update(dbUpdates).eq('id', id);
        if (error) throw error;
      }
      
      // Se subtópicos foram atualizados, salvar no banco
      if (subtopics !== undefined) {
        // Buscar subtópicos existentes no banco
        const { data: existingSubtopics } = await supabase
          .from('subtopics')
          .select('id')
          .eq('subject_id', id);
        
        const existingIds = new Set((existingSubtopics || []).map((st: any) => st.id));
        const newIds = new Set(subtopics.map(st => st.id));
        
        // Deletar subtópicos que foram removidos
        const toDelete = Array.from(existingIds).filter(id => !newIds.has(id));
        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('subtopics')
            .delete()
            .in('id', toDelete);
          if (deleteError) throw deleteError;
        }
        
        // Inserir/atualizar subtópicos
        const subtopicsToUpsert = subtopics.map(st => ({
          id: st.id,
          subject_id: id,
          name: st.name,
          completed: st.completed || false
        }));
        
        if (subtopicsToUpsert.length > 0) {
          const { error: upsertError } = await supabase
            .from('subtopics')
            .upsert(subtopicsToUpsert, { onConflict: 'id' });
          if (upsertError) throw upsertError;
        }
      }
      
      // Atualiza estado local com valor validado
      const validatedUpdates = { ...updates };
      if (goalMinutes !== undefined) {
        validatedUpdates.goalMinutes = sanitizeNumber(goalMinutes);
      }
      setSubjects(subjects.map(s => s.id === id ? { ...s, ...validatedUpdates } : s));
    } catch (error: any) {
      console.error(error);
      addToast('Erro ao atualizar matéria. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
    }
  };

  const reorderSubjects = async (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    try {
      for (let i = 0; i < newSubjects.length; i++) {
         const { error } = await supabase.from('subjects').update({ position: i }).eq('id', newSubjects[i].id);
         if (error) throw error;
      }
    } catch (error: any) {
      console.error(error);
      addToast('Erro ao reordenar matérias. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
    }
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
      if (error) {
        throw error;
      }

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
      setLogs([newLocalLog, ...logs].slice(0, 100)); // Mantém apenas os últimos 100

      // Atualiza estatísticas após adicionar log
      const { data: updatedStats } = await supabase.rpc('get_user_stats', {
        p_user_id: session.user.id
      });
      if (updatedStats) {
        setStats(updatedStats as UserStats);
      }
    } catch (error: any) {
      console.error('Erro ao salvar log:', error);
      addToast('Erro ao registrar estudo. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
    }
  };

  const deleteLog = async (id: string) => {
    if (!session?.user) return;
    try {
      const { error } = await supabase.from('study_logs').delete().eq('id', id);
      if (error) throw error;
      setLogs(logs.filter(l => l.id !== id));

      // Atualiza estatísticas após deletar log
      const { data: updatedStats } = await supabase.rpc('get_user_stats', {
        p_user_id: session.user.id
      });
      if (updatedStats) {
        setStats(updatedStats as UserStats);
      }
    } catch (error: any) {
      console.error(error);
      addToast('Erro ao excluir registro de estudo. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
    }
  };

  const editLog = async (id: string, updates: Partial<StudyLog>) => {
    if (!session?.user) return;
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

      const { error } = await supabase.from('study_logs').update(sanitizedUpdates).eq('id', id);
      if (error) throw error;
      setLogs(logs.map(l => l.id === id ? { ...l, ...sanitizedUpdates } : l));

      // Atualiza estatísticas após editar log
      const { data: updatedStats } = await supabase.rpc('get_user_stats', {
        p_user_id: session.user.id
      });
      if (updatedStats) {
        setStats(updatedStats as UserStats);
      }
    } catch(error: any) {
      console.error(error);
      addToast('Erro ao editar registro de estudo. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
    }
  }

  const updateSettings = async (updates: any) => {
    if (!session?.user) return;
    try {
      const dbUpdates: any = {};
      if (updates.cycleStartDate !== undefined) dbUpdates.cycle_start_date = updates.cycleStartDate;
      if (updates.dailyGoal !== undefined) dbUpdates.daily_goal = sanitizeNumber(updates.dailyGoal);
      if (updates.showPerformance !== undefined) dbUpdates.show_performance = updates.showPerformance;
      if (updates.tutorialCompleted !== undefined) dbUpdates.tutorial_completed = updates.tutorialCompleted;

      const { error } = await supabase.from('user_settings').update(dbUpdates).eq('user_id', session.user.id);
      if (error) throw error;

      if (updates.cycleStartDate !== undefined) setCycleStartDate(updates.cycleStartDate);
      if (updates.dailyGoal !== undefined) setDailyGoal(sanitizeNumber(updates.dailyGoal));
      if (updates.showPerformance !== undefined) setShowPerformance(updates.showPerformance);
      if (updates.tutorialCompleted !== undefined) setTutorialCompleted(updates.tutorialCompleted);
    } catch (error: any) {
      console.error(error);
      addToast('Erro ao atualizar configurações. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
    }
  };

  // Função específica para marcar tutorial como completo
  const markTutorialCompleted = async () => {
    await updateSettings({ tutorialCompleted: true });
  };

  return {
    subjects, logs, stats, allLogDates, cycleStartDate, dailyGoal, showPerformance, tutorialCompleted, loadingData,
    addSubject, deleteSubject, updateSubject, reorderSubjects,
    addLog, deleteLog, editLog, updateSettings, markTutorialCompleted
  };
}