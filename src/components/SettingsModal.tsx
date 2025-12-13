import { useState } from 'react';
import { X, Instagram, AlertTriangle, Moon, Sun, Target, Settings, Eye, EyeOff, Lock, Database, FileSpreadsheet, FileText, Bell, BellOff, LogOut, Trash2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Subject, StudyLog } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNotification } from '../hooks/useNotification';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from './ConfirmModal';
import ChangePasswordModal from './ChangePasswordModal';
// i18n guardado para uso futuro:
// Para reativar: descomente a linha abaixo e adicione o seletor de idioma na seção "Preferências & Foco"
// import { useTranslation } from 'react-i18next';
// import { Globe } from 'lucide-react';

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
  subjects: Subject[];
  logs: StudyLog[];
  userEmail: string | undefined;
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
  onTogglePerformance,
  subjects,
  logs,
  userEmail
}: SettingsModalProps) {
  // Estados para confirmações
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFactoryResetConfirm, setShowFactoryResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  // Hook de notificações
  const { permission, requestPermission, sendNotification } = useNotification();
  const { addToast } = useToast();
  
  // i18n guardado para uso futuro:
  // const { t, i18n } = useTranslation();

  if (!isOpen) return null;

  // Função para Exportar CSV (Compatível com Excel Brasil)
  const handleExportCSV = () => {
    // Cabeçalhos do CSV
    const headers = ['Data', 'Matéria', 'Tipo', 'Tempo (min)', 'Páginas', 'Acertos', 'Erros', 'Notas'];
    
    // Separador para Excel brasileiro (ponto e vírgula)
    const SEPARATOR = ';';
    
    // Função para sanitizar notas: remove quebras de linha e pontos e vírgula
    const sanitizeNotes = (notes: string | undefined | null): string => {
      if (!notes) return '';
      return notes
        .replace(/\n/g, ' ') // Substitui quebras de linha por espaço
        .replace(/;/g, ',')  // Substitui ponto e vírgula por vírgula
        .trim();
    };
    
    // Função para escapar campos CSV (agora trata ponto e vírgula)
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Se contém ponto e vírgula, aspas ou quebra de linha, envolve em aspas e duplica aspas internas
      if (str.includes(';') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Função para formatar números no padrão brasileiro (vírgula como separador decimal)
    const formatNumberBR = (num: number): string => {
      return num.toFixed(2).replace('.', ',');
    };

    // Mapear logs para linhas CSV
    const rows = logs.map(log => {
      // Encontrar o nome da matéria
      const subject = subjects.find(s => s.id === log.subjectId);
      const subjectName = subject?.name || 'Desconhecida';
      
      // Calcular tempo total em minutos
      const totalMinutes = (log.hours || 0) * 60 + (log.minutes || 0) + ((log.seconds || 0) / 60);
      
      // Formatar data (assumindo que log.date está no formato ISO ou similar)
      const date = log.date ? new Date(log.date).toLocaleDateString('pt-BR') : '';
      
      // Sanitizar notas antes de processar
      const sanitizedNotes = sanitizeNotes(log.notes);
      
      return [
        escapeCSV(date),
        escapeCSV(subjectName),
        escapeCSV(log.type),
        escapeCSV(formatNumberBR(totalMinutes)), // Formato brasileiro com vírgula
        escapeCSV(log.pages || ''),
        escapeCSV(log.correct || ''),
        escapeCSV(log.wrong || ''),
        escapeCSV(sanitizedNotes)
      ].join(SEPARATOR);
    });

    // Combinar cabeçalhos e linhas com separador ponto e vírgula
    const csvContent = [headers.join(SEPARATOR), ...rows].join('\n');
    
    // Criar Blob com BOM para Excel reconhecer UTF-8 corretamente (acentos)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Criar link temporário e disparar download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'studyflow_backup.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Função para Exportar PDF Profissional
  const handleExportPDF = () => {
    // Criar instância do jsPDF
    const doc = new jsPDF();
    
    // Cabeçalho da Marca - Retângulo colorido
    doc.setFillColor(16, 185, 129); // RGB do Emerald-500
    doc.rect(0, 0, 210, 40, 'F'); // Retângulo preenchendo a largura da página
    
    // Texto "StudyFlow" no cabeçalho (branco)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('StudyFlow', 15, 20);
    
    // Texto "Relatório de Desempenho" (branco, menor)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Desempenho', 15, 30);
    
    // Metadados - Abaixo do cabeçalho
    doc.setTextColor(0, 0, 0); // Preto
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    doc.text(`Aluno: ${userEmail || 'Não identificado'}`, 15, 50);
    doc.text(`Gerado em: ${currentDate}`, 15, 56);
    
    // Preparar dados da tabela
    const tableData = logs.map(log => {
      const subject = subjects.find(s => s.id === log.subjectId);
      const subjectName = subject?.name || 'Desconhecida';
      const totalMinutes = (log.hours || 0) * 60 + (log.minutes || 0) + ((log.seconds || 0) / 60);
      const date = log.date ? new Date(log.date).toLocaleDateString('pt-BR') : '';
      
      return [
        date,
        subjectName,
        log.type,
        totalMinutes.toFixed(2).replace('.', ','),
        log.pages?.toString() || '-',
        log.correct?.toString() || '-'
      ];
    });
    
    // Adicionar tabela usando autoTable
    autoTable(doc, {
      startY: 65,
      head: [['Data', 'Matéria', 'Tipo', 'Tempo (min)', 'Páginas', 'Acertos']],
      body: tableData,
      headStyles: {
        fillColor: [16, 185, 129], // Emerald-500
        textColor: [255, 255, 255], // Branco
        fontStyle: 'bold',
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250] // Cinza claro para zebra striping
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Data
        1: { cellWidth: 50 }, // Matéria
        2: { cellWidth: 25 }, // Tipo
        3: { cellWidth: 25 }, // Tempo
        4: { cellWidth: 20 }, // Páginas
        5: { cellWidth: 20 }  // Acertos
      }
    });
    
    // Salvar o PDF
    doc.save('studyflow_relatorio.pdf');
  };

  // Função para Factory Reset (Zerar todos os dados)
  const handleFactoryReset = async () => {
    setIsResetting(true);
    try {
      // Obter sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const userId = session.user.id;

      // Deletar todos os logs de estudo
      const { error: logsError } = await supabase
        .from('study_logs')
        .delete()
        .eq('user_id', userId);

      if (logsError) throw logsError;

      // Deletar todas as matérias (e subtópicos via cascade se configurado)
      const { error: subjectsError } = await supabase
        .from('subjects')
        .delete()
        .eq('user_id', userId);

      if (subjectsError) throw subjectsError;

      // Fechar modal de confirmação
      setShowFactoryResetConfirm(false);
      
      // Mostrar sucesso e recarregar página
      addToast('Todos os dados foram apagados com sucesso! A página será recarregada.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao resetar dados:', error);
      addToast('Erro ao apagar dados: ' + (error?.message || 'Erro desconhecido'), 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {/* Modal de Alteração de Senha */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      {/* Modal de Confirmação de Logout */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sair do App?"
        message="Você será desconectado da sua conta."
        confirmText="Sair"
        cancelText="Voltar"
        variant="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onHardReset();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Modal de Confirmação de Factory Reset */}
      <ConfirmModal
        isOpen={showFactoryResetConfirm}
        title="Zerar Todos os Dados?"
        message="Esta ação é IRREVERSÍVEL!\n\nTodos os seus registros de estudo, matérias e configurações serão apagados permanentemente.\n\nTem certeza absoluta?"
        confirmText={isResetting ? "Apagando..." : "Sim, apagar tudo"}
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleFactoryReset}
        onCancel={() => setShowFactoryResetConfirm(false)}
      />

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
                <button 
                  onClick={onClose} 
                  className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Fechar Modal"
                  title="Fechar Modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Conteúdo com Scroll */}
              <div className="p-5 overflow-y-auto flex-1 space-y-6">
                {/* SEÇÃO 1: PREFERÊNCIAS & FOCO */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-3">
                    <Zap size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Preferências & Foco</span>
                  </div>

                  {/* Meta Diária - Destaque */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-4">
                      <Target size={18} className="text-emerald-500" />
                      <p className="font-bold text-gray-800 dark:text-white text-base">Meta Diária</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="12" 
                        step="1"
                        value={Math.floor(dailyGoal / 60)}
                        onChange={(e) => onSetDailyGoal(parseInt(e.target.value) * 60)}
                        className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-emerald-500"
                      />
                      <div className="w-20 text-center">
                        <span className="text-3xl font-black text-emerald-500">{Math.floor(dailyGoal / 60)}h</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                      {dailyGoal === 0 ? "Arraste para definir sua meta diária" : "Meta definida! Foco na missão."}
                    </p>
                  </div>

                  {/* Ajustes Rápidos - Grid de 3 cartões */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Tema */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 flex flex-col items-center gap-2">
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
                      <p className="text-xs font-semibold text-gray-800 dark:text-white text-center">Tema</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                        {isDarkMode ? 'Escuro' : 'Claro'}
                      </p>
                    </div>

                    {/* Privacidade */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 flex flex-col items-center gap-2">
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
                      <p className="text-xs font-semibold text-gray-800 dark:text-white text-center">Privacidade</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                        {showPerformance ? 'Visível' : 'Oculto'}
                      </p>
                    </div>

                    {/* Notificações */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 flex flex-col items-center gap-2">
                      {permission === 'granted' ? (
                        <>
                          <button
                            onClick={() => sendNotification('StudyFlow', { body: 'O sistema está funcionando! 🔔' })}
                            className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all active:scale-95"
                          >
                            <Bell size={20} />
                          </button>
                          <p className="text-xs font-semibold text-gray-800 dark:text-white text-center">Notificações</p>
                          <p className="text-[10px] text-emerald-500 text-center">Ativas</p>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={requestPermission}
                            className="p-3 rounded-xl bg-gray-400 hover:bg-gray-500 text-white transition-all active:scale-95"
                          >
                            <BellOff size={20} />
                          </button>
                          <p className="text-xs font-semibold text-gray-800 dark:text-white text-center">Notificações</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">Desativadas</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 2: DADOS & RELATÓRIOS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-3">
                    <Database size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Dados & Relatórios</span>
                  </div>

                  {/* Grid de 2 botões lado a lado */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Exportar CSV */}
                    <button
                      onClick={handleExportCSV}
                      className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95 border border-blue-200 dark:border-blue-800"
                    >
                      <div className="p-3 bg-blue-500 rounded-xl text-white">
                        <FileSpreadsheet size={24} />
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white text-center">Exportar CSV</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">Compatível Excel</p>
                    </button>

                    {/* Exportar PDF */}
                    <button
                      onClick={handleExportPDF}
                      className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95 border border-red-200 dark:border-red-800"
                    >
                      <div className="p-3 bg-red-500 rounded-xl text-white">
                        <FileText size={24} />
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white text-center">Exportar PDF</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">Relatório profissional</p>
                    </button>
                  </div>
                </div>

                {/* SEÇÃO 3: CONTA */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-3">
                    <Lock size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Conta</span>
                  </div>

                  {/* Alterar Senha */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock size={16} className="text-emerald-500" />
                      <p className="font-semibold text-gray-800 dark:text-white text-sm">Segurança</p>
                    </div>
                    <button
                      onClick={() => setShowChangePasswordModal(true)}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <Lock size={18} />
                      Alterar Senha
                    </button>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
                      Defina uma nova senha para sua conta
                    </p>
                  </div>
                </div>

                {/* SEÇÃO 4: ZONA DE PERIGO */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-400 dark:text-red-500 mb-3">
                    <AlertTriangle size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Zona de Perigo</span>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border-2 border-red-200 dark:border-red-800">
                    {/* Botão Sair (Logout) - Estilo ghost */}
                    <button 
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-full py-3 mb-3 border-2 border-red-500 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <LogOut size={18} />
                      Sair (Logout)
                    </button>

                    {/* Botão Zerar Tudo (Factory Reset) - Estilo sólido vermelho */}
                    <button 
                      onClick={() => setShowFactoryResetConfirm(true)}
                      disabled={isResetting}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      {isResetting ? 'Apagando...' : 'Zerar Tudo'}
                    </button>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-3 text-center font-medium">
                      ⚠️ Apagar todos os dados e começar do zero
                    </p>
                    <p className="text-[10px] text-red-500 dark:text-red-600 mt-1 text-center">
                      Esta ação é IRREVERSÍVEL e apagará todos os seus registros permanentemente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors flex-shrink-0 rounded-b-2xl">
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
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Versão 1.5.0 • StudyFlow</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}