import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { Trash2, Pencil, Check, X, Filter, History, ArrowLeft, Loader2, Search, Circle } from 'lucide-react';
import { Subject, StudyLog, StudyType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import { FADE_UP_ANIMATION, STAGGER_CONTAINER, STAGGER_ITEM } from '../utils/animations';

interface HistoryPageProps {
  logs: StudyLog[];
  subjects: Subject[];
  onDeleteLog: (id: string) => void;
  onEditLog: (id: string, updates: Partial<StudyLog>) => void;
  onNavigateBack?: () => void;
  hasMoreLogs?: boolean;
  loadingMoreLogs?: boolean;
  onLoadMore?: () => void;
  onSearch?: (term: string) => void;
  searchTerm?: string;
  daysFilter?: number | null;
  onDaysFilterChange?: (days: number | null) => void;
}

export default function HistoryPage({
  logs,
  subjects,
  onDeleteLog,
  onEditLog,
  onNavigateBack,
  hasMoreLogs = false,
  loadingMoreLogs = false,
  onLoadMore,
  onSearch,
  searchTerm = '',
  daysFilter = 30,
  onDaysFilterChange,
}: HistoryPageProps) {
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StudyLog>>({});
  const [localSearchTerm, setLocalSearchTerm] = useState<string>(searchTerm);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce para busca (500ms após parar de digitar)
  useEffect(() => {
    // Não fazer nada se o termo local já está sincronizado com o externo
    if (localSearchTerm === searchTerm) return;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (onSearch && localSearchTerm !== searchTerm) {
        onSearch(localSearchTerm);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localSearchTerm, searchTerm, onSearch]);

  // Sincronizar localSearchTerm com searchTerm externo (quando busca é limpa externamente)
  useEffect(() => {
    if (searchTerm === '' && localSearchTerm !== '') {
      setLocalSearchTerm('');
    }
  }, [searchTerm]);

  const filteredLogs = [...logs]
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter((log) => {
      const subjectMatch = filterSubject === 'all' || log.subjectId === filterSubject;
      return subjectMatch;
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

  // Função para sanitizar input numérico
  const sanitizeNumericInput = (value: string, max?: number, min: number = 0): number => {
    if (value === '') return min;
    const num = parseInt(value);
    if (isNaN(num) || num < min) return min;
    if (max !== undefined && num > max) return max;
    return num;
  };

  const formatTime = (hours: number, minutes: number, seconds?: number) => {
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}min`);
    if (seconds && seconds > 0) parts.push(`${seconds}s`);
    return parts.join(' ') || '0min';
  };

  const startEditing = (log: StudyLog) => {
    setEditingId(log.id);
    setEditForm({
      hours: log.hours || 0,
      minutes: log.minutes || 0,
      seconds: log.seconds || 0,
      pages: log.pages || 0,
      correct: log.correct || 0,
      wrong: log.wrong || 0,
      blank: log.blank || 0,
      notes: log.notes || '',
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
    <motion.div
      {...FADE_UP_ANIMATION}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20"
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Cabeçalho da Página */}
        <div className="mb-6">
          {/* Botão Voltar - Apenas Mobile */}
          {onNavigateBack && (
            <Button
              onClick={onNavigateBack}
              variant="ghost"
              size="md"
              leftIcon={<ArrowLeft size={20} />}
              className="md:hidden mb-4"
            >
              Voltar
            </Button>
          )}
          <div className="flex items-center gap-3 mb-2">
            <History className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Histórico
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Seus registros de estudo
          </p>
        </div>

        {/* Campo de Busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              placeholder="Buscar por matéria, subtópico ou observação..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors"
            />
            {localSearchTerm && (
              <Button
                onClick={() => setLocalSearchTerm('')}
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 h-auto min-w-0"
              >
                <X size={18} />
              </Button>
            )}
          </div>
        </div>

        {/* Filtros: Matéria e Data (Desktop: lado a lado, Mobile: empilhados) */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro de Matéria */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">Todas as matérias</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Filtros de Data (Chips) */}
          <div className="flex flex-wrap gap-2 md:flex-nowrap md:justify-between md:gap-0 md:space-x-2">
            {[
              { label: 'Hoje', days: 1 },
              { label: '7D', days: 7 },
              { label: '15D', days: 15 },
              { label: '30D', days: 30 },
              { label: '90D', days: 90 },
              { label: '365D', days: 365 },
              { label: 'Todos', days: null },
            ].map(({ label, days }) => {
              const isActive = daysFilter === days;
              return (
                <Button
                  key={`${label}-${days}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!loadingMoreLogs && onDaysFilterChange && daysFilter !== days) {
                      onDaysFilterChange(days);
                    }
                  }}
                  disabled={loadingMoreLogs}
                  variant={isActive ? 'primary' : 'secondary'}
                  size="sm"
                  className="whitespace-nowrap flex-shrink-0 md:flex-1 md:max-w-none text-xs md:text-sm"
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Contador de Registros */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredLogs.length} registro(s) encontrado(s)
          </p>
        </div>

        {/* Tabela de Registros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum registro encontrado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Matéria
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Tempo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Detalhes
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <motion.tbody 
                  className="divide-y divide-gray-200 dark:divide-gray-700"
                  variants={STAGGER_CONTAINER}
                  initial="hidden"
                  animate="show"
                >
                  {filteredLogs.map((log, index) => {
                    const isEditing = editingId === log.id;
                    const isEven = index % 2 === 0;

                    return (
                      <React.Fragment key={log.id}>
                        <motion.tr
                          variants={STAGGER_ITEM}
                          className={isEven ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}
                        >
                          {/* Matéria */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: getSubjectColor(log.subjectId) }}
                              />
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {getSubjectName(log.subjectId)}
                              </span>
                            </div>
                          </td>

                          {/* Data */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(log.timestamp).toLocaleDateString('pt-BR')}
                            </span>
                          </td>

                          {/* Tipo */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {getTypeLabel(log.type)}
                            </span>
                          </td>

                          {/* Tempo */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatTime(log.hours, log.minutes, log.seconds)}
                            </span>
                          </td>

                          {/* Detalhes */}
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {log.type === 'teoria' && log.pages && (
                                <span>{log.pages} págs</span>
                              )}
                              {log.type === 'questoes' && (
                                <div className="flex gap-2">
                                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    {log.correct || 0}
                                    <Check size={12} />
                                  </span>
                                  <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                    {log.wrong || 0}
                                    <X size={12} />
                                  </span>
                                  <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    {log.blank || 0}
                                    <Circle size={12} />
                                  </span>
                                </div>
                              )}
                              {log.notes && (
                                <p className="text-xs italic mt-1 text-gray-500 dark:text-gray-500">
                                  {log.notes}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Ações */}
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => {
                                  if (editingId === log.id) {
                                    cancelEdit();
                                  } else {
                                    startEditing(log);
                                  }
                                }}
                                variant={editingId === log.id ? "secondary" : "primary"}
                                size="sm"
                                className="p-2 h-auto min-w-0"
                                title={editingId === log.id ? "Cancelar edição" : "Editar"}
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button
                                onClick={() => onDeleteLog(log.id)}
                                variant="danger"
                                size="sm"
                                className="p-2 h-auto min-w-0"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>

                        {/* Linha de Edição Expandida */}
                        <AnimatePresence>
                          {isEditing && (
                            <motion.tr
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                              className={isEven ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}
                            >
                              <td colSpan={6} className="px-4 py-4">
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                                >
                                  <div className="space-y-4">
                                    {/* Linha 1: Campos numéricos em grid responsivo */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      
                                      {/* Coluna 1: Tempo (sempre visível) */}
                                      <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                          Tempo de Sessão <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                          <div className="flex-1">
                                            <input
                                              type="number"
                                              inputMode="numeric"
                                              pattern="[0-9]*"
                                              min="0"
                                              max="23"
                                              value={editForm.hours || 0}
                                              onChange={(e) => setEditForm({ ...editForm, hours: sanitizeNumericInput(e.target.value, 23, 0) })}
                                              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 outline-none text-center"
                                              placeholder="0"
                                            />
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block text-center mt-1">h</span>
                                          </div>
                                          
                                          <div className="flex-1">
                                            <input
                                              type="number"
                                              inputMode="numeric"
                                              pattern="[0-9]*"
                                              min="0"
                                              max="59"
                                              value={editForm.minutes || 0}
                                              onChange={(e) => setEditForm({ ...editForm, minutes: sanitizeNumericInput(e.target.value, 59, 0) })}
                                              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 outline-none text-center"
                                              placeholder="0"
                                            />
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block text-center mt-1">min</span>
                                          </div>
                                          
                                          <div className="flex-1">
                                            <input
                                              type="number"
                                              inputMode="numeric"
                                              pattern="[0-9]*"
                                              min="0"
                                              max="59"
                                              value={editForm.seconds || 0}
                                              onChange={(e) => setEditForm({ ...editForm, seconds: sanitizeNumericInput(e.target.value, 59, 0) })}
                                              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 outline-none text-center"
                                              placeholder="0"
                                            />
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block text-center mt-1">seg</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Coluna 2: Questões (sempre visível) */}
                                      <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                          Questões
                                        </label>
                                        <div className="flex gap-2">
                                          <div className="flex-1">
                                            <input
                                              type="number"
                                              inputMode="numeric"
                                              pattern="[0-9]*"
                                              min="0"
                                              value={editForm.correct || 0}
                                              onChange={(e) => setEditForm({ ...editForm, correct: sanitizeNumericInput(e.target.value) })}
                                              className="w-full px-3 py-2 rounded-lg border-2 border-emerald-500 dark:border-emerald-400 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 focus:border-emerald-500 outline-none text-center"
                                              placeholder="0"
                                            />
                                            <div className="flex justify-center mt-1">
                                              <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                          </div>
                                          
                                          <div className="flex-1">
                                            <input
                                              type="number"
                                              inputMode="numeric"
                                              pattern="[0-9]*"
                                              min="0"
                                              value={editForm.wrong || 0}
                                              onChange={(e) => setEditForm({ ...editForm, wrong: sanitizeNumericInput(e.target.value) })}
                                              className="w-full px-3 py-2 rounded-lg border-2 border-red-500 dark:border-red-400 bg-white dark:bg-gray-800 text-red-700 dark:text-red-300 focus:border-red-500 outline-none text-center"
                                              placeholder="0"
                                            />
                                            <div className="flex justify-center mt-1">
                                              <X size={14} className="text-red-600 dark:text-red-400" />
                                            </div>
                                          </div>
                                          
                                          <div className="flex-1">
                                            <input
                                              type="number"
                                              inputMode="numeric"
                                              pattern="[0-9]*"
                                              min="0"
                                              value={editForm.blank || 0}
                                              onChange={(e) => setEditForm({ ...editForm, blank: sanitizeNumericInput(e.target.value) })}
                                              className="w-full px-3 py-2 rounded-lg border-2 border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 focus:border-blue-500 outline-none text-center"
                                              placeholder="0"
                                            />
                                            <div className="flex justify-center mt-1">
                                              <Circle size={14} className="text-gray-500 dark:text-gray-400" />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Coluna 3: Páginas (sempre visível) */}
                                      <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                          Páginas Lidas
                                        </label>
                                        <input
                                          type="number"
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          min="0"
                                          value={editForm.pages || 0}
                                          onChange={(e) => setEditForm({ ...editForm, pages: sanitizeNumericInput(e.target.value) })}
                                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 outline-none"
                                          placeholder="Ex: 50"
                                        />
                                        <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">págs</span>
                                      </div>
                                      
                                    </div>
                                    
                                    {/* Linha 2: Observações (full width) */}
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Observações
                                      </label>
                                      <textarea
                                        value={editForm.notes || ''}
                                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-emerald-500 outline-none resize-none"
                                        placeholder="Adicione observações sobre esta sessão (opcional)"
                                      />
                                    </div>

                                    <div className="flex gap-2 justify-end pt-2">
                                      <Button
                                        onClick={cancelEdit}
                                        variant="secondary"
                                        size="md"
                                        leftIcon={<X size={16} />}
                                      >
                                        Cancelar
                                      </Button>
                                      <Button
                                        onClick={() => saveEdit(log)}
                                        variant="primary"
                                        size="md"
                                        leftIcon={<Check size={16} />}
                                      >
                                        Salvar
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
          )}
        </div>

        {/* Botão Carregar Mais - Só exibir se não houver busca ativa */}
        {!localSearchTerm.trim() && hasMoreLogs && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={onLoadMore}
              disabled={loadingMoreLogs}
              variant="outline"
              size="md"
              isLoading={loadingMoreLogs}
              leftIcon={!loadingMoreLogs ? undefined : <Loader2 className="w-5 h-5 animate-spin" />}
            >
              {loadingMoreLogs ? 'Carregando...' : 'Carregar mais histórico'}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
