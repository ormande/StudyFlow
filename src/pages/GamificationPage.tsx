import { motion } from 'framer-motion';
import { useGamification } from '../hooks/useGamification';
import { StudyLog } from '../types';
import { Lock } from 'lucide-react';
import Skeleton from '../components/Skeleton';

interface GamificationPageProps {
  logs: StudyLog[];
  streak: number;
  isLoading: boolean;
}

export default function GamificationPage({ logs, streak, isLoading }: GamificationPageProps) {
  const gamification = useGamification(logs, streak);
  const { level, nextLevel, progress, totalXP, xpToNext, badges } = gamification;

  const IconComponent = level.icon;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Conquistas</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Seu progresso e medalhas</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* Skeleton do Card do Elo */}
          <Skeleton className="h-64 w-full" />
          
          {/* Skeleton da Sala de Troféus */}
          <div>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
        {/* Card do Elo Atual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Ícone Grande */}
            <div
              className="p-6 rounded-3xl shadow-xl"
              style={{ backgroundColor: `${level.color}20`, border: `3px solid ${level.color}` }}
            >
              <IconComponent size={64} style={{ color: level.color }} />
            </div>

            {/* Informações */}
            <div className="flex-1 w-full">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Seu Elo Atual
                </h3>
                <h2
                  className="text-4xl font-black mb-2"
                  style={{ color: level.color }}
                >
                  {level.displayName}
                </h2>
                <p className="text-lg font-bold text-gray-800 dark:text-white">
                  {totalXP.toLocaleString('pt-BR')} XP Total
                </p>
              </div>

              {/* Barra de Progresso Detalhada */}
              {nextLevel && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Progresso para {nextLevel.name}
                    </span>
                    <span className="text-sm font-bold" style={{ color: level.color }}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full shadow-sm"
                      style={{ backgroundColor: level.color }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Faltam {xpToNext.toLocaleString('pt-BR')} XP para evoluir para {nextLevel.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Sala de Troféus */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            Sala de Troféus
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map((badge, index) => {
              const BadgeIcon = badge.icon;
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`relative rounded-2xl p-6 border-2 transition-all duration-300 ${
                    badge.unlocked
                      ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-300 dark:border-amber-700 shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60'
                  }`}
                >
                  {/* Ícone da Medalha */}
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className={`p-4 rounded-2xl ${
                        badge.unlocked
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg'
                          : 'bg-gray-400 dark:bg-gray-600'
                      }`}
                    >
                      {badge.unlocked ? (
                        <BadgeIcon size={32} className="text-white" />
                      ) : (
                        <Lock size={32} className="text-white" />
                      )}
                    </div>
                    <div className="text-center">
                      <h3
                        className={`font-bold text-sm mb-1 ${
                          badge.unlocked
                            ? 'text-gray-800 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {badge.name}
                      </h3>
                      <p
                        className={`text-xs ${
                          badge.unlocked
                            ? 'text-gray-600 dark:text-gray-300'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {badge.desc}
                      </p>
                    </div>
                  </div>

                  {/* Efeito de brilho para desbloqueadas */}
                  {badge.unlocked && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
