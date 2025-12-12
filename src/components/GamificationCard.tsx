import { motion } from 'framer-motion';
import { useGamification } from '../hooks/useGamification';
import { StudyLog } from '../types';

interface GamificationCardProps {
  logs: StudyLog[];
  streak?: number;
}

export default function GamificationCard({ logs, streak = 0 }: GamificationCardProps) {
  const gamification = useGamification(logs, streak);
  const { level, nextLevel, progress, totalXP, xpToNext } = gamification;

  const IconComponent = level.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-md border border-gray-100 dark:border-gray-700 h-16 flex items-center gap-3"
    >
      {/* Ícone Pequeno */}
      <div
        className="p-2 rounded-lg flex-shrink-0"
        style={{ backgroundColor: `${level.color}20`, border: `2px solid ${level.color}` }}
      >
        <IconComponent size={20} style={{ color: level.color }} />
      </div>

      {/* Nome do Elo e Barra */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3
            className="text-sm font-black truncate"
            style={{ color: level.color }}
          >
            {level.displayName}
          </h3>
          {nextLevel && (
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-2">
              {progress.toFixed(0)}%
            </span>
          )}
        </div>
        {nextLevel && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: level.color }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
