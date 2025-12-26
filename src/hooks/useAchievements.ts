import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StudyLog, UserStats } from '../types';
import { ACHIEVEMENTS, UserAchievement, Achievement, AchievementLevel } from '../types/achievements';
import { useToast } from '../contexts/ToastContext';
import confetti from 'canvas-confetti';
import { AchievementToastWithNavigation } from '../components/AchievementToastWithNavigation';
import { supabase } from '../lib/supabase';
import { useXPContext } from '../contexts/XPContext';

interface UseAchievementsProps {
  logs: StudyLog[];
  stats: UserStats | null;
  streak: number;
  dailyGoal: number;
  cycleStartDate: number;
  userCreatedAt?: number; // Timestamp de criação da conta do usuário
  userId?: string; // ID do usuário para Supabase
  onNavigateToAchievements?: () => void; // Callback para navegar para página de conquistas
}

const STORAGE_KEY = 'studyflow_user_achievements';

export function useAchievements({ 
  logs,
  stats,
  streak, 
  dailyGoal, 
  cycleStartDate,
  userCreatedAt,
  userId,
  onNavigateToAchievements 
}: UseAchievementsProps) {
  const { addToast, removeToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  // Tentar obter contexto de XP (pode não estar disponível)
  let addXP: ((amount: number, reason: string, icon: string, isBonus?: boolean) => void) | null = null;
  try {
    const xpContext = useXPContext();
    addXP = xpContext.addXP;
  } catch (e) {
    // Contexto não disponível, continuar sem XP
  }
  
  // Carregar conquistas do Supabase ou localStorage
  const loadAchievements = useCallback(async (): Promise<UserAchievement[]> => {
    // Tentar carregar do Supabase primeiro se tiver userId
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', userId);
        
        if (!error && data) {
          // Converter do formato do banco para o formato do app
          return data.map((item: any) => ({
            achievementId: item.achievement_id,
            level: item.level as 1 | 2 | 3,
            unlockedAt: item.unlocked_at ? new Date(item.unlocked_at).getTime() : 0,
            claimedAt: item.claimed_at ? new Date(item.claimed_at).getTime() : null,
            progress: item.progress || 0
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar conquistas do Supabase:', error);
      }
    }
    
    // Fallback para localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar conquistas do localStorage:', error);
    }
    return [];
  }, [userId]);

  // Salvar conquistas no Supabase e localStorage
  const saveAchievements = useCallback(async (achievements: UserAchievement[]) => {
    // BLOQUEIO: Se estiver em modo de reset, não salvar nada
    if (isResettingRef.current) {
      return;
    }
    
    // Salvar no localStorage sempre
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
    } catch (error) {
      console.error('Erro ao salvar conquistas no localStorage:', error);
    }

    // Salvar no Supabase se tiver userId
    if (userId && achievements.length > 0) {
      try {
        // Usar upsert para atualizar ou inserir conquistas (evita erro de chave duplicada)
        const achievementsToUpsert = achievements.map(ua => ({
          user_id: userId,
          achievement_id: ua.achievementId,
          level: ua.level,
          progress: ua.progress,
          unlocked_at: ua.unlockedAt ? new Date(ua.unlockedAt).toISOString() : null,
          claimed_at: ua.claimedAt ? new Date(ua.claimedAt).toISOString() : null
        }));

        const { error } = await supabase
          .from('user_achievements')
          .upsert(achievementsToUpsert, { 
            onConflict: 'user_id,achievement_id,level',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('Erro ao salvar conquistas no Supabase:', error);
        }
      } catch (error) {
        console.error('Erro ao salvar conquistas no Supabase:', error);
      }
    }
  }, [userId]);

  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  
  // Rastrear conquistas que estão sendo resgatadas no momento (evita duplicação)
  const claimingRef = useRef<Set<string>>(new Set());
  
  // Rastrear toasts já mostrados para evitar duplicação
  const shownToastsRef = useRef<Set<string>>(new Set());
  
  // TRAVAMENTO CRÍTICO: Bloqueia todas as operações durante factory reset
  // Impede que conquistas "ressuscitem" após o reset
  const isResettingRef = useRef(false);

  // Carregar conquistas na inicialização
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    
    loadAchievements().then(achievements => {
      if (mounted) {
        setUserAchievements(achievements);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [loadAchievements]);

  // Salvar sempre que userAchievements mudar (mas não na inicialização)
  useEffect(() => {
    // BLOQUEIO: Se estiver em modo de reset, não salvar nada
    if (isResettingRef.current) return;
    
    // Não salvar durante o carregamento inicial ou se não houver conquistas
    if (isLoading) return;
    
    // Usar um pequeno delay para evitar salvamentos desnecessários durante atualizações rápidas
    const timeoutId = setTimeout(() => {
      saveAchievements(userAchievements);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [userAchievements, saveAchievements, isLoading]);

  // Calcular progresso para uma conquista específica
  const calculateProgress = useCallback((
    achievement: Achievement,
    level: AchievementLevel,
    logs: StudyLog[],
    stats: UserStats | null,
    streak: number,
    dailyGoal: number,
    cycleStartDate: number,
    userCreatedAt?: number
  ): number => {
    switch (achievement.id) {
      // CONSTÂNCIA
      case 'streak-fire':
        return streak;
      
      case 'unbreakable':
        return streak;
      
      case 'machine':
        return streak;
      
      // VOLUME
      case 'marathon': {
        // Usar stats quando disponível (métricas cumulativas)
        if (stats?.total_minutes !== undefined) {
          return Math.floor(stats.total_minutes / 60);
        }
        // Fallback para logs (limitado a 100 itens)
        const totalHours = logs.reduce((sum, log) => {
          const hours = log.hours + (log.minutes / 60) + ((log.seconds || 0) / 3600);
          return sum + hours;
        }, 0);
        return Math.floor(totalHours);
      }
      
      case 'workaholic': {
        // Usar stats quando disponível (métricas cumulativas)
        if (stats?.total_minutes !== undefined) {
          return Math.floor(stats.total_minutes / 60);
        }
        // Fallback para logs (limitado a 100 itens)
        const totalHours = logs.reduce((sum, log) => {
          const hours = log.hours + (log.minutes / 60) + ((log.seconds || 0) / 3600);
          return sum + hours;
        }, 0);
        return Math.floor(totalHours);
      }
      
      case 'eternal-student': {
        // Usar stats quando disponível (métricas cumulativas)
        if (stats?.total_minutes !== undefined) {
          return Math.floor(stats.total_minutes / 60);
        }
        // Fallback para logs (limitado a 100 itens)
        const totalHours = logs.reduce((sum, log) => {
          const hours = log.hours + (log.minutes / 60) + ((log.seconds || 0) / 3600);
          return sum + hours;
        }, 0);
        return Math.floor(totalHours);
      }
      
      // QUESTÕES
      case 'shooter': {
        // Usar stats quando disponível (métricas cumulativas)
        if (stats?.total_correct !== undefined) {
          return stats.total_correct;
        }
        // Fallback para logs (limitado a 100 itens)
        const totalCorrect = logs
          .filter(log => log.type === 'questoes')
          .reduce((sum, log) => sum + (log.correct || 0), 0);
        return totalCorrect;
      }
      
      case 'perfectionist': {
        const perfectSessions = logs.filter(log => {
          if (log.type !== 'questoes') return false;
          const total = (log.correct || 0) + (log.wrong || 0) + (log.blank || 0);
          return total > 0 && (log.correct || 0) === total;
        }).length;
        return perfectSessions;
      }
      
      case 'sniper': {
        // Usar stats quando disponível (métricas cumulativas)
        if (stats?.total_questions !== undefined && stats?.total_correct !== undefined) {
          if (stats.total_questions === 0) return 0;
          const percentage = (stats.total_correct / stats.total_questions) * 100;
          
          // Verificar se tem quantidade mínima de questões
          const minQuestions = level.level === 1 ? 100 : level.level === 2 ? 500 : 1000;
          if (stats.total_questions < minQuestions) return 0;
          
          return Math.floor(percentage);
        }
        // Fallback para logs (limitado a 100 itens)
        const questionLogs = logs.filter(log => log.type === 'questoes');
        if (questionLogs.length === 0) return 0;
        
        const totalQuestions = questionLogs.reduce((sum, log) => 
          sum + (log.correct || 0) + (log.wrong || 0) + (log.blank || 0), 0
        );
        const totalCorrect = questionLogs.reduce((sum, log) => sum + (log.correct || 0), 0);
        
        if (totalQuestions === 0) return 0;
        const percentage = (totalCorrect / totalQuestions) * 100;
        
        // Verificar se tem quantidade mínima de questões
        const minQuestions = level.level === 1 ? 100 : level.level === 2 ? 500 : 1000;
        if (totalQuestions < minQuestions) return 0;
        
        return Math.floor(percentage);
      }
      
      // PÁGINAS
      case 'reader': {
        // Usar stats quando disponível (métricas cumulativas)
        if (stats?.total_pages !== undefined) {
          return stats.total_pages;
        }
        // Fallback para logs (limitado a 100 itens)
        const totalPages = logs
          .filter(log => log.type === 'teoria')
          .reduce((sum, log) => sum + (log.pages || 0), 0);
        return totalPages;
      }
      
      case 'devourer': {
        // Usar stats quando disponível (métricas cumulativas)
        if (stats?.total_pages !== undefined) {
          return stats.total_pages;
        }
        // Fallback para logs (limitado a 100 itens)
        const totalPages = logs
          .filter(log => log.type === 'teoria')
          .reduce((sum, log) => sum + (log.pages || 0), 0);
        return totalPages;
      }
      
      case 'library': {
        // Usar stats quando disponível (métricas cumulativas)
        if (stats?.total_pages !== undefined) {
          return stats.total_pages;
        }
        // Fallback para logs (limitado a 100 itens)
        const totalPages = logs
          .filter(log => log.type === 'teoria')
          .reduce((sum, log) => sum + (log.pages || 0), 0);
        return totalPages;
      }
      
      // DIVERSIDADE
      case 'multitask': {
        const uniqueSubjects = new Set(logs.map(log => log.subjectId));
        return uniqueSubjects.size;
      }
      
      case 'polymath': {
        const uniqueSubjects = new Set(logs.map(log => log.subjectId));
        return uniqueSubjects.size;
      }
      
      case 'renaissance': {
        // Contar dias onde estudou múltiplas matérias
        const dailySubjects: { [date: string]: Set<string> } = {};
        logs.forEach(log => {
          if (!dailySubjects[log.date]) {
            dailySubjects[log.date] = new Set();
          }
          dailySubjects[log.date].add(log.subjectId);
        });
        
        const daysWithMultipleSubjects = Object.values(dailySubjects)
          .filter(subjects => subjects.size >= level.requirement).length;
        
        return daysWithMultipleSubjects;
      }
      
      // HORÁRIOS
      case 'early-bird': {
        const morningLogs = logs.filter(log => {
          const date = new Date(log.timestamp);
          const hour = date.getHours();
          return hour >= 5 && hour < 8;
        });
        const uniqueDays = new Set(morningLogs.map(log => log.date));
        return uniqueDays.size;
      }
      
      case 'night-owl': {
        const nightLogs = logs.filter(log => {
          const date = new Date(log.timestamp);
          const hour = date.getHours();
          return hour >= 22 || hour < 2;
        });
        const uniqueDays = new Set(nightLogs.map(log => log.date));
        return uniqueDays.size;
      }
      
      case 'weekend-warrior': {
        const weekendLogs = logs.filter(log => {
          const date = new Date(log.timestamp);
          const dayOfWeek = date.getDay();
          return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Domingo, 6 = Sábado
        });
        const uniqueWeekends = new Set(weekendLogs.map(log => {
          const date = new Date(log.timestamp);
          // Agrupar por fim de semana (sábado e domingo do mesmo fim de semana)
          const dayOfWeek = date.getDay();
          const daysFromSaturday = dayOfWeek === 0 ? 1 : dayOfWeek === 6 ? 0 : -1;
          if (daysFromSaturday === -1) return null;
          const saturday = new Date(date);
          saturday.setDate(date.getDate() - daysFromSaturday);
          return saturday.toLocaleDateString('pt-BR');
        }));
        return uniqueWeekends.size;
      }
      
      // METAS
      case 'achiever': {
        // Contar dias onde atingiu a meta diária
        const dailyMinutes: { [date: string]: number } = {};
        logs.forEach(log => {
          if (!dailyMinutes[log.date]) {
            dailyMinutes[log.date] = 0;
          }
          dailyMinutes[log.date] += log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60);
        });
        
        const daysAchieved = Object.entries(dailyMinutes)
          .filter(([_, minutes]) => dailyGoal > 0 && minutes >= dailyGoal).length;
        
        return daysAchieved;
      }
      
      case 'over-achiever': {
        const dailyMinutes: { [date: string]: number } = {};
        logs.forEach(log => {
          if (!dailyMinutes[log.date]) {
            dailyMinutes[log.date] = 0;
          }
          dailyMinutes[log.date] += log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60);
        });
        
        const daysOverAchieved = Object.entries(dailyMinutes)
          .filter(([_, minutes]) => dailyGoal > 0 && minutes >= dailyGoal * 1.5).length;
        
        return daysOverAchieved;
      }
      
      case 'overcoming': {
        const dailyMinutes: { [date: string]: number } = {};
        logs.forEach(log => {
          if (!dailyMinutes[log.date]) {
            dailyMinutes[log.date] = 0;
          }
          dailyMinutes[log.date] += log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60);
        });
        
        const daysSuperAchieved = Object.entries(dailyMinutes)
          .filter(([_, minutes]) => dailyGoal > 0 && minutes >= dailyGoal * 2).length;
        
        return daysSuperAchieved;
      }
      
      // MILESTONES
      case 'first-step': {
        // Usar stats quando disponível (métricas cumulativas)
        if (stats?.total_logs !== undefined) {
          return stats.total_logs;
        }
        // Fallback para logs.length (limitado a 100 itens)
        return logs.length;
      }
      
      case 'cycle-master': {
        // Contar ciclos completos baseado em cycleStartDate
        // Um ciclo é considerado completo quando todas as matérias atingem suas metas
        // Por enquanto, conta quantas vezes o ciclo foi reiniciado (mudança de cycleStartDate)
        // Isso é uma aproximação - idealmente deveria contar ciclos realmente completos
        // Para melhorar, precisaríamos rastrear histórico de ciclos completos
        if (!cycleStartDate) return 0;
        
        // Se cycleStartDate é muito antigo (mais de 90 dias), provavelmente já completou pelo menos 1 ciclo
        const daysSinceCycleStart = Math.floor((Date.now() - cycleStartDate) / (1000 * 60 * 60 * 24));
        
        // Por enquanto, retorna 1 se o ciclo atual tem mais de 30 dias
        // Isso pode ser melhorado com histórico de ciclos
        return daysSinceCycleStart >= 30 ? 1 : 0;
      }
      
      case 'veteran': {
        if (!userCreatedAt) return 0;
        const daysSinceCreation = Math.floor((Date.now() - userCreatedAt) / (1000 * 60 * 60 * 24));
        return daysSinceCreation;
      }
      
      default:
        return 0;
    }
  }, []);

  // Função para mostrar toast de conquista desbloqueada com navegação
  const showAchievementUnlockedToast = useCallback((achievement: Achievement, level: number, navigateCallback?: () => void) => {
    const toastId = addToast(
      React.createElement(AchievementToastWithNavigation, { 
        achievement, 
        level, 
        onNavigate: () => {
          if (navigateCallback) {
            navigateCallback();
          }
          removeToast(toastId);
        },
        onDismiss: () => removeToast(toastId)
      }),
      'success',
      8000 // 8 segundos
    );
  }, [addToast, removeToast]);

  // Detectar ofensiva de 7 dias e adicionar XP bônus
  const [lastStreakBonus, setLastStreakBonus] = useState<number>(0);
  useEffect(() => {
    // BLOQUEIO: Se estiver em modo de reset, não processar bônus
    if (isResettingRef.current) return;
    
    if (isLoading || !addXP) return;
    
    // Verificar se streak atingiu 7, 14, 21, etc. (múltiplos de 7)
    if (streak >= 7 && streak > lastStreakBonus) {
      const weeks = Math.floor(streak / 7);
      const lastWeeks = Math.floor(lastStreakBonus / 7);
      
      // Se completou uma nova semana (7, 14, 21, etc.)
      if (weeks > lastWeeks) {
        // Verificar se já foi concedido este bônus
        const bonusKey = `studyflow_streak_bonus_${weeks * 7}`;
        const alreadyAwarded = localStorage.getItem(bonusKey);
        
        if (!alreadyAwarded) {
          addXP(50, `Ofensiva - ${weeks * 7} dias`, '', true);
          localStorage.setItem(bonusKey, Date.now().toString());
          
          // Limpar flags antigas (manter apenas últimos 30 dias)
          try {
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const keysToRemove: string[] = [];
            
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('studyflow_streak_bonus_')) {
                const timestamp = localStorage.getItem(key);
                if (timestamp && parseInt(timestamp) < thirtyDaysAgo) {
                  keysToRemove.push(key);
                }
              }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
          } catch (e) {
            // Ignorar erro de localStorage
          }
        }
        
        setLastStreakBonus(streak);
      }
    } else if (streak < lastStreakBonus) {
      // Se streak diminuiu, resetar
      setLastStreakBonus(streak);
    }
  }, [streak, isLoading, addXP, lastStreakBonus]);

  // Verificar e atualizar conquistas (só executa após carregar dados iniciais)
  useEffect(() => {
    // BLOQUEIO: Se estiver em modo de reset, não verificar nada
    if (isResettingRef.current) return;
    
    if (isLoading) return; // Não verificar enquanto está carregando
    
    const checkAchievements = () => {
      // BLOQUEIO DUPLO: Verificar novamente dentro da função
      if (isResettingRef.current) return;
      setUserAchievements(prevAchievements => {
        // Criar um mapa para acesso rápido
        const achievementsMap = new Map<string, UserAchievement>();
        prevAchievements.forEach(ua => {
          const key = `${ua.achievementId}-${ua.level}`;
          achievementsMap.set(key, ua);
        });

        const updatedAchievements: UserAchievement[] = [];
        let hasNewUnlocks = false;
        const newUnlocks: Array<{ achievement: Achievement; level: number }> = [];

        ACHIEVEMENTS.forEach(achievement => {
          achievement.levels.forEach(level => {
            const progress = calculateProgress(
              achievement,
              level,
              logs,
              stats,
              streak,
              dailyGoal,
              cycleStartDate,
              userCreatedAt
            );
            
            const key = `${achievement.id}-${level.level}`;
            const existing = achievementsMap.get(key);
            
            const isUnlocked = progress >= level.requirement;
            
            if (isUnlocked) {
              if (!existing) {
                // Nova conquista desbloqueada
                const newAchievement: UserAchievement = {
                  achievementId: achievement.id,
                  level: level.level,
                  unlockedAt: Date.now(),
                  claimedAt: null,
                  progress
                };
                updatedAchievements.push(newAchievement);
                hasNewUnlocks = true;
                newUnlocks.push({ achievement, level: level.level });
              } else {
                // Atualizar progresso, mas PRESERVAR TODOS os dados existentes (especialmente claimedAt)
                updatedAchievements.push({
                  ...existing,
                  progress: progress,
                  // CRÍTICO: Preservar claimedAt se já foi resgatada
                  claimedAt: existing.claimedAt,
                  unlockedAt: existing.unlockedAt || Date.now()
                });
              }
            } else {
              // Não desbloqueou ainda, mas preservar se já existe
              if (existing) {
                updatedAchievements.push({
                  ...existing,
                  progress: progress,
                  // Preservar todos os estados anteriores
                  unlockedAt: existing.unlockedAt,
                  claimedAt: existing.claimedAt
                });
              }
            }
          });
        });

        // Mostrar toasts para novas conquistas desbloqueadas
        if (hasNewUnlocks) {
          setTimeout(() => {
            newUnlocks.forEach(({ achievement, level }) => {
              // Criar chave única para esta conquista+nível
              const toastKey = `${achievement.id}-${level}`;
              
              // Verificar se já foi mostrado (evita duplicação)
              if (shownToastsRef.current.has(toastKey)) {
                return; // Já foi mostrado, ignorar
              }
              
              // Marcar como mostrado
              shownToastsRef.current.add(toastKey);
              
              showAchievementUnlockedToast(achievement, level, onNavigateToAchievements);
            });
          }, 100);
        }

        return updatedAchievements;
      });
    };

    checkAchievements();
  }, [logs, stats, streak, dailyGoal, cycleStartDate, userCreatedAt, calculateProgress, showAchievementUnlockedToast, onNavigateToAchievements, isLoading]);

  // Função para disparar confete
  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  // Resgatar conquista
  const claimAchievement = useCallback((achievementId: string, level: number) => {
    // BLOQUEIO: Se estiver em modo de reset, não permitir resgates
    if (isResettingRef.current) return;
    
    // Criar chave única para esta conquista+nível
    const claimKey = `${achievementId}-${level}`;
    
    // Verificar se já está sendo processada OU já foi resgatada (evita duplicação)
    if (claimingRef.current.has(claimKey)) {
      return; // Já está sendo processada, ignorar
    }
    
    // Verificar se já foi resgatada ANTES de marcar como processando
    const alreadyClaimed = userAchievements.some(
      ua => ua.achievementId === achievementId && ua.level === level && ua.claimedAt
    );
    
    if (alreadyClaimed) {
      return; // Já foi resgatada, ignorar
    }
    
    // Marcar como sendo processada ANTES de qualquer operação
    claimingRef.current.add(claimKey);
    
    // Buscar dados da conquista ANTES de atualizar o estado
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    const achievementLevel = achievement?.levels.find(l => l.level === level);
    const xpReward = achievementLevel?.xpReward;
    const rewardReason = achievement && achievementLevel 
      ? `${achievement.name} - ${achievementLevel.label}`
      : '';
    
    // Adicionar XP ANTES de atualizar o estado (garante que só acontece uma vez)
    if (addXP && xpReward && rewardReason) {
      addXP(xpReward, rewardReason, '', true);
    }
    
    setUserAchievements(prev => {
      const updated = prev.map(ua => {
        // Verificar se é a conquista que queremos resgatar
        if (ua.achievementId === achievementId && ua.level === level) {
          // Se já foi resgatada, não fazer nada (dupla verificação)
          if (ua.claimedAt) {
            // Remover da lista de processamento
            claimingRef.current.delete(claimKey);
            return ua;
          }
          // Resgatar agora - garantir que claimedAt seja um número (timestamp)
          const newClaimedAt = Date.now();
          
          return { ...ua, claimedAt: newClaimedAt };
        }
        return ua;
      });
      
      // Remover da lista de processamento APENAS após atualizar o estado
      // Usar setTimeout para garantir que o estado foi atualizado
      setTimeout(() => {
        claimingRef.current.delete(claimKey);
      }, 100);
      
      // Salvar imediatamente após resgatar
      saveAchievements(updated).catch(err => {
        console.error('Erro ao salvar conquista resgatada:', err);
        // Remover da lista de processamento em caso de erro
        claimingRef.current.delete(claimKey);
      });
      
      return updated;
    });
    
    // Disparar confete
    triggerConfetti();
    
    addToast('Conquista resgatada com sucesso!', 'success');
  }, [addToast, triggerConfetti, saveAchievements, addXP, userAchievements]);

  // Obter progresso do usuário para uma conquista
  const getUserProgress = useCallback((achievementId: string): UserAchievement[] => {
    return userAchievements.filter(ua => ua.achievementId === achievementId);
  }, [userAchievements]);

  // Conquistas pendentes (desbloqueadas mas não resgatadas)
  const pendingAchievements = useMemo(() => {
    const pending = userAchievements
      .filter(ua => {
        // Deve ter sido desbloqueada (unlockedAt existe e é > 0)
        // E NÃO deve ter sido resgatada (claimedAt é null, undefined ou 0)
        const isUnlocked = ua.unlockedAt && ua.unlockedAt > 0;
        const isNotClaimed = !ua.claimedAt || ua.claimedAt === null || ua.claimedAt === 0;
        return isUnlocked && isNotClaimed;
      })
      .map(ua => {
        const achievement = ACHIEVEMENTS.find(a => a.id === ua.achievementId);
        if (!achievement) return null;
        return {
          ...achievement,
          level: ua.level,
          unlockedAt: ua.unlockedAt,
          progress: ua.progress
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0));
    
    return pending;
  }, [userAchievements]);

  const pendingCount = pendingAchievements.length;
  const claimedCount = userAchievements.filter(ua => ua.claimedAt !== null).length;
  const totalCount = ACHIEVEMENTS.length * 3; // 24 conquistas * 3 níveis = 72

  // Função para resetar todas as conquistas
  const resetAchievements = useCallback(async () => {
    // ATIVAR TRAVAMENTO: Primeira coisa a fazer - bloqueia todas as operações
    isResettingRef.current = true;
    
    // Resetar estado do React
    setUserAchievements([]);
    
    // Limpar localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
      // Limpar múltiplas vezes para garantir (problemas de cache)
      for (let i = 0; i < 3; i++) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(`_${STORAGE_KEY}`);
        localStorage.removeItem(`${STORAGE_KEY}_`);
      }
    } catch (error) {
      console.error('Erro ao limpar conquistas do localStorage:', error);
    }
    
    // Limpar Supabase se tiver userId
    if (userId) {
      try {
        const { error } = await supabase
          .from('user_achievements')
          .delete()
          .eq('user_id', userId);
        
        if (error && error.code !== 'PGRST116') {
          // PGRST116 = não encontrado, não é erro crítico
          console.error('Erro ao deletar conquistas do Supabase:', error);
        }
      } catch (error) {
        console.error('Erro ao deletar conquistas do Supabase:', error);
      }
    }
    
    // Limpar flags de streak bonus relacionadas
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('studyflow_streak_bonus_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Erro ao limpar flags de streak bonus:', error);
    }
    
    // IMPORTANTE: NÃO resetar isResettingRef.current aqui
    // Ele deve permanecer true até o reload da página
    // Isso garante que nenhum useEffect ou função tente restaurar conquistas
  }, [userId]);

  return {
    userAchievements,
    claimAchievement,
    getUserProgress,
    pendingAchievements,
    pendingCount,
    claimedCount,
    totalCount,
    resetAchievements
  };
}

