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
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Botão Voltar Flutuante */}
      {onNavigateToMore && <FloatingBackButton onClick={onNavigateToMore} />}

      {/* Header (centralizado no mobile) - AJUSTADO PARA XS (<360px) */}
      <div className="text-center mb-4 xs:mb-5 sm:mb-8">
        <div className="flex items-center justify-center gap-2 mb-2 xs:gap-1">
          <Star className="w-5 h-5 xs:w-5 sm:w-8 lg:w-8 text-emerald-500" />
          <h1 className="text-xl xs:text-xl sm:text-3xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
            Elo
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-xs xs:text-xs sm:text-base line-clamp-2">
          Acompanhe seu progresso e suba de nível
        </p>
      </div>

      {/* Hero Card - Elo Atual - AJUSTADO PARA XS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 xs:mt-5 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 xs:p-5 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col items-center text-center space-y-4 xs:space-y-4 sm:space-y-6">
          {/* Medalha com efeito de brilho - RESPONSIVA */}
          <div className="relative">
            <div className="w-16 h-16 xs:w-16 sm:w-20 md:w-32 md:h-32 flex items-center justify-center relative overflow-hidden rounded-full bg-white dark:bg-gray-800">
              {/* Ícone (base) - RESPONSIVO */}
              <currentElo.icon
                className={`${currentElo.color} md:hidden`}
                size={48}
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
            <h1 className="text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 xs:mb-1 sm:mb-2">
              {currentElo.name}
            </h1>
            <p className="text-base xs:text-sm sm:text-lg text-gray-600 dark:text-gray-400">
              {totalXP.toLocaleString("pt-BR")} XP
            </p>
          </div>

          {/* Barra de Progresso - RESPONSIVA */}
          <div className="w-full max-w-md space-y-1.5 xs:space-y-1.5">
            <div className="flex justify-between text-xs xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400 gap-1 overflow-hidden">
              <span className="truncate">
                {totalXP.toLocaleString("pt-BR")} /{" "}
                {nextElo ? nextElo.xpRequired.toLocaleString("pt-BR") : "∞"} XP
              </span>
              <span className="font-semibold flex-shrink-0">
                {Math.round(progress.progress)}%
              </span>
            </div>
            <div className="w-full h-3 xs:h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${currentElo.progressColor} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Texto motivacional - RESPONSIVO COM FLEX-COL PARA XS */}
          <p className="text-center text-gray-600 dark:text-gray-400 flex flex-col xs:flex-col sm:flex-row items-center justify-center gap-1.5 xs:gap-1 sm:gap-2 text-xs xs:text-xs sm:text-base break-words">
            {nextElo ? (
              <>
                Faltam{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  {progress.xpForNextElo.toLocaleString("pt-BR")}
                </span>{" "}
                XP para{" "}
                <span className="font-bold flex-shrink-0">{nextElo.name}</span>
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
                <Sparkles
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
            className="xs:w-full text-xs xs:text-sm"
          >
            Ver histórico de XP
          </Button>
        </div>
      </motion.div>

      {/* Lista de Elos - GRID RESPONSIVO PARA XS */}
      <div className="mt-6 xs:mt-5 sm:mt-8 space-y-2 xs:space-y-2 sm:space-y-4">
        <h2 className="text-lg xs:text-lg sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 px-1">
          <Trophy className="text-emerald-500 flex-shrink-0" size={22} />
          <span className="truncate">Todos os Elos</span>
        </h2>

        <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-2 sm:gap-4">
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
                  relative p-3 xs:p-3 sm:p-6 rounded-xl border-2 transition-all
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
                {/* Medalha - RESPONSIVA */}
                <div className="flex items-start xs:items-center gap-2 xs:gap-3 sm:gap-4 mb-2 xs:mb-3 sm:mb-4">
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
                      className={`text-base xs:text-base sm:text-xl font-bold truncate ${
                        isCurrent
                          ? elo.color
                          : isReached
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-gray-500"
                      }`}
                    >
                      {elo.name}
                    </h3>
                    <p className="text-xs xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                      {elo.xpRequired.toLocaleString("pt-BR")} XP
                    </p>
                  </div>
                </div>

                {/* Badge de Status - RESPONSIVO */}
                <div className="mt-2 xs:mt-2 sm:mt-4">
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-0.5 px-2 xs:px-2.5 sm:px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-semibold whitespace-nowrap">
                      <ArrowLeft size={12} />
                      Você está aqui
                    </span>
                  ) : isReached ? (
                    <span className="inline-flex items-center gap-0.5 px-2 xs:px-2.5 sm:px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-semibold whitespace-nowrap">
                      <Check size={12} />
                      Alcançado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-2 xs:px-2.5 sm:px-3 py-1 bg-gray-500 text-white rounded-full text-xs font-semibold flex-wrap">
                      <Lock size={12} className="flex-shrink-0" />
                      <span className="truncate">
                        Faltam {xpNeeded.toLocaleString("pt-BR")} XP
                      </span>
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Explicação de XP - GRID RESPONSIVO */}
      <div className="mt-6 xs:mt-5 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-3 sm:gap-6">
        {/* Como ganhar XP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 xs:p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-base xs:text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-3 xs:mb-3 sm:mb-4 flex items-center gap-2">
            <Lightbulb className="text-amber-500 flex-shrink-0" size={20} />
            <span className="truncate">Como ganhar XP?</span>
          </h3>
          <div className="space-y-2 xs:space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 xs:gap-2.5 sm:gap-3 p-2 xs:p-2.5 sm:p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <BookOpen
                className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0"
                size={18}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs xs:text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                  Tempo de estudo
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium truncate">
                  +1 XP por minuto
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  Teoria, questões ou revisão!
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 xs:gap-2.5 sm:gap-3 p-2 xs:p-2.5 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <FileText
                className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                size={18}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs xs:text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                  Questões corretas
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium truncate">
                  +5 XP por acerto
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  Erradas não dão XP
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 xs:gap-2.5 sm:gap-3 p-2 xs:p-2.5 sm:p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <Book
                className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0"
                size={18}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs xs:text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                  Páginas lidas
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 font-medium truncate">
                  +2 XP por página
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  Estudo por leitura!
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 xs:gap-2.5 sm:gap-3 p-2 xs:p-2.5 sm:p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <Trophy
                className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
                size={18}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs xs:text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                  Resgatar conquistas
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium truncate">
                  +50 a +500 XP
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  Bônus ao resgatar
                </p>
              </div>
            </div>
          </div>

          {/* Exemplo prático - RESPONSIVO */}
          <div className="mt-2 xs:mt-2.5 sm:mt-4 p-2 xs:p-2.5 sm:p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">
              Exemplo
            </p>
            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <div className="flex flex-col gap-1">
                <span className="font-medium line-clamp-2">
                  1h + 20 págs + 10 acertos
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 xs:p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-base xs:text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-3 xs:mb-3 sm:mb-4 flex items-center gap-2">
            <BarChart2
              className="text-blue-600 dark:text-blue-400 flex-shrink-0"
              size={20}
            />
            <span className="truncate">Requisitos XP</span>
          </h3>
          <div className="space-y-2 xs:space-y-2 sm:space-y-3 max-h-60 sm:max-h-none overflow-y-auto">
            {ELOS.map((elo) => (
              <div
                key={elo.id}
                className={`flex items-center justify-between p-2 xs:p-2.5 sm:p-3 rounded-lg gap-2 ${
                  elo.id === currentElo.id
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500"
                    : "bg-gray-50 dark:bg-gray-700/50"
                }`}
              >
                <div className="flex items-center gap-2 xs:gap-2.5 min-w-0">
                  <elo.icon
                    className={
                      elo.id === currentElo.id
                        ? elo.color
                        : "text-gray-600 dark:text-gray-400"
                    }
                    size={20}
                    strokeWidth={1.5}
                  />
                  <span className="font-semibold text-xs xs:text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                    {elo.name}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex-shrink-0">
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
