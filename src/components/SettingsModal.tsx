import { X, Instagram, AlertTriangle, Moon, Sun, Target, Settings, Eye, EyeOff, Palette, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHardReset: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  dailyGoal: number;
  onSetDailyGoal: (minutes: number) => void;
  showPerformance: boolean;
  onTogglePerformance: () => void;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  onHardReset, 
  isDarkMode, 
  onToggleTheme,
  dailyGoal,
  onSetDailyGoal,
  showPerformance,
  onTogglePerformance
}: SettingsModalProps) {

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-xs md:max-w-2xl max-h-[90vh] flex flex-col shadow-2xl transition-colors"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 transition-colors flex-shrink-0 rounded-t-2xl">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Settings size={20} className="text-emerald-500"/> Configurações
              </h3>
              <button onClick={onClose} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* COLUNA 1: Preferências */}
                <div className="space-y-5">
                  
                  {/* Título da Seção */}
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Palette size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Preferências</span>
                  </div>

                  {/* Card: Aparência */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white text-sm">Tema</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isDarkMode ? 'Modo escuro ativo' : 'Modo claro ativo'}
                        </p>
                      </div>
                      <button
                        onClick={onToggleTheme}
                        className={`p-3 rounded-xl transition-all active:scale-95 ${
                          isDarkMode 
                            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                            : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                        }`}
                      >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Card: Meta Diária */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target size={16} className="text-emerald-500" />
                      <p className="font-semibold text-gray-800 dark:text-white text-sm">Meta Diária</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="12" 
                        step="1"
                        value={Math.floor(dailyGoal / 60)}
                        onChange={(e) => onSetDailyGoal(parseInt(e.target.value) * 60)}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-emerald-500"
                      />
                      <div className="w-16 text-center">
                        <span className="text-2xl font-black text-emerald-500">{Math.floor(dailyGoal / 60)}h</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {dailyGoal === 0 ? "Arraste para definir sua meta" : "Meta definida! Foco na missão."}
                    </p>
                  </div>

                  {/* Card: Privacidade */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-teal-500" />
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white text-sm">Privacidade</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {showPerformance ? 'Desempenho visível' : 'Desempenho oculto'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={onTogglePerformance}
                        className={`p-3 rounded-xl transition-all active:scale-95 ${
                          showPerformance 
                            ? 'bg-teal-500 hover:bg-teal-600 text-white' 
                            : 'bg-gray-400 hover:bg-gray-500 text-white'
                        }`}
                      >
                        {showPerformance ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* COLUNA 2: Conta e Perigo */}
                <div className="space-y-5">
                  
                  {/* Zona de Perigo (Mantivemos para Logout/Reset) */}
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Zona de Perigo</span>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                    <p className="font-semibold text-red-600 dark:text-red-400 text-sm mb-3">Sair da Conta</p>
                    <button 
                      onClick={onHardReset} 
                      className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <AlertTriangle size={16} /> Sair / Deslogar
                    </button>
                    <p className="text-[10px] text-red-400 mt-2 text-center">
                      Você será desconectado deste dispositivo
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
              <div className="text-center">
                <p className="font-bold text-gray-800 dark:text-white text-sm">Desenvolvido por Kayke Paião</p>
                <a 
                  href="https://instagram.com/paiao.kayke" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs mt-1 hover:underline"
                >
                  <Instagram size={14} /> @paiao.kayke
                </a>
                <p className="text-[10px] text-gray-400 mt-1">Versão 1.4.0 • StudyFlow</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}