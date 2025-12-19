import { createContext, useContext, ReactNode } from 'react';
import { StudyLog } from '../types';
import { UserAchievement, Achievement } from '../types/achievements';
import { useAchievements } from '../hooks/useAchievements';

interface AchievementsContextData {
  userAchievements: UserAchievement[];
  claimAchievement: (achievementId: string, level: number) => void;
  getUserProgress: (achievementId: string) => UserAchievement[];
  pendingAchievements: Array<Achievement & { level: number; unlockedAt: number; progress: number }>;
  pendingCount: number;
  claimedCount: number;
  totalCount: number;
  resetAchievements: () => Promise<void>;
}

const AchievementsContext = createContext<AchievementsContextData | undefined>(undefined);

interface AchievementsProviderProps {
  children: ReactNode;
  logs: StudyLog[];
  streak: number;
  dailyGoal: number;
  cycleStartDate: number;
  userCreatedAt?: number;
  userId?: string;
  onNavigateToAchievements?: () => void;
}

export function AchievementsProvider({
  children,
  logs,
  streak,
  dailyGoal,
  cycleStartDate,
  userCreatedAt,
  userId,
  onNavigateToAchievements
}: AchievementsProviderProps) {
  const achievementsData = useAchievements({
    logs,
    streak,
    dailyGoal,
    cycleStartDate,
    userCreatedAt,
    userId,
    onNavigateToAchievements
  });

  return (
    <AchievementsContext.Provider value={achievementsData}>
      {children}
    </AchievementsContext.Provider>
  );
}

export function useAchievementsContext() {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error('useAchievementsContext must be used within AchievementsProvider');
  }
  return context;
}

