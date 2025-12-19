import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StudyLog } from '../types';
import { Elo, XPHistoryEntry, calculateXPProgress, getEloByXP } from '../types/elo';
import { supabase } from '../lib/supabase';

interface UseXPProps {
  logs: StudyLog[];
  userId?: string;
}

export function useXP({ logs, userId }: UseXPProps) {
  const [totalXP, setTotalXP] = useState<number>(0);
  const [xpHistory, setXpHistory] = useState<XPHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previousElo, setPreviousElo] = useState<Elo | null>(null);
  
  // Rastrear logs já processados para evitar duplicação de XP
  const processedLogsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef<boolean>(false);

  // Calcular XP baseado nos logs
  const calculateXPFromLogs = useCallback((studyLogs: StudyLog[]): number => {
    let xp = 0;

    studyLogs.forEach(log => {
      // XP por hora de estudo (TODOS os tipos: teoria, questoes, revisao)
      const hours = (log.hours || 0) + ((log.minutes || 0) / 60) + ((log.seconds || 0) / 3600);
      const xpFromHours = Math.floor(hours * 10);
      xp += xpFromHours;

      // XP por questão correta (qualquer tipo pode ter questões)
      if (log.correct) {
        const xpGained = log.correct * 5;
        xp += xpGained;
      }

      // XP por página lida (qualquer tipo pode ter páginas)
      if (log.pages) {
        const xpGained = log.pages * 2;
        xp += xpGained;
      }
    });

    return xp;
  }, []);

  // Carregar XP do Supabase ou localStorage
  const loadXP = useCallback(async () => {
    // Carregar logs processados do sessionStorage
    try {
      const savedProcessed = sessionStorage.getItem('studyflow_processed_logs');
      if (savedProcessed) {
        processedLogsRef.current = new Set(JSON.parse(savedProcessed));
      }
    } catch (e) {
      // Ignorar erro
    }

    if (!userId) {
      // Fallback para localStorage
      const saved = localStorage.getItem('studyflow_total_xp');
      const savedHistory = localStorage.getItem('studyflow_xp_history');
      
      if (saved) {
        setTotalXP(parseInt(saved, 10));
      } else {
        // Calcular XP inicial dos logs
        const initialXP = calculateXPFromLogs(logs);
        setTotalXP(initialXP);
        localStorage.setItem('studyflow_total_xp', initialXP.toString());
      }

      if (savedHistory) {
        try {
          setXpHistory(JSON.parse(savedHistory));
        } catch (e) {
          setXpHistory([]);
        }
      }

      // Marcar todos os logs existentes como processados
      logs.forEach(log => {
        if (log.id) {
          processedLogsRef.current.add(log.id);
        }
      });
      sessionStorage.setItem('studyflow_processed_logs', JSON.stringify(Array.from(processedLogsRef.current)));

      setIsLoading(false);
      initialLoadDoneRef.current = true;
      return;
    }

    try {
      // Tentar carregar do Supabase (maybeSingle não gera erro 404 se não encontrar)
      const { data, error } = await supabase
        .from('user_xp')
        .select('total_xp, xp_history')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        // Erros esperados (não críticos):
        // - PGRST116: registro não encontrado (maybeSingle retorna null, mas pode ter error)
        // - PGRST205: tabela não existe no banco (tabela ainda não foi criada)
        // - PGRST301: múltiplos resultados (não deveria acontecer com maybeSingle)
        const isExpectedError = error.code === 'PGRST116' || 
                               error.code === 'PGRST205' || 
                               error.code === 'PGRST301' ||
                               error.message?.toLowerCase().includes('404') ||
                               error.message?.toLowerCase().includes('not found') ||
                               error.message?.toLowerCase().includes('could not find the table');
        
        // Só logar erros reais de conexão/permissão
        if (!isExpectedError) {
          console.error('Erro ao carregar XP do Supabase:', error);
        }
        // Para qualquer erro (incluindo "tabela não existe"), usar fallback silenciosamente
        const saved = localStorage.getItem('studyflow_total_xp');
        if (saved) {
          setTotalXP(parseInt(saved, 10));
        } else {
          const initialXP = calculateXPFromLogs(logs);
          setTotalXP(initialXP);
        }
      } else if (data) {
        // Dados encontrados no Supabase
        setTotalXP(data.total_xp || 0);
        if (data.xp_history) {
          setXpHistory(data.xp_history);
        }
      } else {
        // Primeira vez (sem registro no Supabase), calcular dos logs
        const initialXP = calculateXPFromLogs(logs);
        setTotalXP(initialXP);
      }
      
      // Marcar todos os logs existentes como processados
      logs.forEach(log => {
        if (log.id) {
          processedLogsRef.current.add(log.id);
        }
      });
      sessionStorage.setItem('studyflow_processed_logs', JSON.stringify(Array.from(processedLogsRef.current)));
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
        // Erro real (não é apenas "tabela não existe" ou "não encontrado")
        console.error('Erro ao carregar XP:', error);
      }
      
      // Fallback para localStorage
      const saved = localStorage.getItem('studyflow_total_xp');
      if (saved) {
        setTotalXP(parseInt(saved, 10));
      } else {
        const initialXP = calculateXPFromLogs(logs);
        setTotalXP(initialXP);
      }
      
      // Marcar todos os logs existentes como processados
      logs.forEach(log => {
        if (log.id) {
          processedLogsRef.current.add(log.id);
        }
      });
      sessionStorage.setItem('studyflow_processed_logs', JSON.stringify(Array.from(processedLogsRef.current)));
    }

    setIsLoading(false);
    initialLoadDoneRef.current = true;
  }, [userId, logs, calculateXPFromLogs]);

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
          xp_history: history,
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
  }, [saveXP]);

  // Carregar XP inicial
  useEffect(() => {
    loadXP();
  }, [loadXP]);

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

      // XP por hora de teoria E páginas (independente do tipo)
      const hours = (log.hours || 0) + ((log.minutes || 0) / 60) + ((log.seconds || 0) / 3600);
      const xpFromHours = Math.floor(hours * 10);
      const xpFromPages = (log.pages || 0) * 2;
      
      // XP por questões corretas (independente do tipo)
      const xpFromQuestions = (log.correct || 0) * 5;
      
      // Somar TODOS os tipos de XP
      xpToAdd = xpFromHours + xpFromPages + xpFromQuestions;
      
      if (xpToAdd > 0) {
        const parts = [];
        if (xpFromHours > 0) {
          const totalMinutes = Math.floor(hours * 60);
          if (totalMinutes >= 60) {
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            parts.push(m > 0 ? `${h}h${m}min` : `${h}h`);
          } else {
            parts.push(`${totalMinutes}min`);
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
          icon = '📚';
        } else if (log.type === 'questoes') {
          reason = parts.length > 0 
            ? `Questões - ${parts.join(', ')}`
            : 'Questões';
          icon = '✅';
        } else {
          reason = parts.length > 0 
            ? `Estudo - ${parts.join(', ')}`
            : 'Estudo';
          icon = '📖';
        }
      }

      // Adicionar XP se houver
      if (xpToAdd > 0) {
        addXP(xpToAdd, reason, icon, false);
        processedLogsRef.current.add(log.id);
        
        // Persistir no sessionStorage
        try {
          sessionStorage.setItem('studyflow_processed_logs', JSON.stringify(Array.from(processedLogsRef.current)));
        } catch (e) {
          // Ignorar erro de sessionStorage
        }
      } else {
        // Mesmo sem XP, marcar como processado para não verificar novamente
        processedLogsRef.current.add(log.id);
        try {
          sessionStorage.setItem('studyflow_processed_logs', JSON.stringify(Array.from(processedLogsRef.current)));
        } catch (e) {
          // Ignorar erro
        }
      }
    });
  }, [logs, isLoading, addXP]);

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
    refreshXP: loadXP,
  };
}
