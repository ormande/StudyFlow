import { X, Instagram, AlertTriangle, Moon, Sun, Download, Upload, Target, Settings } from 'lucide-react';
import { useRef } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHardReset: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  dailyGoal: number;
  onSetDailyGoal: (minutes: number) => void;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  onHardReset, 
  isDarkMode, 
  onToggleTheme,
  dailyGoal,
  onSetDailyGoal
}: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = {
      subjects: JSON.parse(localStorage.getItem('studyflow_subjects') || '[]'),
      logs: JSON.parse(localStorage.getItem('studyflow_logs') || '[]'),
      cycleStartDate: JSON.parse(localStorage.getItem('studyflow_cycle_start') || 'null'),
      dailyGoal: JSON.parse(localStorage.getItem('studyflow_daily_goal') || '0'),
      exportedAt: new Date().toISOString(),
      version: '1.2.0'
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
          if (data.dailyGoal) {
             localStorage.setItem('studyflow_daily_goal', JSON.stringify(data.dailyGoal));
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-xs md:max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 transition-colors">
        
        {/* CABEÇALHO PADRONIZADO */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 transition-colors flex-shrink-0 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
             <Settings size={20} className="text-emerald-500"/> Configurações
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* CORPO */}
        <div className="p-6 overflow-y-auto">
          
          <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8">
            
            {/* COLUNA ESQUERDA */}
            <div className="space-y-6">
                {/* APARÊNCIA */}
                <div className="text-center md:text-left pb-4 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-3">Aparência</p>
                  <button
                    onClick={onToggleTheme}
                    className={`w-full py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 text-white active:scale-95 ${
                      isDarkMode 
                        ? 'bg-amber-500 hover:bg-amber-600' // Amarelo quando for ativar modo claro
                        : 'bg-indigo-500 hover:bg-indigo-600' // Indigo quando for ativar modo escuro
                    }`}
                  >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    {isDarkMode ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
                  </button>
                </div>

                {/* META DIÁRIA */}
                <div className="text-center md:text-left pb-4 border-b border-gray-100 dark:border-gray-700 md:border-none">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <Target className="text-emerald-500" size={16} />
                    <p className="text-xs text-gray-400 uppercase font-bold">Meta Diária</p>
                  </div>
                  
                  <div className="mb-3 flex items-baseline justify-center md:justify-start gap-1">
                    <span className="text-3xl font-black text-gray-800 dark:text-white">
                      {Math.floor(dailyGoal / 60)}h
                    </span>
                    <span className="text-xs text-gray-400 font-medium">por dia</span>
                  </div>

                  <input 
                    type="range" 
                    min="0" 
                    max="12" 
                    step="1"
                    value={Math.floor(dailyGoal / 60)}
                    onChange={(e) => onSetDailyGoal(parseInt(e.target.value) * 60)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-emerald-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-2 text-center md:text-left">
                    {dailyGoal === 0 ? "Arraste para definir" : "Foco na missão!"}
                  </p>
                </div>
            </div>

            {/* COLUNA DIREITA */}
            <div className="space-y-6">
                {/* DADOS */}
                <div className="text-center md:text-left pb-4 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-3">Seus Dados</p>
                  <div className="space-y-3">
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
                  <p className="text-[10px] text-gray-400 mt-2 text-center md:text-left">
                    Use para backup ou trocar de dispositivo
                  </p>
                </div>

                {/* ZONA DE PERIGO */}
                <div className="text-center md:text-left">
                  <p className="text-xs text-red-400 uppercase font-bold mb-3">Zona de Perigo</p>
                  <button onClick={onHardReset} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2">
                    <AlertTriangle size={18} /> Resetar Tudo
                  </button>
                </div>
            </div>
          </div>

          {/* RODAPÉ */}
          <div className="text-center mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="font-bold text-gray-800 dark:text-white text-sm">Desenvolvido por Kayke Paião</p>
            <a href="https://instagram.com/paiao.kayke" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs mt-1 hover:underline">
              <Instagram size={14} /> @paiao.kayke
            </a>
            <p className="text-[10px] text-gray-400 mt-2">Versão 1.2.0 • StudyFlow</p>
          </div>
        </div>
      </div>
    </div>
  );
}