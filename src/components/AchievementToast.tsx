import { motion } from 'framer-motion';
import { Achievement, getLevelBadgeColor, getLevelRoman } from '../types/achievements';

interface AchievementToastProps {
  achievement: Achievement;
  level: number;
}

export function AchievementToast({ achievement, level }: AchievementToastProps) {
  const AchievementIcon = achievement.icon;
  
  return (
    <div className="flex items-center gap-4 p-2">
      {/* Ícone animado */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-lg relative flex-shrink-0"
      >
        <AchievementIcon className={achievement.color} size={32} />
        <span className={`absolute -bottom-1 -right-1 ${getLevelBadgeColor(level as 1 | 2 | 3)} text-white text-xs font-bold px-2 py-0.5 rounded`}>
          {getLevelRoman(level as 1 | 2 | 3)}
        </span>
      </motion.div>
      
      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          🏆 Nova Conquista Desbloqueada!
        </p>
        <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold">
          {achievement.name} - Nível {getLevelRoman(level as 1 | 2 | 3)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {achievement.description}
        </p>
      </div>
    </div>
  );
}

