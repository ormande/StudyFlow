import { X, Clock, BookOpen, HelpCircle, TrendingUp, Quote } from 'lucide-react';

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
}

export default function ShareModal({
  isOpen,
  onClose,
  todayMinutes,
  todayPages,
  todayQuestions,
  todayCorrect
}: ShareModalProps) {
  if (!isOpen) return null;

  const hours = Math.floor(todayMinutes / 60);
  const minutes = todayMinutes % 60;

  const accuracy = todayQuestions > 0
    ? Math.round((todayCorrect / todayQuestions) * 100)
    : 0;

  // Cores dinâmicas para o texto de acurácia
  const accuracyTextColor = accuracy >= 80 
    ? 'text-emerald-600 dark:text-emerald-400' 
    : accuracy >= 50 
      ? 'text-yellow-600 dark:text-yellow-400' 
      : 'text-red-600 dark:text-red-400';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Sólido */}
        <div className="bg-emerald-600 dark:bg-emerald-700 px-6 py-6 text-center">
          <h2 className="text-xl font-bold text-white mb-1">Resumo do Dia</h2>
          <p className="text-emerald-100 text-xs uppercase tracking-wide font-medium">Foco na missão</p>
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-4">

          {/* Grid Principal: Tempo, Páginas, Questões (Compacto) */}
          <div className="grid grid-cols-3 gap-3">
            {/* Tempo */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700">
              <div className="mb-2 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                 <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-lg font-black text-gray-800 dark:text-white leading-none mb-1">
                {hours > 0 ? `${hours}h` : ''}{minutes}m
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Tempo</p>
            </div>

            {/* Páginas */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700">
              <div className="mb-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                 <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-lg font-black text-gray-800 dark:text-white leading-none mb-1">
                {todayPages}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Páginas</p>
            </div>

            {/* Questões */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700">
              <div className="mb-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                 <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-lg font-black text-gray-800 dark:text-white leading-none mb-1">
                {todayQuestions}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Questões</p>
            </div>
          </div>

          {/* Card Desempenho (Só aparece se tiver questões) */}
          {todayQuestions > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Aproveitamento</p>
                  <p className={`text-2xl font-black ${accuracyTextColor}`}>{accuracy}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                  <span className="text-emerald-500">{todayCorrect}</span> / {todayQuestions}
                </p>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Acertos</p>
              </div>
            </div>
          )}

          {/* Frase Motivacional */}
          <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/20 relative">
            <Quote className="absolute top-3 left-3 w-4 h-4 text-emerald-300 dark:text-emerald-700 opacity-50" />
            <p className="text-emerald-800 dark:text-emerald-200 text-center font-medium text-sm italic px-4">
              "{getRandomPhrase()}"
            </p>
          </div>
          
          <div className="text-center">
             <p className="text-[10px] text-gray-400 dark:text-gray-500">Tire um print e compartilhe sua jornada!</p>
          </div>
        </div>
      </div>
    </div>
  );
}