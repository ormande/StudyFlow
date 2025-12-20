import { motion, AnimatePresence } from 'framer-motion';
import { Elo } from '../types/elo';
import { ChevronsRight, ChevronsDown } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EloUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldElo: Elo | null;
  newElo: Elo | null;
  totalXP: number;
}

export default function EloUpgradeModal({ isOpen, onClose, oldElo, newElo, totalXP }: EloUpgradeModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (!isOpen || !oldElo || !newElo) return null;

  const OldEloIcon = oldElo.icon;
  const NewEloIcon = newElo.icon;

  // Cores para partículas baseadas no novo elo
  const getParticleColor = () => {
    if (newElo.id === 'bronze') return '#f59e0b';
    if (newElo.id === 'prata') return '#9ca3af';
    if (newElo.id === 'ouro') return '#eab308';
    if (newElo.id === 'platina') return '#a855f7';
    if (newElo.id === 'diamante') return '#22d3ee';
    return '#10b981';
  };

  const particleColor = getParticleColor();

  // Número de partículas
  const particleCount = 16;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop com blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          {/* Modal Principal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                mass: 0.8,
              }}
              className="w-full max-w-md pointer-events-auto"
            >
              {/* Container do Modal */}
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border-2"
                style={{
                  borderColor: particleColor,
                }}
              >
                {/* Efeito de brilho animado no background */}
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    rotate: {
                      duration: 20,
                      repeat: Infinity,
                      ease: 'linear',
                    },
                    scale: {
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }}
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(circle at center, ${particleColor}40, transparent 70%)`,
                    filter: 'blur(60px)',
                  }}
                />

                {/* Conteúdo */}
                <div className="relative p-8 text-center space-y-6">
                  {/* Título explosivo */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 15,
                      delay: 0.2,
                    }}
                  >
                    <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2">
                      SUBIU DE NÍVEL!
                    </h2>
                  </motion.div>

                  {/* Container de Evolução */}
                  <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 py-8">
                    {/* Ícone do Elo Antigo */}
                    <motion.div
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 0.7, opacity: 0.5 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="flex justify-center"
                    >
                      <OldEloIcon 
                        className={oldElo.color}
                        size={isMobile ? 60 : 80}
                        strokeWidth={2}
                      />
                    </motion.div>

                    {/* Seta de evolução animada */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0, rotate: -90 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1, 
                        rotate: isMobile ? -90 : 0,
                        x: isMobile ? 0 : [0, 10, 0],
                        y: isMobile ? [0, 10, 0] : 0,
                      }}
                      transition={{ 
                        delay: 0.8,
                        type: 'spring',
                        stiffness: 300,
                        x: {
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                        y: {
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                      }}
                      className="text-emerald-500"
                    >
                      {isMobile ? (
                        <ChevronsDown size={32} strokeWidth={3} />
                      ) : (
                        <ChevronsRight size={32} strokeWidth={3} />
                      )}
                    </motion.div>

                    {/* Container do Novo Elo com Explosão */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: 1.2,
                        opacity: 1,
                      }}
                      transition={{
                        duration: 0.8,
                        delay: 1.2,
                        type: 'spring',
                        stiffness: 200,
                        damping: 15,
                      }}
                      className="relative flex justify-center"
                    >
                      {/* Background Glow pulsante/girando */}
                      <motion.div
                        animate={{
                          rotate: [0, 360],
                          scale: [1, 1.3, 1],
                        }}
                        transition={{
                          rotate: {
                            duration: 8,
                            repeat: Infinity,
                            ease: 'linear',
                          },
                          scale: {
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          },
                        }}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          width: '200px',
                          height: '200px',
                          background: `radial-gradient(circle, ${particleColor}60, ${particleColor}30, transparent 70%)`,
                          filter: 'blur(40px)',
                          borderRadius: '50%',
                        }}
                      />

                      {/* Ícone principal */}
                      <div className="relative z-10">
                        <NewEloIcon 
                          className={newElo.color}
                          size={isMobile ? 100 : 120}
                          strokeWidth={2.5}
                        />
                      </div>

                      {/* Partículas explosivas */}
                      {[...Array(particleCount)].map((_, i) => {
                        const angle = (i * Math.PI * 2) / particleCount;
                        const radius = 100;
                        const distance = radius + Math.random() * 50;
                        const size = 6 + Math.random() * 8;
                        const delay = 1.4 + (i * 0.03);
                        
                        return (
                          <motion.div
                            key={i}
                            initial={{ 
                              scale: 0, 
                              opacity: 0, 
                              x: 0, 
                              y: 0,
                              rotate: 0,
                            }}
                            animate={{
                              scale: [0, 1, 0.8, 0],
                              opacity: [0, 1, 1, 0],
                              x: [0, Math.cos(angle) * distance, Math.cos(angle) * distance * 1.3],
                              y: [0, Math.sin(angle) * distance, Math.sin(angle) * distance * 1.3],
                              rotate: [0, 180, 360],
                            }}
                            transition={{
                              duration: 1.8,
                              delay: delay,
                              ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                            style={{
                              width: `${size}px`,
                              height: `${size}px`,
                              backgroundColor: particleColor,
                              boxShadow: `0 0 ${size * 2}px ${particleColor}`,
                            }}
                          />
                        );
                      })}
                    </motion.div>
                  </div>

                  {/* Nome do Novo Elo */}
                  <motion.div
                    initial={{ scale: 0, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      delay: 1.8,
                    }}
                  >
                    <h3 className={`text-3xl md:text-4xl font-black ${newElo.color} mb-2`}>
                      {newElo.name.toUpperCase()}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      Novo Elo Alcançado!
                    </p>
                  </motion.div>

                  {/* XP Total */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 }}
                    className="pt-4 border-t border-gray-200 dark:border-gray-700"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      XP Total
                    </p>
                    <motion.p 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 2.2, type: 'spring', stiffness: 300 }}
                      className="text-3xl font-bold text-emerald-600 dark:text-emerald-400"
                    >
                      {totalXP.toLocaleString('pt-BR')} XP
                    </motion.p>
                  </motion.div>

                  {/* Botão Continuar */}
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      delay: 2.4,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="w-full px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-colors"
                  >
                    Continuar
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
