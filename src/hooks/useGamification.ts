import { useMemo } from 'react';
import { StudyLog } from '../types';
import { Anchor, Shield, Gem, Crown, Trophy, Flame, Moon, Sun, Dumbbell, Crosshair, Skull } from 'lucide-react';

export interface EloLevel {
  name: string;
  minXP: number;
  maxXP: number;
  color: string;
  icon: typeof Anchor;
  tier?: number; // 1-3 para subdivisões dentro do elo
}

// Definição dos Elos e seus intervalos de XP
export const ELO_LEVELS: EloLevel[] = [
  { name: 'Ferro', minXP: 0, maxXP: 500, color: '#78716c', icon: Anchor },
  { name: 'Bronze', minXP: 500, maxXP: 1500, color: '#a16207', icon: Shield },
  { name: 'Prata', minXP: 1500, maxXP: 3000, color: '#6b7280', icon: Shield },
  { name: 'Ouro', minXP: 3000, maxXP: 6000, color: '#eab308', icon: Shield },
  { name: 'Platina', minXP: 6000, maxXP: 12000, color: '#06b6d4', icon: Gem },
  { name: 'Diamante', minXP: 12000, maxXP: 25000, color: '#3b82f6', icon: Gem },
  { name: 'Mestre', minXP: 25000, maxXP: 50000, color: '#a855f7', icon: Crown },
  { name: 'Lenda', minXP: 50000, maxXP: Infinity, color: '#f59e0b', icon: Trophy },
];

export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: typeof Anchor;
  unlocked: boolean;
}

export interface GamificationData {
  level: EloLevel & { tier: number; displayName: string };
  nextLevel: EloLevel | null;
  progress: number; // 0-100
  totalXP: number;
  xpToNext: number;
  currentLevelXP: number; // XP dentro do nível atual
  badges: Badge[];
}

export function useGamification(logs: StudyLog[], streak: number = 0): GamificationData {
  return useMemo(() => {
    // Calcular XP total
    let totalXP = 0;

    logs.forEach((log) => {
      // 1 minuto de estudo = 1 XP
      const minutes = (log.hours || 0) * 60 + (log.minutes || 0) + ((log.seconds || 0) / 60);
      totalXP += Math.floor(minutes);

      // 1 questão registrada = 2 XP
      const totalQuestions = (log.correct || 0) + (log.wrong || 0) + (log.blank || 0);
      totalXP += totalQuestions * 2;

      // 1 questão correta = 5 XP extras
      totalXP += (log.correct || 0) * 5;
    });

    // Calcular Badges
    const badges: Badge[] = [
      {
        id: 'unbreakable',
        name: 'Inquebrável',
        desc: 'Mantenha uma sequência de 7 dias estudando',
        icon: Flame,
        unlocked: streak >= 7,
      },
      {
        id: 'owl',
        name: 'Coruja',
        desc: 'Estude entre 23:00 e 04:00',
        icon: Moon,
        unlocked: logs.some((log) => {
          const date = new Date(log.timestamp);
          const hour = date.getHours();
          return hour >= 23 || hour < 4;
        }),
      },
      {
        id: 'dawn',
        name: 'Alvorada',
        desc: 'Estude entre 04:00 e 06:00',
        icon: Sun,
        unlocked: logs.some((log) => {
          const date = new Date(log.timestamp);
          const hour = date.getHours();
          return hour >= 4 && hour < 6;
        }),
      },
      {
        id: 'marathon',
        name: 'Maratonista',
        desc: 'Estude mais de 4 horas em um único dia',
        icon: Dumbbell,
        unlocked: (() => {
          const dailyHours: { [key: string]: number } = {};
          logs.forEach((log) => {
            const dateKey = log.date;
            if (!dailyHours[dateKey]) dailyHours[dateKey] = 0;
            dailyHours[dateKey] += log.hours + log.minutes / 60 + (log.seconds || 0) / 3600;
          });
          return Object.values(dailyHours).some((hours) => hours > 4);
        })(),
      },
      {
        id: 'sniper',
        name: 'Sniper',
        desc: 'Acertou 100% em uma sessão com pelo menos 10 questões',
        icon: Crosshair,
        unlocked: logs.some((log) => {
          if (log.type !== 'questoes') return false;
          const totalQuestions = (log.correct || 0) + (log.wrong || 0) + (log.blank || 0);
          if (totalQuestions < 10) return false;
          return (log.correct || 0) === totalQuestions && totalQuestions > 0;
        }),
      },
      {
        id: 'skull',
        name: 'Caveira',
        desc: 'Estude no fim de semana (Sábado ou Domingo)',
        icon: Skull,
        unlocked: logs.some((log) => {
          const date = new Date(log.timestamp);
          const dayOfWeek = date.getDay();
          return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Domingo, 6 = Sábado
        }),
      },
    ];

    // Encontrar o nível atual
    let currentLevel: EloLevel | null = null;
    let nextLevel: EloLevel | null = null;

    for (let i = 0; i < ELO_LEVELS.length; i++) {
      const level = ELO_LEVELS[i];
      if (totalXP >= level.minXP && totalXP < level.maxXP) {
        currentLevel = level;
        nextLevel = i < ELO_LEVELS.length - 1 ? ELO_LEVELS[i + 1] : null;
        break;
      }
    }

    // Se não encontrou (XP muito alto), está no último nível
    if (!currentLevel) {
      currentLevel = ELO_LEVELS[ELO_LEVELS.length - 1];
      nextLevel = null;
    }

    // Calcular tier (subdivisão dentro do elo: 1, 2 ou 3)
    const xpInLevel = totalXP - currentLevel.minXP;
    let tier = 1;
    if (currentLevel.maxXP === Infinity) {
      // Para o último nível (Lenda), usar incrementos de 10000 XP por tier
      tier = Math.min(3, Math.floor(xpInLevel / 10000) + 1);
    } else {
      const levelRange = currentLevel.maxXP - currentLevel.minXP;
      tier = Math.min(3, Math.floor((xpInLevel / levelRange) * 3) + 1);
    }

    // Calcular progresso para o próximo nível
    let progress = 0;
    let xpToNext = 0;
    let currentLevelXP = xpInLevel;

    if (nextLevel) {
      xpToNext = nextLevel.minXP - totalXP;
      const xpNeeded = nextLevel.minXP - currentLevel.minXP;
      progress = Math.min(100, Math.max(0, (xpInLevel / xpNeeded) * 100));
    } else {
      // Último nível - progresso baseado em incrementos de 10000 XP
      const xpBeyondMax = totalXP - currentLevel.minXP;
      const increment = 10000;
      progress = Math.min(100, (xpBeyondMax % increment) / increment * 100);
      xpToNext = increment - (xpBeyondMax % increment);
    }

    const displayName = tier > 1 ? `${currentLevel.name} ${tier}` : currentLevel.name;

    return {
      level: {
        ...currentLevel,
        tier,
        displayName,
      },
      nextLevel,
      progress,
      totalXP,
      xpToNext,
      currentLevelXP,
      badges,
    };
  }, [logs, streak]);
}
