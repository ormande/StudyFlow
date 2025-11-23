import { X, Clock, BookOpen, HelpCircle, TrendingUp } from 'lucide-react';

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

  const accuracyColor = accuracy >= 80 ? 'text-emerald-600' : accuracy >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-gray-600 hover:text-gray-800 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-1">Seu Dia de Estudo</h2>
            <p className="text-emerald-100 text-sm">Resultado do dia de hoje</p>
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-5">

            {/* Card Grande - Tempo */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Tempo Focado</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {hours > 0 && `${hours}h `}{minutes.toString().padStart(2, '0')}m
                  </p>
                </div>
              </div>
            </div>

            {/* Grid de Cards - Páginas e Questões */}
            <div className="grid grid-cols-2 gap-4">
              {/* Card Páginas */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Páginas</p>
                <p className="text-3xl font-bold text-blue-600">{todayPages}</p>
                <p className="text-xs text-gray-400 mt-1">lidas hoje</p>
              </div>

              {/* Card Questões */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Questões</p>
                <p className="text-3xl font-bold text-purple-600">{todayQuestions}</p>
                <p className="text-xs text-gray-400 mt-1">resolvidas</p>
              </div>
            </div>

            {/* Card Desempenho */}
            {todayQuestions > 0 && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 border border-yellow-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Desempenho</p>
                      <p className={`text-2xl font-bold ${accuracyColor}`}>{accuracy}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-600">{todayCorrect}/{todayQuestions}</p>
                    <p className="text-xs text-gray-400">acertos</p>
                  </div>
                </div>
              </div>
            )}

            {/* Frase Motivacional */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200/50">
              <p className="text-gray-700 text-center font-semibold text-sm leading-relaxed italic">
                "{getRandomPhrase()}"
              </p>
            </div>

            {/* Call to Action */}
            <div className="text-center pt-2">
              <p className="text-gray-500 text-xs">
                Compartilhe sua vitória com prints do painel
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
