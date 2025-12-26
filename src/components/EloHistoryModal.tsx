import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp } from 'lucide-react';
import { XPHistoryEntry } from '../types/elo';

interface EloHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  xpHistory: XPHistoryEntry[];
  totalXP: number;
}

export default function EloHistoryModal({ isOpen, onClose, xpHistory, totalXP }: EloHistoryModalProps) {
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days < 7) {
      return `${days} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  // Garante que o código só rode no cliente
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6"
          style={{ width: '100vw', height: '100vh', left: 0, top: 0, right: 0, bottom: 0 }}
        >
          {/* Backdrop Escuro (Cobre tudo) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ width: '100vw', height: '100vh', left: 0, top: 0, right: 0, bottom: 0 }}
          />

          {/* Card do Modal (Centralizado) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar dentro
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={24} />
                  Histórico de XP
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Seus últimos ganhos
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content (Com Scroll) */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {xpHistory.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="text-gray-400" size={24} />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Sem histórico ainda. Bora estudar!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {xpHistory.slice(0, 20).map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                        entry.isBonus ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                      }`}>
                        {entry.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {entry.reason}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(entry.date)}
                        </p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg font-bold text-xs whitespace-nowrap ${
                        entry.isBonus
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      }`}>
                        +{entry.amount} XP
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Acumulado
                </span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {totalXP.toLocaleString('pt-BR')} XP
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body // Renderiza fora da árvore DOM principal
  );
}