import { Achievement, getLevelRoman } from '../types/achievements';
import { Trophy } from 'lucide-react';

interface AchievementToastWithNavigationProps {
  achievement: Achievement;
  level: number;
  onNavigate: () => void;
  onDismiss: () => void;
}

export function AchievementToastWithNavigation({ 
  achievement, 
  level, 
  onNavigate: _onNavigate,
  onDismiss: _onDismiss 
}: AchievementToastWithNavigationProps) {
  return (
    <div className="flex items-center gap-3">
      <Trophy className="text-emerald-500 flex-shrink-0" size={20} />
      <p className="text-sm text-gray-900 dark:text-white">
        Você desbloqueou a conquista: <span className="font-semibold">{achievement.name} - Nível {getLevelRoman(level)}</span>
      </p>
    </div>
  );
}

