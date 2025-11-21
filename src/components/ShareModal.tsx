import { X } from 'lucide-react';

// BIZU: Como não temos o arquivo de frases, coloquei uma lista interna aqui mesmo pra não quebrar
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
  todayPages: number; // Mudado de Subjects para Pages
  todayQuestions: number;
  todayCorrect: number; // NOVO: Quantidade de acertos
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

  // Cálculo de Precisão (Desempenho)
  const accuracy = todayQuestions > 0 
    ? Math.round((todayCorrect / todayQuestions) * 100) 
    : 0;

  // Cor da precisão muda conforme o desempenho
  const accuracyColor = accuracy >= 80 ? 'text-emerald-300' : accuracy >= 50 ? 'text-yellow-300' : 'text-red-300';

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Design Antigo Resgatado: Gradiente Emerald */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 rounded-3xl p-8 shadow-2xl border border-white/10">
          <div className="text-center mb-8">
            <div className="inline-block px-6 py-2 bg-white/20 rounded-full mb-4 backdrop-blur-sm border border-white/10">
              <span className="text-white font-bold text-sm tracking-wider">STUDYFLOW</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Progresso Diário</h2>
            <div className="w-20 h-1 bg-white/40 mx-auto rounded-full" />
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-center">
                <p className="text-white/80 text-sm font-semibold mb-2 uppercase tracking-wide">Tempo Focado</p>
                <p className="text-5xl font-black text-white tracking-tight">
                  {hours > 0 && `${hours}h`}
                  {minutes.toString().padStart(2, '0')}m
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Card de Páginas */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center flex flex-col justify-center">
                <p className="text-white/80 text-xs font-semibold mb-2 uppercase">Páginas Lidas</p>
                <p className="text-3xl font-bold text-white">{todayPages}</p>
              </div>

              {/* Card de Questões com Desempenho */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center relative overflow-hidden">
                <p className="text-white/80 text-xs font-semibold mb-1 uppercase">Questões</p>
                <p className="text-3xl font-bold text-white mb-1">{todayQuestions}</p>
                
                {todayQuestions > 0 ? (
                  <div className={`text-xs font-bold ${accuracyColor} bg-black/20 rounded-full px-2 py-1 inline-block`}>
                    {accuracy}% acerto
                  </div>
                ) : (
                  <span className="text-xs text-white/40">-</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
            <p className="text-white text-center font-medium text-sm leading-relaxed italic">
              "{getRandomPhrase()}"
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white/60 text-xs">
              Tire um print e marque sua presença! 📸
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}