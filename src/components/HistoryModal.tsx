import { useState } from 'react';
import { X, Trash2, Pencil, Check, BookOpen, HelpCircle, RefreshCw } from 'lucide-react';
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
  onDeleteLog,
  onEditLog,
}: HistoryModalProps) {
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StudyLog>>({});

  const filteredLogs = [...logs]
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter((log) => filterSubject === 'all' || log.subjectId === filterSubject);

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

  const startEditing = (log: StudyLog) => {
    setEditingId(log.id);
    setEditForm({
      hours: log.hours,
      minutes: log.minutes,
      seconds: log.seconds || 0,
      pages: log.pages,
      correct: log.correct,
      wrong: log.wrong,
      blank: log.blank,
      notes: log.notes,
    });
  };

  const saveEdit = (log: StudyLog) => {
    onEditLog(log.id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
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
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">Histórico Completo</h3>
              <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>

            {/* Filtro */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="all">Todas as matérias</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Lista de Registros */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredLogs.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Nenhum registro encontrado.
                </p>
              ) : (
                filteredLogs.map((log) => {
                  const TypeIcon = getTypeIcon(log.type);
                  const isEditing = editingId === log.id;
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
                          {new Date(log.timestamp).toLocaleDateString('pt-BR')}
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
                          </>
                        )}
                      </div>

                      {/* Modo de edição */}
                      {isEditing ? (
                        <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Horas</label>
                              <input
                                type="number"
                                value={editForm.hours || 0}
                                onChange={(e) => setEditForm({ ...editForm, hours: parseInt(e.target.value) || 0 })}
                                className="w-full p-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-center font-bold text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Min</label>
                              <input
                                type="number"
                                value={editForm.minutes || 0}
                                onChange={(e) => setEditForm({ ...editForm, minutes: parseInt(e.target.value) || 0 })}
                                className="w-full p-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-center font-bold text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Seg</label>
                              <input
                                type="number"
                                value={editForm.seconds || 0}
                                onChange={(e) => setEditForm({ ...editForm, seconds: parseInt(e.target.value) || 0 })}
                                className="w-full p-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-center font-bold text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>

                          {log.type === 'teoria' && (
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Páginas</label>
                              <input
                                type="number"
                                value={editForm.pages || 0}
                                onChange={(e) => setEditForm({ ...editForm, pages: parseInt(e.target.value) || 0 })}
                                className="w-full p-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg font-bold text-gray-900 dark:text-white"
                              />
                            </div>
                          )}

                          {log.type === 'questoes' && (
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Certas</label>
                                <input
                                  type="number"
                                  value={editForm.correct || 0}
                                  onChange={(e) => setEditForm({ ...editForm, correct: parseInt(e.target.value) || 0 })}
                                  className="w-full p-2 bg-white dark:bg-gray-600 border border-emerald-500 rounded-lg text-center font-bold text-emerald-700 dark:text-emerald-300"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">Erradas</label>
                                <input
                                  type="number"
                                  value={editForm.wrong || 0}
                                  onChange={(e) => setEditForm({ ...editForm, wrong: parseInt(e.target.value) || 0 })}
                                  className="w-full p-2 bg-white dark:bg-gray-600 border border-red-500 rounded-lg text-center font-bold text-red-700 dark:text-red-300"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Branco</label>
                                <input
                                  type="number"
                                  value={editForm.blank || 0}
                                  onChange={(e) => setEditForm({ ...editForm, blank: parseInt(e.target.value) || 0 })}
                                  className="w-full p-2 bg-white dark:bg-gray-600 border border-gray-400 rounded-lg text-center font-bold text-gray-700 dark:text-gray-300"
                                />
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Observações</label>
                            <input
                              type="text"
                              value={editForm.notes || ''}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              className="w-full p-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-gray-900 dark:text-white"
                              placeholder="Observações..."
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(log)}
                              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                            >
                              <Check size={16} /> Salvar
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg font-bold transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Observações */}
                          {log.notes && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-3">
                              {log.notes}
                            </p>
                          )}

                          {/* Botões de ação */}
                          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <button
                              onClick={() => startEditing(log)}
                              className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <Pencil size={14} /> Editar
                            </button>
                            <button
                              onClick={() => onDeleteLog(log.id)}
                              className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <Trash2 size={14} /> Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {filteredLogs.length} registro(s)
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}