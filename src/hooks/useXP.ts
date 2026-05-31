import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StudyLog } from '../types';
import { Elo, XPHistoryEntry, calculateXPProgress, getEloByXP } from '../types/elo';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface UseXPProps {
  logs: StudyLog[];
  userId?: string;
  /** Aguarda matérias/logs carregarem antes de marcar registros existentes como processados */
  logsReady?: boolean;
}

interface XpEventRow {
  id: string;
  amount: number;
  reason: string;
  icon: string | null;
  is_bonus: boolean | null;
  created_at: string;
}

// Função helper exportada para calcular XP de um log
// REGRAS OFICIAIS DE XP:
// - 1 minuto estudado = 1 XP
// - 1 questão correta = 5 XP
// - 1 página lida = 2 XP
export function calculateXPFromLog(log: StudyLog): number {
  // XP por tempo de estudo (1 XP por minuto)
  const totalMinutes = (log.hours || 0) * 60 + (log.minutes || 0) + ((log.seconds || 0) / 60);
  const xpFromTime = Math.floor(totalMinutes);
  
  // XP por questões corretas (5 XP por questão correta)
  const xpFromQuestions = (log.correct || 0) * 5;
  
  // XP por páginas lidas (2 XP por página)
  const xpFromPages = (log.pages || 0) * 2;
  
  // Somar todos os tipos de XP
  return xpFromTime + xpFromQuestions + xpFromPages;
}

