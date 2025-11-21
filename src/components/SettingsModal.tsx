import { X, Instagram, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHardReset: () => void;
}

export default function SettingsModal({ isOpen, onClose, onHardReset }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Configurações</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Sobre */}
          <div className="text-center pb-4 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase font-bold mb-2">Desenvolvido por</p>
            <p className="font-bold text-gray-800 text-lg">Kayke Paião</p>
            <a 
              href="https://instagram.com/paiao.kayke" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm mt-2 hover:underline"
            >
              <Instagram size={16} />
              @paiao.kayke
            </a>
          </div>

          {/* Zona de Perigo - CENTRALIZADA E BOTÃO SÓLIDO */}
          <div className="text-center">
            <p className="text-xs text-red-400 uppercase font-bold mb-3">Zona de Perigo</p>
            <button 
              onClick={onHardReset}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <AlertTriangle size={18} />
              Resetar Tudo / Novo Concurso
            </button>
          </div>

          <p className="text-[10px] text-center text-gray-400 pt-2">
            Versão 1.0.0 • StudyFlow
          </p>
        </div>
      </div>
    </div>
  );
}