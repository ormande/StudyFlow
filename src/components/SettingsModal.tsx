import { X, Instagram, AlertTriangle, Moon, Sun, Download, Upload } from 'lucide-react';
import { useRef } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHardReset: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  onHardReset, 
  isDarkMode, 
  onToggleTheme 
}: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = {
      subjects: JSON.parse(localStorage.getItem('studyflow_subjects') || '[]'),
      logs: JSON.parse(localStorage.getItem('studyflow_logs') || '[]'),
      cycleStartDate: JSON.parse(localStorage.getItem('studyflow_cycle_start') || 'null'),
      exportedAt: new Date().toISOString(),
      version: '1.1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studyflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        if (!data.subjects || !data.logs) {
          alert('Arquivo inválido! Verifique se é um backup do StudyFlow.');
          return;
        }

        const confirmImport = confirm(
          `Isso vai substituir seus dados atuais por:\n\n` +
          `• ${data.subjects.length} matéria(s)\n` +
          `• ${data.logs.length} registro(s)\n\n` +
          `Deseja continuar?`
        );

        if (confirmImport) {
          localStorage.setItem('studyflow_subjects', JSON.stringify(data.subjects));
          localStorage.setItem('studyflow_logs', JSON.stringify(data.logs));
          if (data.cycleStartDate) {
            localStorage.setItem('studyflow_cycle_start', JSON.stringify(data.cycleStartDate));
          }
          alert('Dados importados com sucesso! O app vai recarregar.');
          window.location.reload();
        }
      } catch {
        alert('Erro ao ler o arquivo. Verifique se é um JSON válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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
               className="w-full py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white active:scale-95"
             >
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
               {isDarkMode ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
             </button>
          </div>

          {/* SEÇÃO SEUS DADOS */}
          <div className="text-center pb-4 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 uppercase font-bold mb-3">Seus Dados</p>
            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95"
              >
                <Download size={18} />
                Exportar Backup
              </button>
              <button
                onClick={handleImportClick}
                className="w-full py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white active:scale-95"
              >
                <Upload size={18} />
                Importar Backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Use para backup ou trocar de dispositivo
            </p>
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