import { useState } from 'react';
import { Plus, Trash2, Check, X, ChevronDown, RefreshCw, Target, ArrowUp, ArrowDown, BookOpen, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import { Subject, StudyLog, Subtopic } from '../types';
import { getRandomColor } from '../utils/colors';

interface CyclePageProps {
  subjects: Subject[];
  logs: StudyLog[];
  cycleStartDate: number;
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onDeleteSubject: (id: string) => void;
  onUpdateSubject: (id: string, subject: Partial<Subject>) => void;
  onRestartCycle: () => void;
  onReorderSubjects: (subjects: Subject[]) => void;
}

export default function CyclePage({
  subjects,
  logs,
  cycleStartDate,
  onAddSubject,
  onDeleteSubject,
  onUpdateSubject,
  onRestartCycle,
  onReorderSubjects
}: CyclePageProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [newSubtopic, setNewSubtopic] = useState('');
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);

  const handleAddSubject = () => {
  if (!newName.trim() || !newGoal) {
    setShowValidationAlert(true);
    return;
  }
  onAddSubject({
    name: newName.trim(),
    goalMinutes: parseInt(newGoal),
    subtopics: [],
    color: getRandomColor(),
  });
  setNewName('');
  setNewGoal('');
  setIsAdding(false);
};

  const getSubjectProgress = (subjectId: string, goalMinutes: number) => {
    const totalMinutes = logs
      .filter((log) => log.subjectId === subjectId && log.timestamp >= cycleStartDate)
      .reduce((sum, log) => sum + log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60), 0);
    const percentage = Math.min((totalMinutes / goalMinutes) * 100, 100);
    return { totalMinutes, percentage };
  };

  const getTotalCycleProgress = () => {
    if (subjects.length === 0) return 0;
    const totalPercentage = subjects.reduce((acc, sub) => {
      const { percentage } = getSubjectProgress(sub.id, sub.goalMinutes);
      return acc + percentage;
    }, 0);
    return Math.round(totalPercentage / subjects.length);
  };

  const getCycleStats = () => {
  const daysSinceStart = Math.floor((Date.now() - cycleStartDate) / (1000 * 60 * 60 * 24));
  
  const cycleLogs = logs.filter(log => log.timestamp >= cycleStartDate);
  const totalMinutes = cycleLogs.reduce(
    (sum, log) => sum + log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60), 
    0
  );
  const totalHours = Math.floor(totalMinutes / 60);
  
  const totalQuestions = cycleLogs
    .filter(log => log.type === 'questoes')
    .reduce((sum, log) => sum + (log.correct || 0) + (log.wrong || 0) + (log.blank || 0), 0);

  return { daysSinceStart, totalHours, totalMinutes, totalQuestions };
};

