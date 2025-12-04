import { X, Instagram, AlertTriangle, Moon, Sun, Download, Upload, Target, Settings, Eye, EyeOff, Palette, Database, Shield } from 'lucide-react';
import { useRef } from 'react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = {
      subjects: JSON.parse(localStorage.getItem('studyflow_subjects') || '[]'),
      logs: JSON.parse(localStorage.getItem('studyflow_logs') || '[]'),
      cycleStartDate: JSON.parse(localStorage.getItem('studyflow_cycle_start') || 'null'),
      dailyGoal: JSON.parse(localStorage.getItem('studyflow_daily_goal') || '0'),
      showPerformance: JSON.parse(localStorage.getItem('studyflow_show_performance') || 'true'),
      exportedAt: new Date().toISOString(),
      version: '1.3.0'
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
          if (data.cycleStartDate) localStorage.setItem('studyflow_cycle_start', JSON.stringify(data.cycleStartDate));
          if (data.dailyGoal) localStorage.setItem('studyflow_daily_goal', JSON.stringify(data.dailyGoal));
          if (data.showPerformance !== undefined) localStorage.setItem('studyflow_show_performance', JSON.stringify(data.showPerformance));
          
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
                        {showPerformance ? 'Desempenho visível ao compartilhar' : 'Desempenho oculto ao compartilhar'}
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

            {/* COLUNA 2: Dados */}
            <div className="space-y-5">
              
              {/* Título da Seção */}
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Database size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Seus Dados</span>
              </div>

              {/* Card: Backup */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">Backup</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Salve ou restaure seus dados</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleExport} 
                    className="py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95"
                  >
                    <Download size={16} /> Exportar
                  </button>
                  <button 
                    onClick={handleImportClick} 
                    className="py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white active:scale-95"
                  >
                    <Upload size={16} /> Importar
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                
                <p className="text-[10px] text-gray-400 text-center">
                  Use para backup ou trocar de dispositivo
                </p>
              </div>

              {/* Card: Zona de Perigo */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-red-500" />
                  <p className="font-semibold text-red-600 dark:text-red-400 text-sm">Zona de Perigo</p>
                </div>
                <button 
                  onClick={onHardReset} 
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={16} /> Resetar Tudo
                </button>
                <p className="text-[10px] text-red-400 mt-2 text-center">
                  Apaga todas as matérias e histórico
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
            <p className="text-[10px] text-gray-400 mt-1">Versão 1.3.0 • StudyFlow</p>
          </div>
        </div>
      </div>
    </div>
  );
}