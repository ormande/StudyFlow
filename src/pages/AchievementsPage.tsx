import { motion } from 'framer-motion';
import { useAchievementsContext } from '../contexts/AchievementsContext';
import { 
  ACHIEVEMENTS, 
  CATEGORY_ORDER, 
  getLevelBadgeColor, 
  getLevelRoman, 
  getCategoryName, 
  getCategoryIcon,
  Achievement,
  UserAchievement
} from '../types/achievements';
import { Sparkles, Trophy, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';

interface AchievementsPageProps {
  isLoading: boolean;
  onNavigateToMore?: () => void;
}

// Componente de Card de Conquista
interface AchievementCardProps {
  achievement: Achievement;
  userProgress: UserAchievement[];
  onClaim: (achievementId: string, level: number) => void;
}

function AchievementCard({ achievement, userProgress, onClaim }: AchievementCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
      {/* Header com ícone e nome */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <achievement.icon className={achievement.color} size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">
            {achievement.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {achievement.description}
          </p>
        </div>
      </div>
      
      {/* Níveis */}
      <div className="flex gap-2">
        {achievement.levels.map((level) => {
          const userLevel = userProgress.find(up => up.level === level.level);
          const isUnlocked = userLevel && userLevel.unlockedAt;
          const isClaimed = userLevel && userLevel.claimedAt;
          
          return (
            <div
              key={level.level}
              className={`flex-1 rounded-lg p-3 text-center relative transition-all ${
                isClaimed
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500'
                  : isUnlocked
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500'
                  : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
              }`}
            >
              {/* Badge de nível */}
              <span className={`inline-block ${getLevelBadgeColor(level.level as 1 | 2 | 3)} text-white text-xs font-bold px-2 py-0.5 rounded mb-1`}>
                {getLevelRoman(level.level as 1 | 2 | 3)}
              </span>
              
              {/* Ícone de status */}
              <div className="my-1">
                {isClaimed ? (
                  <CheckCircle2 className="text-emerald-500 mx-auto" size={20} />
                ) : isUnlocked ? (
                  <Sparkles className="text-yellow-500 mx-auto animate-pulse" size={20} />
                ) : (
                  <Lock className="text-gray-400 mx-auto" size={20} />
                )}
              </div>
              
              {/* Requisito */}
              <p className={`text-xs font-semibold mt-1 ${
                isClaimed ? 'text-emerald-700 dark:text-emerald-300' : 
                isUnlocked ? 'text-yellow-700 dark:text-yellow-300' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {level.label}
              </p>
              
              {/* Progresso (se não completo) */}
              {!isClaimed && userLevel && (
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  {Math.min(userLevel.progress, level.requirement)}/{level.requirement}
                </p>
              )}
              
              {/* Botão de resgate (se desbloqueado mas não resgatado) */}
              {isUnlocked && !isClaimed && (
                <Button
                  onClick={() => onClaim(achievement.id, level.level)}
                  variant="primary"
                  size="sm"
                  fullWidth
                  className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-xs font-bold"
                >
                  Resgatar
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AchievementsPage({ 
  isLoading,
  onNavigateToMore
}: AchievementsPageProps) {
  const {
    pendingAchievements,
    pendingCount: _pendingCount,
    claimedCount,
    totalCount,
    claimAchievement,
    getUserProgress
  } = useAchievementsContext();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-6 pb-24">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((j) => (
                  <Skeleton key={j} className="h-40 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Header */}
      <div className="mb-6">
        {onNavigateToMore && (
          <Button
            onClick={onNavigateToMore}
            variant="ghost"
            size="md"
            leftIcon={<ArrowLeft size={20} />}
            className="md:hidden mb-4"
          >
            Voltar
          </Button>
        )}
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
          <Trophy className="text-emerald-500" size={28} />
          Conquistas
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {claimedCount} de {totalCount} conquistas resgatadas
        </p>
      </div>

      {/* Conquistas Pendentes (se houver) */}
      {pendingAchievements.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
            <Sparkles size={20} />
            Conquistas Pendentes ({pendingAchievements.length})
          </h2>
          
          <div className="space-y-3">
            {pendingAchievements.map((achievement) => (
              <motion.div
                key={`${achievement.id}-${achievement.level}`}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-5 border-2 border-emerald-300 dark:border-emerald-700 shadow-lg"
              >
                <div className="flex items-center gap-4">
                  {/* Ícone */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-md">
                      <achievement.icon className={achievement.color} size={32} />
                    </div>
                    {/* Badge de nível */}
                    <span className={`absolute -bottom-1 -right-1 ${getLevelBadgeColor(achievement.level as 1 | 2 | 3)} text-white text-xs font-bold px-2 py-0.5 rounded`}>
                      {getLevelRoman(achievement.level as 1 | 2 | 3)}
                    </span>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {achievement.name} - Nível {getLevelRoman(achievement.level as 1 | 2 | 3)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {achievement.description}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                      {achievement.levels[achievement.level - 1].label}
                    </p>
                  </div>
                  
                  {/* Botão Resgatar */}
                  <Button
                    onClick={() => claimAchievement(achievement.id, achievement.level)}
                    variant="primary"
                    size="md"
                    leftIcon={<Trophy size={20} />}
                    className="flex-shrink-0 shadow-md font-bold"
                  >
                    Resgatar!
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Conquistas por Categoria */}
      {CATEGORY_ORDER.map((category) => {
        const categoryAchievements = ACHIEVEMENTS.filter(a => a.category === category);
        if (categoryAchievements.length === 0) return null;

        return (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              {(() => {
                const CategoryIcon = getCategoryIcon(category);
                return <CategoryIcon className="text-emerald-500" size={20} />;
              })()}
              {getCategoryName(category)}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  userProgress={getUserProgress(achievement.id)}
                  onClaim={claimAchievement}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