const cycleStats = getCycleStats();

  const handleAddSubtopic = (subjectId: string) => {
    if (!newSubtopic.trim()) return;
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    const subtopic: Subtopic = { id: Date.now().toString(), name: newSubtopic.trim(), completed: false };
    onUpdateSubject(subjectId, { subtopics: [...subject.subtopics, subtopic] });
    setNewSubtopic('');
  };

  const handleToggleSubtopic = (subjectId: string, subtopicId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    const updatedSubtopics = subject.subtopics.map((st) =>
      st.id === subtopicId ? { ...st, completed: !st.completed } : st
    );
    onUpdateSubject(subjectId, { subtopics: updatedSubtopics });
  };

  const handleDeleteSubtopic = (subjectId: string, subtopicId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    const updatedSubtopics = subject.subtopics.filter((st) => st.id !== subtopicId);
    onUpdateSubject(subjectId, { subtopics: updatedSubtopics });
  };

  const moveSubject = (index: number, direction: 'up' | 'down') => {
    const newSubjects = [...subjects];
    if (direction === 'up' && index > 0) {
      [newSubjects[index], newSubjects[index - 1]] = [newSubjects[index - 1], newSubjects[index]];
    } else if (direction === 'down' && index < newSubjects.length - 1) {
      [newSubjects[index], newSubjects[index + 1]] = [newSubjects[index + 1], newSubjects[index]];
    }
    onReorderSubjects(newSubjects);
  };

  const totalCycleProgress = getTotalCycleProgress();

  return (
    // ADICIONEI slide-in-from-bottom-4 PARA SENTIR A TROCA DE ABA
    <div className="max-w-lg md:max-w-5xl mx-auto px-6 py-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 transition-colors">Ciclo de Estudos</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">Gerencie suas matérias e acompanhe o progresso</p>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8 items-start">
        
        {/* COLUNA ESQUERDA */}
        <div className="md:sticky md:top-6 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg transition-colors duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Status Geral</h2>
                <p className="text-xs text-gray-400">Média do ciclo</p>
              </div>
              <Target className="text-emerald-500" size={28} />
            </div>
            
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-black text-emerald-500">{totalCycleProgress}%</span>
              <span className="text-sm text-gray-400 mb-2">concluído</span>
            </div>

            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-6">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
                style={{ width: `${totalCycleProgress}%` }}
              ></div>
            </div>

            <button onClick={onRestartCycle} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2">
              <RefreshCw size={18} /> REINICIAR CICLO
            </button>
          </div>

          {/* Estatísticas do Ciclo */}
<div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-3">📊 Este Ciclo</p>
  
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <Calendar size={14} />
        <span className="text-xs font-medium">Dias ativos</span>
      </div>
      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
        {cycleStats.daysSinceStart}
      </span>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <Clock size={14} />
        <span className="text-xs font-medium">Horas estudadas</span>
      </div>
      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
        {cycleStats.totalHours}h
      </span>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <BookOpen size={14} />
        <span className="text-xs font-medium">Matérias</span>
      </div>
      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
        {subjects.length}
      </span>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <Target size={14} />
        <span className="text-xs font-medium">Questões feitas</span>
      </div>
      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
        {cycleStats.totalQuestions}
      </span>
    </div>
  </div>
</div>
        </div>

        {/* COLUNA DIREITA: Lista de Matérias */}
        <div className="space-y-4">
          {subjects.map((subject, index) => {
            const { totalMinutes, percentage } = getSubjectProgress(subject.id, subject.goalMinutes);
            const isExpanded = expandedSubject === subject.id;

            return (
              <div key={subject.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-colors duration-300 border border-gray-100 dark:border-gray-700">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        {/* CONTROLES DE ORDEM */}
                        <div className="flex flex-col gap-0.5">
                          <button 
                            onClick={() => moveSubject(index, 'up')}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-emerald-500 disabled:opacity-20 disabled:cursor-not-allowed p-0.5 active:scale-90 transition-transform"
                          >
                            <ArrowUp size={14} strokeWidth={3} />
                          </button>
                          <button 
                            onClick={() => moveSubject(index, 'down')}
                            disabled={index === subjects.length - 1}
                            className="text-gray-400 hover:text-emerald-500 disabled:opacity-20 disabled:cursor-not-allowed p-0.5 active:scale-90 transition-transform"
                          >
                            <ArrowDown size={14} strokeWidth={3} />
                          </button>
                        </div>

                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{subject.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 pl-8">
                        Meta: {subject.goalMinutes} min • Ciclo Atual: {totalMinutes} min
                      </p>
                    </div>
                    <button onClick={() => setDeleteSubjectId(subject.id)} className="text-red-500 hover:text-red-600 p-2 active:scale-90 transition-transform">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div className="h-full transition-all duration-300 rounded-full" style={{ width: `${percentage}%`, backgroundColor: percentage >= 100 ? '#10b981' : subject.color }} />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-right">{percentage.toFixed(1)}%</p>
                  </div>

                  <button 
                    onClick={() => setExpandedSubject(isExpanded ? null : subject.id)} 
                    className="w-full flex items-center justify-between py-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 group"
                  >
                    <span>Subtópicos ({subject.subtopics.filter((st) => st.completed).length}/{subject.subtopics.length})</span>
                    {/* SETINHA GIRATÓRIA AQUI */}
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* EFEITO ACORDEÃO NOS SUBTÓPICOS */}
                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
                      <div className="space-y-2 mb-4">
                        {subject.subtopics.map((subtopic) => (
                          <div key={subtopic.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                            <button
                              onClick={() => handleToggleSubtopic(subject.id, subtopic.id)}
                              className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all active:scale-90 ${
                                subtopic.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-500 hover:border-emerald-400'
                              }`}
                            >
                              {subtopic.completed && <Check className="w-4 h-4 text-white" />}
                            </button>
                            <span className={`flex-1 text-sm ${subtopic.completed ? 'text-gray-500 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200 font-medium'}`}>
                              {subtopic.name}
                            </span>
                            <button onClick={() => handleDeleteSubtopic(subject.id, subtopic.id)} className="text-red-500 hover:text-red-600 p-1 active:scale-90 transition-transform">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSubtopic}
                          onChange={(e) => setNewSubtopic(e.target.value)}
                          placeholder="Novo subtópico..."
                          className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none text-base"
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtopic(subject.id); }}
                        />
                        <button onClick={() => handleAddSubtopic(subject.id)} className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all active:scale-95">
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

  <AnimatePresence>
  {!isAdding ? (
    <motion.button
      key="add-button"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={() => setIsAdding(true)}
      className="w-full py-5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-semibold hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95 flex items-center justify-center gap-2"
    >
      <Plus className="w-5 h-5" /> Adicionar Matéria
    </motion.button>
  ) : (
    <motion.div
      key="add-form"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 space-y-4 transition-colors border border-gray-100 dark:border-gray-700"
    >
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nome da Matéria</label>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ex: Matemática"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none text-base"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-400 mb-2">Meta do Ciclo (minutos)</label>
        <input
          type="number"
          min="1"
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          placeholder="Ex: 300"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none text-base"
        />
      </div>
      <div className="flex gap-3">
        <button onClick={handleAddSubject} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-all active:scale-95 shadow-md">Salvar</button>
        <button onClick={() => { setIsAdding(false); setNewName(''); setNewGoal(''); }} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95">Cancelar</button>
      </div>
    </motion.div>
  )}
</AnimatePresence>
        </div>
      </div>
      
      {/* Modal: Validação */}
<AlertModal
  isOpen={showValidationAlert}
  title="Campos Obrigatórios"
  message="Preencha todos os campos!"
  buttonText="Entendi"
  variant="warning"
  onClose={() => setShowValidationAlert(false)}
/>

{/* Modal: Excluir Matéria */}
<ConfirmModal
  isOpen={deleteSubjectId !== null}
  title="Excluir Matéria"
  message={`Tem certeza que deseja excluir "${subjects.find(s => s.id === deleteSubjectId)?.name}"?`}
  confirmText="Excluir"
  cancelText="Cancelar"
  variant="danger"
  onConfirm={() => {
    if (deleteSubjectId) {
      onDeleteSubject(deleteSubjectId);
      setDeleteSubjectId(null);
    }
  }}
  onCancel={() => setDeleteSubjectId(null)}
/>
    </div>
  );
}