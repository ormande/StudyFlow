import { useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  TrendingUp,
  Sparkles,
  Check,
  Lock,
  Lightbulb,
  BookOpen,
  FileText,
  Book,
  BarChart2,
  Star,
  ArrowLeft,
} from "lucide-react";
import { useXPContext } from "../contexts/XPContext";
import { ELOS } from "../types/elo";
import { StudyLog } from "../types";
import EloHistoryModal from "../components/EloHistoryModal";
import Button from "../components/Button";
import FloatingBackButton from "../components/FloatingBackButton";

interface EloPageProps {
  logs: StudyLog[];
  userId?: string;
  onNavigateToMore?: () => void;
}

export default function EloPage({ onNavigateToMore }: EloPageProps) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const { totalXP, xpHistory, progress, isLoading } = useXPContext();

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Botão Voltar Flutuante */}
      {onNavigateToMore && <FloatingBackButton onClick={onNavigateToMore} />}

      {/* Header (centralizado no mobile) - AJUSTADO PARA XS (<360px) */}
      <div className="text-center mb-4 xs:mb-5 sm:mb-8">
        <div className="flex items-center justify-center gap-2 mb-2 xs:gap-1">
          <Star className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Elo
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base line-clamp-2">
          Acompanhe seu progresso e suba de nível
        </p>
      </div>

      {/* Hero Card - Elo Atual - AJUSTADO PARA XS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 xs:mt-5 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col items-center text-center space-y-4 xs:space-y-4 sm:space-y-6">
          {/* Medalha com efeito de brilho - RESPONSIVA */}
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 md:w-32 md:h-32 flex items-center justify-center relative overflow-hidden rounded-full bg-white dark:bg-gray-800">
              {/* Ícone (base) - RESPONSIVO */}
              <currentElo.icon
                className={`${currentElo.color} md:hidden`}
                size={56}
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
                  x: ["-100%", "200%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  width: "50%",
                  height: "100%",
                }}
              />
            </div>
          </div>

          {/* Nome do Elo - RESPONSIVO */}
          <div>
            <h1 className="text-2xl xs:text-3xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 xs:mb-1 sm:mb-2">
              {currentElo.name}
            </h1>
            <p className="text-lg xs:text-lg sm:text-lg text-gray-600 dark:text-gray-400">
              {totalXP.toLocaleString("pt-BR")} XP
            </p>
          </div>

          {/* Barra de Progresso - RESPONSIVA */}
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-sm sm:text-sm text-gray-600 dark:text-gray-400 gap-1 overflow-hidden">
              <span className="truncate">
                {totalXP.toLocaleString("pt-BR")} /{" "}
                {nextElo ? nextElo.xpRequired.toLocaleString("pt-BR") : "∞"} XP
              </span>
              <span className="font-semibold flex-shrink-0">
                {Math.round(progress.progress)}%
              </span>
            </div>
            <div className="w-full h-3 xs:h-4 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${currentElo.progressColor} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Texto motivacional - ALINHADO LADO A LADO */}
          <p className="text-center text-gray-600 dark:text-gray-400 flex flex-row items-center justify-center gap-1 text-sm sm:text-base break-words">
            {nextElo ? (
              <>
                <span>Faltam</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {progress.xpForNextElo.toLocaleString("pt-BR")}
                </span>
                <span>XP para</span>
                <span className="font-bold">{nextElo.name}</span>
              </>
            ) : (
              <>
                <Sparkles
                  className="text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                  size={18}
                />
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Parabéns! Você alcançou o elo máximo!
                </span>
                < Sparkles
                  className="text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                  size={18}
                />
              </>
            )}
          </p>

          {/* Botão Ver Histórico - RESPONSIVO */}
          <Button
            onClick={() => setShowHistoryModal(true)}
            variant="primary"
            size="md"
            leftIcon={<TrendingUp size={18} />}
            className="xs:w-full py-3 sm:py-3.5 text-sm"
          >
            Ver histórico de XP
          </Button>
        </div>
      </motion.div>

      {/* Lista de Elos - GRID RESPONSIVO PARA XS */}
      <div className="mt-8 space-y-3 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 px-1">
          <Trophy className="text-emerald-500 flex-shrink-0" size={24} />
          <span className="truncate">Todos os Elos</span>
        </h2>

        <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                  relative p-4 sm:p-6 rounded-xl border-2 transition-all
                  ${isCurrent ? "scale-105" : ""}
                  ${
                    isCurrent
                      ? `${elo.bgColor} ${elo.borderColor} border-4 shadow-lg`
                      : isReached
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500"
                      : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-60"
                  }
                `}
              >
                {/* Cabeçalho do Card (Ícone, Info e Badge lado a lado) */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div
                      className={`${
                        isCurrent ? "scale-110" : ""
                      } transition-transform flex items-center justify-center flex-shrink-0`}
                    >
                      <elo.icon
                        className={
                          isCurrent
                            ? elo.color
                            : isReached
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-gray-500 dark:text-gray-400"
                        }
                        size={40}
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h3
                        className={`text-base sm:text-lg font-bold truncate ${
                          isCurrent
                            ? elo.color
                            : isReached
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-gray-500"
                        }`}
                      >
                        {elo.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                        {elo.xpRequired.toLocaleString("pt-BR")} XP
                      </p>
                    </div>
                  </div>

                  {/* Badge de Status - Agora ao lado */}
                  <div className="flex-shrink-0">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg text-sm sm:text-base font-bold whitespace-nowrap">
                        <ArrowLeft size={14} strokeWidth={3} />
                        Você está aqui
                      </span>
                    ) : isReached ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm sm:text-base font-bold whitespace-nowrap border border-emerald-500/20">
                        <Check size={14} strokeWidth={3} />
                        Alcançado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm sm:text-base font-bold whitespace-nowrap border border-gray-200 dark:border-gray-600">
                        <Lock size={14} />
                        Faltam {xpNeeded.toLocaleString("pt-BR")} XP
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Explicação de XP - GRID RESPONSIVO */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Como ganhar XP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 sm:p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Lightbulb className="text-amber-500 flex-shrink-0" size={20} />
            <span className="truncate">Como ganhar XP?</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <BookOpen
                className="text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                size={24}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  Tempo de estudo
                </p>
                <p className="text-sm sm:text-base text-emerald-700 dark:text-emerald-300 font-bold truncate">
                  +1 XP por minuto
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  Teoria, questões ou revisão!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <FileText
                className="text-blue-600 dark:text-blue-400 flex-shrink-0"
                size={24}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  Questões corretas
                </p>
                <p className="text-sm sm:text-base text-blue-700 dark:text-blue-300 font-bold truncate">
                  +5 XP por acerto
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  Erradas não dão XP
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <Book
                className="text-purple-600 dark:text-purple-400 flex-shrink-0"
                size={24}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  Páginas lidas
                </p>
                <p className="text-sm sm:text-base text-purple-700 dark:text-purple-300 font-bold truncate">
                  +2 XP por página
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  Estudo por leitura!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <Trophy
                className="text-amber-600 dark:text-amber-400 flex-shrink-0"
                size={24}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  Resgatar conquistas
                </p>
                <p className="text-sm sm:text-base text-amber-700 dark:text-amber-300 font-bold truncate">
                  +50 a +500 XP
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  Bônus ao resgatar
                </p>
              </div>
            </div>
          </div>

          {/* Exemplo prático - RESPONSIVO */}
          <div className="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">
              Exemplo
            </p>
            <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              <div className="flex flex-row items-center gap-1 flex-wrap">
                <span className="font-bold whitespace-nowrap">
                  1h + 20 págs + 10 acertos
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black whitespace-nowrap">
                  = 150 XP
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Requisitos de XP por Elo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 sm:p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart2
              className="text-blue-600 dark:text-blue-400 flex-shrink-0"
              size={20}
            />
            <span className="truncate">Requisitos XP</span>
          </h3>
          <div className="space-y-3">
            {ELOS.map((elo) => (
              <div
                key={elo.id}
                className={`flex items-center justify-between p-3 rounded-lg gap-2 ${
                  elo.id === currentElo.id
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500"
                    : "bg-gray-50 dark:bg-gray-700/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <elo.icon
                    className={
                      elo.id === currentElo.id
                        ? elo.color
                        : "text-gray-600 dark:text-gray-400"
                    }
                    size={24}
                    strokeWidth={1.5}
                  />
                  <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                    {elo.name}
                  </span>
                </div>
                <span className="text-sm sm:text-base font-bold text-gray-600 dark:text-gray-400 flex-shrink-0">
                  {elo.xpRequired.toLocaleString("pt-BR")} XP
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

      {/* Modal de Upgrade removido - agora é gerenciado pelo XPContext no MainApp */}
    </div>
  );
}
