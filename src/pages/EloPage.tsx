import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Sparkles, ArrowLeft, Check, Lock, Lightbulb, BookOpen, FileText, Book, Flame, BarChart2, Star } from 'lucide-react';
import { useXPContext } from '../contexts/XPContext';
import { ELOS, Elo } from '../types/elo';
import { StudyLog } from '../types';
import EloHistoryModal from '../components/EloHistoryModal';
import EloUpgradeModal from '../components/EloUpgradeModal';

interface EloPageProps {
  logs: StudyLog[];
  userId?: string;
  onNavigateToMore?: () => void;
}

export default function EloPage({ onNavigateToMore }: EloPageProps) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeData, setUpgradeData] = useState<{ oldElo: Elo; newElo: Elo } | null>(null);
  const previousEloRef = useRef<Elo | null>(null);

  const { totalXP, xpHistory, progress, isLoading } = useXPContext();
  
  // Detectar upgrade de elo
  useEffect(() => {
    const currentElo = progress.currentElo;
    if (previousEloRef.current && previousEloRef.current.id !== currentElo.id) {
      setUpgradeData({ oldElo: previousEloRef.current, newElo: currentElo });
      setShowUpgradeModal(true);
    }
    previousEloRef.current = currentElo;
  }, [progress.currentElo.id]);

  const currentElo = progress.currentElo;
  const nextElo = progress.nextElo;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="mb-6">
        {onNavigateToMore && (
          <button
            onClick={onNavigateToMore}
            className="md:hidden flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">Voltar</span>
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1 transition-colors flex items-center gap-2">
          <Star className="text-emerald-500" size={28} />
          Elo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">Acompanhe seu progresso e suba de nível</p>
      </div>

      {/* Hero Card - Elo Atual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Medalha com efeito de brilho */}
          <div className="relative">
            <div className="w-20 h-20 md:w-32 md:h-32 flex items-center justify-center relative overflow-hidden rounded-full bg-white dark:bg-gray-800">
              {/* Ícone (base) */}
              <currentElo.icon 
                className={`${currentElo.color} md:hidden`}
                size={64}
                strokeWidth={1.5}
              />
              <currentElo.icon 
                className={`${currentElo.color} hidden md:block`}
                size={96}
                strokeWidth={1.5}
              />
              
              {/* Efeito de brilho SOBRE o ícone */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  width: '50%',
                  height: '100%',
                }}
              />
            </div>
          </div>

          {/* Nome do Elo */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {currentElo.name}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {totalXP.toLocaleString('pt-BR')} XP
            </p>
          </div>

          {/* Barra de Progresso */}
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                {totalXP.toLocaleString('pt-BR')} / {nextElo ? nextElo.xpRequired.toLocaleString('pt-BR') : '∞'} XP
              </span>
              <span className="font-semibold">{Math.round(progress.progress)}%</span>
            </div>
            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${currentElo.progressColor} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Texto motivacional */}
          <p className="text-center text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
            {nextElo ? (
              <>Faltam <span className="font-bold text-emerald-600 dark:text-emerald-400">{progress.xpForNextElo.toLocaleString('pt-BR')}</span> XP para <span className="font-bold">{nextElo.name}</span></>
            ) : (
              <>
                <Sparkles className="text-emerald-600 dark:text-emerald-400" size={20} />
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Parabéns! Você alcançou o elo máximo!</span>
                <Sparkles className="text-emerald-600 dark:text-emerald-400" size={20} />
              </>
            )}
          </p>

          {/* Botão Ver Histórico */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
          >
            <TrendingUp size={20} />
            Ver histórico de XP
          </button>
        </div>
      </motion.div>

      {/* Lista de Elos */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="text-emerald-500" size={28} />
          Todos os Elos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ELOS.map((elo, index) => {
            const isReached = totalXP >= elo.xpRequired;
            const isCurrent = elo.id === currentElo.id;
            const xpNeeded = elo.xpRequired - totalXP;

            return (
              <motion.div
                key={elo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={isReached ? { scale: 1.02 } : {}}
                className={`
                  relative p-6 rounded-xl border-2 transition-all
                  ${isCurrent 
                    ? `${elo.bgColor} ${elo.borderColor} border-4 shadow-lg` 
                    : isReached 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500' 
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-60'
                  }
                `}
              >
                {/* Medalha */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`${isCurrent ? 'scale-110' : ''} transition-transform flex items-center justify-center`}>
                    <elo.icon 
                      className={isCurrent ? elo.color : isReached ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}
                      size={48}
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${isCurrent ? elo.color : isReached ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500'}`}>
                      {elo.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {elo.xpRequired.toLocaleString('pt-BR')} XP
                    </p>
                  </div>
                </div>

                {/* Badge de Status */}
                <div className="mt-4">
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white rounded-full text-sm font-semibold">
                      <ArrowLeft size={14} />
                      Você está aqui
                    </span>
                  ) : isReached ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white rounded-full text-sm font-semibold">
                      <Check size={14} />
                      Alcançado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded-full text-sm font-semibold">
                      <Lock size={14} />
                      Faltam {xpNeeded.toLocaleString('pt-BR')} XP
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Explicação de XP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Como ganhar XP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Lightbulb className="text-amber-500" size={24} />
            Como ganhar XP?
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <BookOpen className="text-emerald-600 dark:text-emerald-400 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Estudar teoria</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">+10 XP por hora</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <FileText className="text-blue-600 dark:text-blue-400 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Resolver questões</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">+5 XP por questão correta</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <Book className="text-purple-600 dark:text-purple-400 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Ler páginas</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">+2 XP por página</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <Flame className="text-orange-600 dark:text-orange-400 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Manter ofensiva</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">+50 XP bônus ao completar 7 dias</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <Trophy className="text-amber-600 dark:text-amber-400 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Resgatar conquistas</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">+100 a +500 XP dependendo da conquista</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Requisitos de XP por Elo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart2 className="text-blue-600 dark:text-blue-400" size={24} />
            Requisitos de XP por Elo
          </h3>
          <div className="space-y-3">
            {ELOS.map((elo) => (
              <div
                key={elo.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  elo.id === currentElo.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500'
                    : 'bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <elo.icon 
                    className={elo.id === currentElo.id ? elo.color : 'text-gray-600 dark:text-gray-400'}
                    size={24}
                    strokeWidth={1.5}
                  />
                  <span className="font-semibold text-gray-900 dark:text-white">{elo.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {elo.xpRequired.toLocaleString('pt-BR')} XP
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Modais */}
      <EloHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        xpHistory={xpHistory}
        totalXP={totalXP}
      />

      <EloUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          setUpgradeData(null);
        }}
        oldElo={upgradeData?.oldElo}
        newElo={upgradeData?.newElo}
        totalXP={totalXP}
      />
    </div>
  );
}
