import { X, Clock, BookOpen, HelpCircle, TrendingUp, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getRandomPhrase = () => {
  const phrases = [
    "A dor é passageira, a glória é eterna.",
    "Disciplina é a ponte entre metas e realizações.",
    "Se fosse fácil, todo mundo faria.",
    "Foguete não tem ré, guerreiro!",
    "O segredo do sucesso é a constância.",
    "Missão dada é missão cumprida."
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
};

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayMinutes: number;
  todayPages: number;
  todayQuestions: number;
  todayCorrect: number;
  showPerformance: boolean;
}

export default function ShareModal({
  isOpen,
  onClose,
  todayMinutes,
  todayPages,
  todayQuestions,
  todayCorrect,
  showPerformance
}: ShareModalProps) {
  const hours = Math.floor(todayMinutes / 60);
  const minutes = todayMinutes % 60;

  const accuracy = todayQuestions > 0
    ? Math.round((todayCorrect / todayQuestions) * 100)
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão Fechar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-20 backdrop-blur-sm"
              aria-label="Fechar Modal"
              title="Fechar Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Sólido */}
            <div className="bg-emerald-600 dark:bg-emerald-700 px-6 py-6 text-center relative">
              <h2 className="text-xl font-bold text-white mb-1">Resumo do Dia</h2>
              <p className="text-emerald-100 text-xs uppercase tracking-wide font-medium">Foco na missão</p>
            </div>

            {/* Conteúdo */}
            <div className="p-5 space-y-4">

              {/* Grid Principal: Tempo, Páginas, Questões */}
              <div className="grid grid-cols-3 gap-3">
                {/* Tempo (Verde Sólido) */}
                <div className="bg-emerald-500 rounded-2xl p-3 flex flex-col items-center justify-center text-white shadow-sm">
                  <div className="mb-2 p-2 bg-white/20 rounded-full">
                     <Clock className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-lg font-black leading-none mb-1">
                    {hours > 0 ? `${hours}h` : ''}{minutes}m
                  </p>
                  <p className="text-[10px] opacity-80 font-bold uppercase">Tempo</p>
                </div>

                {/* Páginas (Azul Sólido) */}
                <div className="bg-blue-500 rounded-2xl p-3 flex flex-col items-center justify-center text-white shadow-sm">
                  <div className="mb-2 p-2 bg-white/20 rounded-full">
                     <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-lg font-black leading-none mb-1">
                    {todayPages}
                  </p>
                  <p className="text-[10px] opacity-80 font-bold uppercase">Páginas</p>
                </div>

                {/* Questões (Indigo Sólido) */}
                <div className="bg-indigo-500 rounded-2xl p-3 flex flex-col items-center justify-center text-white shadow-sm">
                  <div className="mb-2 p-2 bg-white/20 rounded-full">
                     <HelpCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-lg font-black leading-none mb-1">
                    {todayQuestions}
                  </p>
                  <p className="text-[10px] opacity-80 font-bold uppercase">Questões</p>
                </div>
              </div>

              {/* Card Desempenho (Amarelo Sólido) */}
              {todayQuestions > 0 && showPerformance && (
                <div className="bg-amber-500 rounded-2xl p-4 flex items-center justify-between text-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold opacity-80 uppercase">Aproveitamento</p>
                      <p className="text-2xl font-black">{accuracy}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {todayCorrect} <span className="opacity-60">/ {todayQuestions}</span>
                    </p>
                    <p className="text-[10px] opacity-80 uppercase font-bold">Acertos</p>
                  </div>
                </div>
              )}

              {/* Frase Motivacional */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 relative transition-colors">
                <Quote className="absolute top-3 left-3 w-4 h-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-600 dark:text-gray-300 text-center font-medium text-sm italic px-4">
                  "{getRandomPhrase()}"
                </p>
              </div>
              
              <div className="text-center">
                 <p className="text-[10px] text-gray-400 dark:text-gray-500">Tire um print e compartilhe sua jornada!</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}