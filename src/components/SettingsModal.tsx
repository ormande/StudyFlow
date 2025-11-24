import { X, Instagram, AlertTriangle, Moon, Sun } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHardReset: () => void;
  isDarkMode: boolean;       // Recebe o estado atual
  onToggleTheme: () => void; // Recebe a função de troca
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  onHardReset, 
  isDarkMode, 
  onToggleTheme 
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 transition-colors">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 transition-colors">
          <h3 className="font-bold text-gray-800 dark:text-white">Configurações</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          
          {/* BOTÃO MODO ESCURO/CLARO */}
          <div className="text-center pb-4 border-b border-gray-100 dark:border-gray-700">
             <p className="text-xs text-gray-400 uppercase font-bold mb-3">Aparência</p>
             <button
               onClick={onToggleTheme}
               className={`w-full py-3 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2 border-2 ${
                 isDarkMode 
                   ? 'bg-gray-700 border-gray-600 text-yellow-400 hover:bg-gray-600' 
                   : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'
               }`}
             >
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
               {isDarkMode ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
             </button>
          </div>

          <div className="text-center pb-4 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 uppercase font-bold mb-2">Desenvolvido por</p>
            <p className="font-bold text-gray-800 dark:text-white text-lg">Kayke Paião</p>
            <a href="https://instagram.com/paiao.kayke" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm mt-2 hover:underline">
              <Instagram size={16} /> @paiao.kayke
            </a>
          </div>

          <div className="text-center">
            <p className="text-xs text-red-400 uppercase font-bold mb-3">Zona de Perigo</p>
            <button onClick={onHardReset} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2">
              <AlertTriangle size={18} /> Resetar Tudo
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 pt-2">Versão 1.1.0 • StudyFlow</p>
        </div>
      </div>
    </div>
  );
}