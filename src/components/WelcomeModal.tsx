import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToTutorial: () => void;
  userName?: string;
}

export default function WelcomeModal({ isOpen, onClose, onGoToTutorial, userName }: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative"
        >
          {/* Header com gradiente */}
          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-8 text-center relative overflow-hidden">
            {/* Decoração de fundo */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-20 h-20 bg-white rounded-full blur-2xl"></div>
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-teal-300 rounded-full blur-3xl"></div>
            </div>
            
            {/* Ícone */}
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-black text-white mb-2">
                Bem-vindo ao StudyFlow{userName ? `, ${userName}` : ''}! 🎉
              </h2>
              <p className="text-emerald-50 text-sm">
                Agora você faz parte da nossa família
              </p>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Estamos muito felizes em ter você conosco!
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Preparamos um tutorial rápido para você dominar todas as funcionalidades e transformar seus estudos.
            </p>

            {/* Botões */}
            <div className="space-y-3">
              <button
                onClick={onGoToTutorial}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                Ver Tutorial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={onClose}
                className="w-full py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors"
              >
                Pular por agora
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

