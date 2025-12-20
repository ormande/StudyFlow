import { useState } from 'react';
import { X, BookOpen, HelpCircle, RefreshCw, Filter } from 'lucide-react';
import { Subject, StudyLog, StudyType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: StudyLog[];
  subjects: Subject[];
  onDeleteLog: (id: string) => void;
  onEditLog: (id: string, updates: Partial<StudyLog>) => void;
}

export default function HistoryModal({
  isOpen,
  onClose,
  logs,
  subjects,
}: HistoryModalProps) {
  const [filterSubject, setFilterSubject] = useState<string>('all');

  // Obter data de hoje no formato YYYY-MM-DD
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Filtrar apenas logs do dia atual
  const filteredLogs = [...logs]
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter((log) => {
      const isToday = log.date === todayString;
      const subjectMatch = filterSubject === 'all' || log.subjectId === filterSubject;
      return isToday && subjectMatch;
    });

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || 'Matéria Excluída';
  };

  const getSubjectColor = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.color || '#6b7280';
  };

  const getTypeLabel = (type: StudyType) => {
    const labels = { teoria: 'Teoria', questoes: 'Questões', revisao: 'Revisão' };
    return labels[type];
  };

  const getTypeIcon = (type: StudyType) => {
    const icons = { teoria: BookOpen, questoes: HelpCircle, revisao: RefreshCw };
    return icons[type];
  };

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
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl transition-colors flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 flex-shrink-0">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">Histórico de Hoje</h3>
              <button 
                onClick={onClose} 
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label="Fechar Modal"
                title="Fechar Modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filtro */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="all">Todas as matérias</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de Registros */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredLogs.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Nenhum registro encontrado para hoje.
                </p>
              ) : (
                filteredLogs.map((log) => {
                  const TypeIcon = getTypeIcon(log.type);
                  const logMinutes = log.hours * 60 + log.minutes;

                  return (
                    <div
                      key={log.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 transition-colors"
                    >
                      {/* Header do registro */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getSubjectColor(log.subjectId) }}
                          />
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {getSubjectName(log.subjectId)}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Info do tipo */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <TypeIcon size={14} />
                        <span>{getTypeLabel(log.type)}</span>
                        <span>•</span>
                        <span>{logMinutes} min</span>
                        {log.type === 'teoria' && log.pages && (
                          <>
                            <span>•</span>
                            <span>{log.pages} págs</span>
                          </>
                        )}
                        {log.type === 'questoes' && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{log.correct || 0}✓</span>
                            <span className="text-red-600 dark:text-red-400">{log.wrong || 0}✗</span>
                            <span className="text-blue-600 dark:text-blue-400">{log.blank || 0}○</span>
                          </>
                        )}
                      </div>

                      {/* Observações */}
                      {log.notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic pt-2 border-t border-gray-200 dark:border-gray-600">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {filteredLogs.length} registro(s) de hoje
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
