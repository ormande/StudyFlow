import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Elo } from '../types/elo';
import { useAppearance } from '../hooks/useAppearance';

interface EloUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldElo: Elo | undefined;
  newElo: Elo | undefined;
  totalXP: number;
}

export default function EloUpgradeModal({ isOpen, onClose, oldElo, newElo, totalXP }: EloUpgradeModalProps) {
  const { shouldReduceMotion } = useAppearance();
  if (!oldElo || !newElo) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={shouldReduceMotion ? false : { opacity: 1 }}
            exit={shouldReduceMotion ? false : { opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : undefined}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={shouldReduceMotion ? false : { opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
            transition={shouldReduceMotion ? { duration: 0 } : undefined}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full z-[60] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                🎉 Parabéns!
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 text-center space-y-6">
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Você subiu de elo!
              </p>

              {/* Animação de evolução */}
              <div className="flex items-center justify-center gap-4 py-8">
                {/* Elo antigo */}
                <motion.div
                  initial={shouldReduceMotion ? false : { scale: 1, opacity: 1 }}
                  animate={shouldReduceMotion ? false : { scale: 0.5, opacity: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
                  className="flex items-center justify-center"
                >
                  <oldElo.icon 
                    className={oldElo.color}
                    size={64}
                    strokeWidth={1.5}
                  />
                </motion.div>

                {/* Seta */}
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
                  animate={shouldReduceMotion ? false : { opacity: 1, x: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.3 }}
                  className="text-3xl text-emerald-500"
                >
                  →
                </motion.div>

                {/* Elo novo */}
                <motion.div
                  initial={shouldReduceMotion ? false : { scale: 0.5, opacity: 0 }}
                  animate={shouldReduceMotion ? false : { scale: [0.5, 1.2, 1], opacity: 1 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.5 }}
                  className="relative flex items-center justify-center"
                >
                  <newElo.icon 
                    className={newElo.color}
                    size={64}
                    strokeWidth={1.5}
                  />
                  {/* Efeito de partículas ao redor */}
                  {!shouldReduceMotion && [...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        x: [0, Math.cos((i * Math.PI * 2) / 8) * 40],
                        y: [0, Math.sin((i * Math.PI * 2) / 8) * 40],
                      }}
                      transition={{ 
                        duration: 1,
                        delay: 0.7 + (i * 0.1),
                        repeat: 0,
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span className="text-2xl">✨</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Nomes dos elos */}
              <div className="flex items-center justify-center gap-4">
                <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  {oldElo.name}
                </span>
                <span className="text-gray-400">→</span>
                <span className={`text-2xl font-bold ${newElo.color}`}>
                  {newElo.name}
                </span>
              </div>

              {/* XP total */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  XP Total
                </p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {totalXP.toLocaleString('pt-BR')} XP
                </p>
              </div>

              {/* Botão */}
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors mt-6"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
