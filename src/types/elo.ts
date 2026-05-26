import { LucideIcon, Shield, Crown, Gem, Sparkles } from 'lucide-react';

export type EloTier = 'bronze' | 'prata' | 'ouro' | 'platina' | 'diamante';

export interface Elo {
  id: EloTier;
  name: string;
  xpRequired: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  progressColor: string;
}

export const ELOS: Elo[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    xpRequired: 0,
    icon: Shield,
    color: 'text-amber-700 dark:text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-700',
    progressColor: 'bg-amber-700',
  },
  {
    id: 'prata',
    name: 'Prata',
    xpRequired: 1000,
    icon: Shield,
    color: 'text-gray-400 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-400',
    progressColor: 'bg-gray-400',
  },
  {
    id: 'ouro',
    name: 'Ouro',
    xpRequired: 5000,
    icon: Crown,
    color: 'text-yellow-500 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-500',
    progressColor: 'bg-yellow-500',
  },
  {
    id: 'platina',
    name: 'Platina',
    xpRequired: 15000,
    icon: Gem,
    color: 'text-purple-500 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-500',
    progressColor: 'bg-purple-500',
  },
  {
    id: 'diamante',
    name: 'Diamante',
    xpRequired: 50000,
    icon: Sparkles,
    color: 'text-cyan-400 dark:text-cyan-300',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-400',
    progressColor: 'bg-cyan-400',
  },
];

export interface XPHistoryEntry {
  id: string;
  date: number;
  amount: number;
  reason: string;
  icon: string;
  isBonus: boolean;
}

export interface XPCalculation {
  totalXP: number;
  currentElo: Elo;
  nextElo: Elo | null;
  progress: number; // 0-100
  xpForNextElo: number;
}

export function getEloByXP(totalXP: number): Elo {
  for (let i = ELOS.length - 1; i >= 0; i--) {
    if (totalXP >= ELOS[i].xpRequired) {
      return ELOS[i];
    }
  }
  return ELOS[0];
}

export function calculateXPProgress(totalXP: number): XPCalculation {
  const currentElo = getEloByXP(totalXP);
  const currentIndex = ELOS.findIndex(e => e.id === currentElo.id);
  const nextElo = currentIndex < ELOS.length - 1 ? ELOS[currentIndex + 1] : null;

  let progress = 0;
  let xpForNextElo = 0;

  if (nextElo) {
    const xpInCurrentTier = totalXP - currentElo.xpRequired;
    const xpNeededForNext = nextElo.xpRequired - currentElo.xpRequired;
    progress = Math.min(100, Math.max(0, (xpInCurrentTier / xpNeededForNext) * 100));
    xpForNextElo = nextElo.xpRequired - totalXP;
  } else {
    // Elo máximo alcançado
    progress = 100;
    xpForNextElo = 0;
  }

  return {
    totalXP,
    currentElo,
    nextElo,
    progress,
    xpForNextElo,
  };
}