export function useXP({ logs, userId, logsReady = true }: UseXPProps) {
  const { addToast } = useToast();
  const [totalXP, setTotalXP] = useState<number>(0);
  const [xpHistory, setXpHistory] = useState<XPHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previousElo, setPreviousElo] = useState<Elo | null>(null);
  
  // Rastrear logs já processados para evitar duplicação de XP
  const processedLogsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef<boolean>(false);
  const logsRef = useRef(logs);
  logsRef.current = logs;

  const getProcessedLogsStorageKey = useCallback(
    () => `studyflow_processed_logs_${userId || "anon"}`,
    [userId]
  );

  const markExistingLogsAsProcessed = useCallback(() => {
    logsRef.current.forEach((log) => {
      if (log.id) {
        processedLogsRef.current.add(log.id);
      }
    });

    try {
      sessionStorage.setItem(
        getProcessedLogsStorageKey(),
        JSON.stringify(Array.from(processedLogsRef.current))
      );
    } catch {
      // Ignorar erro de quota/sessionStorage
    }
  }, [getProcessedLogsStorageKey]);

  // Calcular XP baseado nos logs
  // REGRAS OFICIAIS: 1 XP/minuto + 5 XP/questão correta + 2 XP/página
  const calculateXPFromLogs = useCallback((studyLogs: StudyLog[]): number => {
    let xp = 0;

    studyLogs.forEach(log => {
      // XP por tempo de estudo (1 XP por minuto - todos os tipos)
      const totalMinutes = (log.hours || 0) * 60 + (log.minutes || 0) + ((log.seconds || 0) / 60);
      xp += Math.floor(totalMinutes);

      // XP por questão correta (5 XP por questão correta)
      if (log.correct) {
        xp += log.correct * 5;
      }

      // XP por página lida (2 XP por página)
      if (log.pages) {
        xp += log.pages * 2;
      }
    });

    return xp;
  }, []);

  // Carregar XP do Supabase ou localStorage (não reexecutar quando logs mudam)
  const loadXP = useCallback(async () => {
    initialLoadDoneRef.current = false;
    setIsLoading(true);

    processedLogsRef.current = new Set();

    // Carregar logs já processados do sessionStorage (por usuário)
    try {
      const savedProcessed = sessionStorage.getItem(getProcessedLogsStorageKey());
      if (savedProcessed) {
        processedLogsRef.current = new Set(JSON.parse(savedProcessed));
      }
    } catch {
      // Ignorar erro
    }

    const currentLogs = logsRef.current;

    if (!userId) {
      // Fallback para localStorage
      const saved = localStorage.getItem('studyflow_total_xp');
      const savedHistory = localStorage.getItem('studyflow_xp_history');
      
      if (saved) {
        setTotalXP(parseInt(saved, 10));
      } else {
        const initialXP = calculateXPFromLogs(currentLogs);
        setTotalXP(initialXP);
        localStorage.setItem('studyflow_total_xp', initialXP.toString());
      }

      if (savedHistory) {
        try {
          setXpHistory(JSON.parse(savedHistory));
        } catch {
          setXpHistory([]);
        }
      }

      markExistingLogsAsProcessed();
      setIsLoading(false);
      initialLoadDoneRef.current = true;
      return;
    }

    try {
      const { data: userXpRow, error: userXpError } = await supabase
        .from('user_xp')
        .select('total_xp')
        .eq('user_id', userId)
        .maybeSingle();

      if (userXpError) {
        const isExpectedError =
          userXpError.code === 'PGRST116' ||
          userXpError.code === 'PGRST205' ||
          userXpError.code === 'PGRST301' ||
          userXpError.message?.toLowerCase().includes('not found') ||
          userXpError.message?.toLowerCase().includes('could not find the table');

        if (!isExpectedError) {
          console.error('Erro ao carregar XP do Supabase:', userXpError);
        }
      }

      // Histórico recente (UI) + soma total (fonte de verdade quando há eventos)
      let resolvedTotalXP = userXpRow?.total_xp ?? calculateXPFromLogs(currentLogs);

      try {
        const { data: amountRows, error: amountError } = await supabase
          .from('xp_events')
          .select('amount')
          .eq('user_id', userId);

        if (!amountError && amountRows && amountRows.length > 0) {
          resolvedTotalXP = amountRows.reduce(
            (sum, row) => sum + (row.amount || 0),
            0
          );

          // Reconciliar user_xp com a soma real dos eventos
          if (userXpRow?.total_xp !== resolvedTotalXP) {
            await supabase.from('user_xp').upsert(
              {
                user_id: userId,
                total_xp: resolvedTotalXP,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );
          }
        }
      } catch {
        // Se falhar a soma, mantém user_xp ou cálculo dos logs
      }

      setTotalXP(resolvedTotalXP);

      try {
        const { data: events, error: eventsError } = await supabase
          .from('xp_events')
          .select('id, amount, reason, icon, is_bonus, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
          .returns<XpEventRow[]>();

        if (eventsError) {
          const isExpectedEventsError =
            eventsError.code === 'PGRST205' ||
            eventsError.code === 'PGRST116' ||
            eventsError.message?.toLowerCase().includes('could not find the table');
          if (!isExpectedEventsError) {
            console.error('Erro ao carregar xp_events:', eventsError);
          }
        } else if (events) {
          const mapped = events.map((e) => ({
            id: e.id,
            date: new Date(e.created_at).getTime(),
            amount: e.amount,
            reason: e.reason,
            icon: e.icon ?? '',
            isBonus: e.is_bonus ?? false,
          }));
          setXpHistory(mapped);
        }
      } catch {
        // Silencioso: mantém xpHistory atual
      }
    } catch (error: any) {
      // Erros esperados (não críticos):
      // - PGRST116: registro não encontrado
      // - PGRST205: tabela não existe no banco
      // - PGRST301: múltiplos resultados
      const isExpectedError = error?.code === 'PGRST116' || 
                             error?.code === 'PGRST205' || 
                             error?.code === 'PGRST301' ||
                             error?.message?.toLowerCase().includes('404') || 
                             error?.message?.toLowerCase().includes('not found') ||
                             error?.message?.toLowerCase().includes('could not find the table') ||
                             error?.message?.toLowerCase().includes('no rows');
      
      if (!isExpectedError) {
        console.error('Erro ao carregar XP:', error);
      }

      const initialXP = calculateXPFromLogs(currentLogs);
      setTotalXP(initialXP);
    }

    // Registros já existentes não devem gerar XP de novo
    markExistingLogsAsProcessed();
    setIsLoading(false);
    initialLoadDoneRef.current = true;
  }, [userId, calculateXPFromLogs, getProcessedLogsStorageKey, markExistingLogsAsProcessed]);

  // Salvar XP no Supabase ou localStorage
  const saveXP = useCallback(async (xp: number, history: XPHistoryEntry[]) => {
    if (!userId) {
      localStorage.setItem('studyflow_total_xp', xp.toString());
      localStorage.setItem('studyflow_xp_history', JSON.stringify(history));
      return;
    }

    try {
      const { error } = await supabase
        .from('user_xp')
        .upsert({
          user_id: userId,
          total_xp: xp,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar XP:', error);
      // Fallback para localStorage
      localStorage.setItem('studyflow_total_xp', xp.toString());
      localStorage.setItem('studyflow_xp_history', JSON.stringify(history));
    }
  }, [userId]);

  // Adicionar XP
  const addXP = useCallback((amount: number, reason: string, icon: string, isBonus: boolean = false) => {
    if (userId) {
      // Fire-and-forget: registra evento (append-only). Mantém UX responsiva.
      (async () => {
        try {
          await supabase.from('xp_events').insert({
            user_id: userId,
            amount,
            reason,
            icon,
            is_bonus: isBonus,
          });
        } catch (e) {
          // Silencioso: a UI já atualizou localmente
        }
      })();
    }

    setTotalXP(prev => {
      const newTotal = prev + amount;
      
      // Detectar mudança de elo (será tratado na EloPage via useEffect)

      // Adicionar ao histórico
      const newEntry: XPHistoryEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        date: Date.now(),
        amount,
        reason,
        icon,
        isBonus,
      };

      setXpHistory(prevHistory => {
        const updated = [newEntry, ...prevHistory].slice(0, 50); // Manter últimos 50
        saveXP(newTotal, updated);
        return updated;
      });

      return newTotal;
    });
  }, [saveXP, userId]);

  // Remover XP
  const removeXP = useCallback((amount: number, reason: string) => {
    if (userId && amount > 0) {
      (async () => {
        try {
          await supabase.from('xp_events').insert({
            user_id: userId,
            amount: -amount,
            reason,
            icon: '',
            is_bonus: false,
          });
        } catch {
          // Silencioso
        }
      })();
    }

    setTotalXP(prev => {
      // Não deixar XP ficar negativo
      const newTotal = Math.max(0, prev - amount);
      
      // Adicionar ao histórico com valor negativo
      const newEntry: XPHistoryEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        date: Date.now(),
        amount: -amount, // Valor negativo para indicar remoção
        reason,
        icon: '',
        isBonus: false,
      };

      setXpHistory(prevHistory => {
        const updated = [newEntry, ...prevHistory].slice(0, 50); // Manter últimos 50
        saveXP(newTotal, updated);
        return updated;
      });

      // Mostrar toast de aviso
      if (amount > 0) {
        addToast(`XP removido: -${amount}`, 'warning');
      }

      return newTotal;
    });
  }, [saveXP, addToast, userId]);

  // Carregar XP inicial — só após logs do servidor estarem prontos (evita marcar log novo como "já processado")
  useEffect(() => {
    if (userId && !logsReady) {
      initialLoadDoneRef.current = false;
      setIsLoading(true);
      return;
    }

    void loadXP();
  }, [userId, logsReady, loadXP]);

  // Adicionar XP automaticamente para logs novos
  useEffect(() => {
    if (isLoading || !initialLoadDoneRef.current) return;
    if (!addXP) return; // addXP ainda não está disponível

    // Usar um Set para rastrear logs processados nesta execução (evita processar o mesmo log múltiplas vezes)
    const processingInThisRun = new Set<string>();
    const logsToProcess = logs.filter(log => {
      if (!log.id) return false;
      if (processedLogsRef.current.has(log.id)) return false;
      if (processingInThisRun.has(log.id)) return false; // Evita processar o mesmo log na mesma execução
      processingInThisRun.add(log.id);
      return true;
    });

    logsToProcess.forEach(log => {
      // Validar log
      if (!log.id) return;
      
      // Verificar se já foi processado (dupla verificação)
      if (processedLogsRef.current.has(log.id)) {
        return;
      }

      let xpToAdd = 0;
      let reason = '';
      let icon = '';

      // XP por tempo de estudo (1 XP por minuto)
      const totalMinutes = (log.hours || 0) * 60 + (log.minutes || 0) + ((log.seconds || 0) / 60);
      const xpFromTime = Math.floor(totalMinutes);
      
      // XP por questões corretas (5 XP por questão correta)
      const xpFromQuestions = (log.correct || 0) * 5;
      
      // XP por páginas lidas (2 XP por página)
      const xpFromPages = (log.pages || 0) * 2;
      
      // Somar todos os tipos de XP
      xpToAdd = xpFromTime + xpFromQuestions + xpFromPages;
      
      if (xpToAdd > 0) {
        const parts = [];
        if (xpFromTime > 0) {
          const mins = Math.floor(totalMinutes);
          if (mins >= 60) {
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            parts.push(m > 0 ? `${h}h${m}min` : `${h}h`);
          } else {
            parts.push(`${mins}min`);
          }
        }
        if (xpFromPages > 0) {
          parts.push(`${log.pages} páginas`);
        }
        if (xpFromQuestions > 0) {
          parts.push(`${log.correct} questões corretas`);
        }
        
        // Determinar ícone e motivo baseado no tipo principal
        if (log.type === 'teoria') {
          reason = parts.length > 0 
            ? `Estudo de teoria - ${parts.join(', ')}`
            : 'Estudo de teoria';
          icon = '';
        } else if (log.type === 'questoes') {
          reason = parts.length > 0 
            ? `Questões - ${parts.join(', ')}`
            : 'Questões';
          icon = '';
        } else {
          reason = parts.length > 0 
            ? `Estudo - ${parts.join(', ')}`
            : 'Estudo';
          icon = '';
        }
      }

      // Adicionar XP se houver
      if (xpToAdd > 0) {
        addXP(xpToAdd, reason, icon, false);
        processedLogsRef.current.add(log.id);
        
        // Persistir no sessionStorage
        try {
          sessionStorage.setItem(
            getProcessedLogsStorageKey(),
            JSON.stringify(Array.from(processedLogsRef.current))
          );
        } catch {
          // Ignorar erro de sessionStorage
        }
      } else {
        // Mesmo sem XP, marcar como processado para não verificar novamente
        processedLogsRef.current.add(log.id);
        try {
          sessionStorage.setItem(
            getProcessedLogsStorageKey(),
            JSON.stringify(Array.from(processedLogsRef.current))
          );
        } catch {
          // Ignorar erro
        }
      }
    });
  }, [logs, isLoading, addXP, getProcessedLogsStorageKey]);

  // Calcular progresso atual
  const progress = useMemo(() => {
    return calculateXPProgress(totalXP);
  }, [totalXP]);

  // Detectar mudança de elo
  useEffect(() => {
    if (isLoading) return;

    const currentElo = getEloByXP(totalXP);
    
    if (previousElo && previousElo.id !== currentElo.id) {
      // Elo mudou, mas a animação será disparada pelo onEloUpgrade
      setPreviousElo(currentElo);
    } else if (!previousElo) {
      setPreviousElo(currentElo);
    }
  }, [totalXP, isLoading, previousElo]);

  return {
    totalXP,
    xpHistory,
    progress,
    isLoading,
    addXP,
    removeXP,
    refreshXP: loadXP,
  };
}
