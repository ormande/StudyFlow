import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Subject, StudyLog, UserStats } from '../types';
import { useToast } from '../contexts/ToastContext';

// ✅ FUNÇÃO DE VALIDAÇÃO - Garante que números nunca sejam negativos
const sanitizeNumber = (value: number | undefined | null, defaultValue = 0): number => {
  if (value === undefined || value === null || isNaN(value)) return defaultValue;
  return Math.max(0, Math.floor(value)); // Nunca negativo, sempre inteiro
};

// Constante de paginação
const LOGS_PER_PAGE = 20;

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
  const [hasMoreLogs, setHasMoreLogs] = useState<boolean>(true);
  const [loadingMoreLogs, setLoadingMoreLogs] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [daysFilter, setDaysFilter] = useState<number | null>(30); // Padrão: 30 dias

  // Função auxiliar para enviar mensagem de sincronização
  const broadcastDataUpdate = () => {
    const channel = new BroadcastChannel('studyflow_sync');
    channel.postMessage('DATA_UPDATED');
    channel.close();
  };

  // 1. FUNÇÃO DE CARREGAR DADOS (extraída para useCallback)
  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;
    
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

      // --- CARREGAR LOGS COMPLETOS (Paginação inicial) ---
      // Busca apenas os primeiros 20 registros para carregamento rápido
      // Mais registros podem ser carregados sob demanda via loadMoreLogs
      // eslint-disable-next-line react-hooks/exhaustive-deps
      await fetchLogs(0, LOGS_PER_PAGE, '', daysFilter);

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
  }, [session?.user?.id, daysFilter, addToast]);

  // 2. CARREGAR DADOS INICIAIS
  useEffect(() => {
    if (!session?.user?.id) return;
    fetchData();
  }, [session?.user?.id, fetchData]);

  // 3. CONFIGURAR BROADCASTCHANNEL PARA SINCRONIZAÇÃO ENTRE ABAS
  useEffect(() => {
    const channel = new BroadcastChannel('studyflow_sync');
    
    channel.onmessage = (event) => {
      if (event.data === 'DATA_UPDATED') {
        fetchData(); // Recarrega dados silenciosamente
      }
    };

    return () => channel.close();
  }, [fetchData]);

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
      
      // Sincronizar com outras abas
      broadcastDataUpdate();
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
      
      // Sincronizar com outras abas
      broadcastDataUpdate();
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
      
      // Sincronizar com outras abas
      broadcastDataUpdate();
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
      
      // Sincronizar com outras abas
      broadcastDataUpdate();
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
      setLogs([newLocalLog, ...logs]); // Adiciona novo log no início da lista

      // Atualiza estatísticas após adicionar log
      const { data: updatedStats } = await supabase.rpc('get_user_stats', {
        p_user_id: session.user.id
      });
      if (updatedStats) {
        setStats(updatedStats as UserStats);
      }
      
      // Sincronizar com outras abas
      broadcastDataUpdate();
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
      
      // Sincronizar com outras abas
      broadcastDataUpdate();
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
      
      // Sincronizar com outras abas
      broadcastDataUpdate();
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
      
      // Sincronizar com outras abas
      broadcastDataUpdate();
    } catch (error: any) {
      console.error(error);
      addToast('Erro ao atualizar configurações. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
    }
  };

  // Função específica para marcar tutorial como completo
  const markTutorialCompleted = async () => {
    await updateSettings({ tutorialCompleted: true });
  };

  // Função auxiliar para calcular data de corte baseada em dias
  const getDateCutoff = (days: number | null): string | null => {
    if (days === null) return null;
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    const year = cutoffDate.getFullYear();
    const month = String(cutoffDate.getMonth() + 1).padStart(2, '0');
    const day = String(cutoffDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Função central para buscar logs (com suporte a busca, paginação e filtro de data)
  const fetchLogs = async (offset: number, limit: number, term: string, days: number | null = null) => {
    if (!session?.user?.id) return;

    const dateCutoff = getDateCutoff(days);

    try {
      // CENÁRIO A: Com busca (searchTerm existe)
      if (term && term.trim()) {
        const searchTerm = term.trim();
        const allResults: any[] = [];
        
        // 1. Buscar logs onde notes contém o termo
        let queryNotes = supabase
          .from('study_logs')
          .select('*, subjects(name, color), subtopics(name)')
          .eq('user_id', session.user.id)
          .ilike('notes', `%${searchTerm}%`);
        
        if (dateCutoff) {
          queryNotes = queryNotes.gte('date', dateCutoff);
        }
        
        const { data: logsByNotes } = await queryNotes
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (logsByNotes) allResults.push(...logsByNotes);

        // 2. Buscar subjects que correspondem ao termo
        const { data: matchingSubjects } = await supabase
          .from('subjects')
          .select('id')
          .eq('user_id', session.user.id)
          .ilike('name', `%${searchTerm}%`);

        const subjectIds = matchingSubjects?.map(s => s.id) || [];

        // 3. Buscar logs por subject_id
        if (subjectIds.length > 0) {
          let querySubject = supabase
            .from('study_logs')
            .select('*, subjects(name, color), subtopics(name)')
            .eq('user_id', session.user.id)
            .in('subject_id', subjectIds);
          
          if (dateCutoff) {
            querySubject = querySubject.gte('date', dateCutoff);
          }
          
          const { data: logsBySubject } = await querySubject
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(100);
          
          if (logsBySubject) allResults.push(...logsBySubject);
        }

        // 4. Buscar subtopics que correspondem ao termo
        const { data: matchingSubtopics } = await supabase
          .from('subtopics')
          .select('id')
          .ilike('name', `%${searchTerm}%`);

        const subtopicIds = matchingSubtopics?.map(s => s.id) || [];

        // 5. Buscar logs por subtopic_id
        if (subtopicIds.length > 0) {
          let querySubtopic = supabase
            .from('study_logs')
            .select('*, subjects(name, color), subtopics(name)')
            .eq('user_id', session.user.id)
            .in('subtopic_id', subtopicIds);
          
          if (dateCutoff) {
            querySubtopic = querySubtopic.gte('date', dateCutoff);
          }
          
          const { data: logsBySubtopic } = await querySubtopic
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(100);
          
          if (logsBySubtopic) allResults.push(...logsBySubtopic);
        }

        // Remover duplicatas e ordenar
        const uniqueResults = Array.from(
          new Map(allResults.map(item => [item.id, item])).values()
        ).sort((a, b) => {
          const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateCompare !== 0) return dateCompare;
          return b.timestamp - a.timestamp;
        }).slice(0, 100);

        // TRADUÇÃO DO BANCO PARA O APP
        const mappedLogs = uniqueResults.map((l: any) => ({
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
          subject: l.subjects?.name,
          subtopic: l.subtopics?.name,
        }));

        setLogs(mappedLogs);
        setHasMoreLogs(false);
        return;
      }

      // CENÁRIO B: Navegação normal (sem busca)
      let queryNormal = supabase
        .from('study_logs')
        .select('*, subjects(name, color), subtopics(name)')
        .eq('user_id', session.user.id);
      
      if (dateCutoff) {
        queryNormal = queryNormal.gte('date', dateCutoff);
      }
      
      const { data: logData, error: logError } = await queryNormal
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (logError) {
        console.error('Erro ao buscar logs:', logError);
        addToast('Erro ao buscar registros. Detalhe: ' + logError.message, 'error');
        return;
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
        subject: l.subjects?.name,
        subtopic: l.subtopics?.name,
      }));

      // Atualizar estado baseado no offset
      if (offset === 0) {
        // Substituir logs (carregamento inicial)
        setLogs(mappedLogs);
      } else {
        // Adicionar ao final (paginação)
        setLogs(prev => [...prev, ...mappedLogs]);
      }

      // Atualizar hasMoreLogs
      setHasMoreLogs(mappedLogs.length === limit);
    } catch (error: any) {
      console.error('Erro ao buscar logs:', error);
      addToast('Erro ao buscar registros. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
    }
  };

  // Função para carregar mais logs (paginação)
  const loadMoreLogs = async () => {
    if (!session?.user?.id || loadingMoreLogs || !hasMoreLogs || searchTerm.trim()) return;
    
    setLoadingMoreLogs(true);
    try {
      await fetchLogs(logs.length, LOGS_PER_PAGE, '', daysFilter);
    } finally {
      setLoadingMoreLogs(false);
    }
  };

  // Função para buscar logs (server-side) - estabilizada com useCallback
  const searchLogs = useCallback(async (term: string) => {
    // Evitar chamadas desnecessárias quando o termo não mudou
    if (searchTerm === term.trim()) return;
    
    setSearchTerm(term.trim());
    setLoadingMoreLogs(true);
    try {
      await fetchLogs(0, 100, term.trim(), daysFilter); // Busca retorna até 100 resultados
    } finally {
      setLoadingMoreLogs(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, daysFilter]);

  // Função para aplicar filtro de dias (estabilizada com useCallback)
  const applyDaysFilter = useCallback(async (days: number | null) => {
    if (daysFilter === days) return; // Evitar chamadas duplicadas
    setDaysFilter(days);
    setLoadingMoreLogs(true);
    try {
      await fetchLogs(0, LOGS_PER_PAGE, searchTerm, days);
    } finally {
      setLoadingMoreLogs(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysFilter, searchTerm]);

  return {
    subjects, logs, stats, allLogDates, cycleStartDate, dailyGoal, showPerformance, tutorialCompleted, loadingData,
    hasMoreLogs, loadingMoreLogs, loadMoreLogs, searchLogs, searchTerm,
    daysFilter, applyDaysFilter,
    addSubject, deleteSubject, updateSubject, reorderSubjects,
    addLog, deleteLog, editLog, updateSettings, markTutorialCompleted
  };
}