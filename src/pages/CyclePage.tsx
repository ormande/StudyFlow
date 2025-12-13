import { useState } from 'react';
import { Plus, Trash2, Check, X, ChevronDown, RefreshCw, Target, ArrowUp, ArrowDown, BookOpen, Clock, Calendar, Pencil, Save, GripVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import { Subject, StudyLog, Subtopic } from '../types';
import { getRandomColor, subjectColors } from '../utils/colors';
import Skeleton from '../components/Skeleton';

// Componente para cada card de matéria com drag & drop
interface SortableSubjectCardProps {
  subject: Subject;
  index: number;
  totalMinutes: number;
  percentage: number;
  isExpanded: boolean;
  onExpand: (subjectId: string | null) => void;
  onEdit: (subject: Subject) => void;
  onDelete: (subjectId: string) => void;
  onAddSubtopic: (subjectId: string) => void;
  onToggleSubtopic: (subjectId: string, subtopicId: string) => void;
  onDeleteSubtopic: (subjectId: string, subtopicId: string) => void;
  moveSubtopic: (subjectId: string, subtopicIndex: number, direction: 'up' | 'down') => void;
  newSubtopic: string;
  setNewSubtopic: (value: string) => void;
  subjectsLength: number;
  subjects: Subject[];
  onReorderSubjects: (subjects: Subject[]) => void;
}

const SortableSubjectCard = ({
  subject,
  index,
  totalMinutes,
  percentage,
  isExpanded,
  onExpand,
  onEdit,
  onDelete,
  onAddSubtopic,
  onToggleSubtopic,
  onDeleteSubtopic,
  moveSubtopic,
  newSubtopic,
  setNewSubtopic,
  subjectsLength,
  subjects,
  onReorderSubjects
}: SortableSubjectCardProps) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={subject}
      dragListener={false}
      dragControls={controls}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-colors duration-300 border border-gray-100 dark:border-gray-700"
    >
      <div className="p-5 lg:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              {/* ALÇA DE DRAG */}
              <GripVertical
                className="w-5 h-5 text-gray-300 hover:text-emerald-500 cursor-grab active:cursor-grabbing touch-none transition-colors"
                onPointerDown={(e) => controls.start(e)}
              />
              {/* CONTROLES DE ORDEM */}
              <div className="flex flex-col gap-0.5">
                <button 
                  onClick={() => {
                    const newSubjects = [...subjects];
                    if (index > 0) {
                      [newSubjects[index], newSubjects[index - 1]] = [newSubjects[index - 1], newSubjects[index]];
                      onReorderSubjects(newSubjects);
                    }
                  }}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-emerald-500 disabled:opacity-20 disabled:cursor-not-allowed p-0.5 active:scale-90 transition-transform"
                  aria-label="Mover matéria para cima"
                  title="Mover matéria para cima"
                >
                  <ArrowUp size={14} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => {
                    const newSubjects = [...subjects];
                    if (index < subjectsLength - 1) {
                      [newSubjects[index], newSubjects[index + 1]] = [newSubjects[index + 1], newSubjects[index]];
                      onReorderSubjects(newSubjects);
                    }
                  }}
                  disabled={index === subjectsLength - 1}
                  className="text-gray-400 hover:text-emerald-500 disabled:opacity-20 disabled:cursor-not-allowed p-0.5 active:scale-90 transition-transform"
                  aria-label="Mover matéria para baixo"
                  title="Mover matéria para baixo"
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
          
          {/* Botões de Ação: Editar e Excluir */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onEdit(subject)} 
              className="text-gray-400 hover:text-emerald-500 p-2 active:scale-90 transition-transform"
              aria-label="Editar Matéria"
              title="Editar Matéria"
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onDelete(subject.id)} 
              className="text-red-500 hover:text-red-600 p-2 active:scale-90 transition-transform"
              aria-label="Excluir Matéria"
              title="Excluir Matéria"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full transition-all duration-300 rounded-full" 
              style={{ width: `${percentage}%`, backgroundColor: percentage >= 100 ? '#10b981' : subject.color }} 
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-right">{percentage.toFixed(1)}%</p>
        </div>

        <button 
          onClick={() => onExpand(isExpanded ? null : subject.id)} 
          className="w-full flex items-center justify-between py-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 group"
        >
          <span>Subtópicos ({subject.subtopics.filter((st) => st.completed).length}/{subject.subtopics.length})</span>
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* EFEITO ACORDEÃO NOS SUBTÓPICOS */}
      <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 lg:px-6 lg:pb-6 border-t border-gray-100 dark:border-gray-700 pt-4">
            <div className="space-y-2 lg:space-y-3 mb-4">
              {subject.subtopics.map((subtopic, subtopicIndex) => (
                <div key={subtopic.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 group">
                  
                  <div className="flex flex-col gap-0.5 opacity-50 hover:opacity-100 transition-opacity">
                     <button 
                       onClick={() => moveSubtopic(subject.id, subtopicIndex, 'up')}
                       disabled={subtopicIndex === 0}
                       className="text-gray-400 hover:text-emerald-500 disabled:opacity-20 p-0.5 active:scale-90"
                       aria-label={`Mover subtópico "${subtopic.name}" para cima`}
                       title="Mover subtópico para cima"
                     >
                       <ArrowUp size={10} strokeWidth={3} />
                     </button>
                     <button 
                       onClick={() => moveSubtopic(subject.id, subtopicIndex, 'down')}
                       disabled={subtopicIndex === subject.subtopics.length - 1}
                       className="text-gray-400 hover:text-emerald-500 disabled:opacity-20 p-0.5 active:scale-90"
                       aria-label={`Mover subtópico "${subtopic.name}" para baixo`}
                       title="Mover subtópico para baixo"
                     >
                       <ArrowDown size={10} strokeWidth={3} />
                     </button>
                  </div>

                  <button
                    onClick={() => onToggleSubtopic(subject.id, subtopic.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all active:scale-90 ${
                      subtopic.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-500 hover:border-emerald-400'
                    }`}
                    aria-label={subtopic.completed ? `Marcar subtópico "${subtopic.name}" como não concluído` : `Marcar subtópico "${subtopic.name}" como concluído`}
                    title={subtopic.completed ? "Desmarcar como concluído" : "Marcar como concluído"}
                  >
                    {subtopic.completed && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <span className={`flex-1 text-sm ${subtopic.completed ? 'text-gray-500 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200 font-medium'}`}>
                    {subtopic.name}
                  </span>
                  <button 
                    onClick={() => onDeleteSubtopic(subject.id, subtopic.id)} 
                    className="text-red-500 hover:text-red-600 p-1 active:scale-90 transition-transform"
                    aria-label={`Excluir subtópico "${subtopic.name}"`}
                    title="Excluir subtópico"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Container do Input de Subtópico */}
            <div className="flex gap-2 lg:gap-3 w-full pr-1">
              <input
                type="text"
                value={newSubtopic}
                onChange={(e) => setNewSubtopic(e.target.value)}
                placeholder="Novo subtópico..."
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none text-base lg:text-base min-w-0"
                onKeyDown={(e) => { if (e.key === 'Enter') onAddSubtopic(subject.id); }}
              />
              <button 
                onClick={() => onAddSubtopic(subject.id)} 
                className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all active:scale-95 flex-shrink-0"
                aria-label="Adicionar subtópico"
                title="Adicionar subtópico"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
};

interface CyclePageProps {
  subjects: Subject[];
  logs: StudyLog[];
  cycleStartDate: number;
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onDeleteSubject: (id: string) => void;
  onUpdateSubject: (id: string, subject: Partial<Subject>) => void;
  onRestartCycle: () => void;
  onReorderSubjects: (subjects: Subject[]) => void;
  isLoading: boolean;
}

export default function CyclePage({
  subjects,
  logs,
  cycleStartDate,
  onAddSubject,
  onDeleteSubject,
  onUpdateSubject,
  onRestartCycle,
  onReorderSubjects,
  isLoading
}: CyclePageProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [newSubtopic, setNewSubtopic] = useState('');
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);
  
  // Estados para Edição
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editColor, setEditColor] = useState('');

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

  // Função para abrir o modal de edição
  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setEditName(subject.name);
    setEditGoal(subject.goalMinutes.toString());
    setEditColor(subject.color);
  };

  // Função para salvar a edição
  const handleSaveEdit = () => {
    if (!editingSubject || !editName.trim() || !editGoal) return;
    
    onUpdateSubject(editingSubject.id, {
      name: editName.trim(),
      goalMinutes: parseInt(editGoal),
      color: editColor
    });
    
    setEditingSubject(null);
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

  // Função para mover subtópicos
  const moveSubtopic = (subjectId: string, subtopicIndex: number, direction: 'up' | 'down') => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    
    const newSubtopics = [...subject.subtopics];
    if (direction === 'up' && subtopicIndex > 0) {
      [newSubtopics[subtopicIndex], newSubtopics[subtopicIndex - 1]] = [newSubtopics[subtopicIndex - 1], newSubtopics[subtopicIndex]];
    } else if (direction === 'down' && subtopicIndex < newSubtopics.length - 1) {
      [newSubtopics[subtopicIndex], newSubtopics[subtopicIndex + 1]] = [newSubtopics[subtopicIndex + 1], newSubtopics[subtopicIndex]];
    }
    onUpdateSubject(subjectId, { subtopics: newSubtopics });
  };

  const totalCycleProgress = getTotalCycleProgress();

  return (
    <div className="max-w-lg md:max-w-7xl mx-auto px-6 py-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 transition-colors">Ciclo de Estudos</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">Gerencie suas matérias e acompanhe o progresso</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] lg:grid-cols-[380px_1fr] gap-8 items-start">
          {/* COLUNA ESQUERDA - Skeleton */}
          <div className="md:sticky md:top-6 lg:top-4 space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
          
          {/* COLUNA DIREITA - Skeletons dos cards */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] lg:grid-cols-[380px_1fr] gap-8 items-start">
        
        {/* COLUNA ESQUERDA */}
        <div className="md:sticky md:top-6 lg:top-4 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 lg:p-8 rounded-3xl shadow-lg transition-colors duration-300 border border-gray-100 dark:border-gray-700">
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

          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 lg:p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-3">📊 Este Ciclo</p>
            <div className="space-y-3 lg:space-y-4">
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Reorder.Group
              axis="y"
              values={subjects}
              onReorder={onReorderSubjects}
              className="space-y-4 xl:col-span-2"
            >
            {subjects.map((subject, index) => {
              const { totalMinutes, percentage } = getSubjectProgress(subject.id, subject.goalMinutes);
              const isExpanded = expandedSubject === subject.id;

              return (
                <SortableSubjectCard
                  key={subject.id}
                  subject={subject}
                  index={index}
                  totalMinutes={totalMinutes}
                  percentage={percentage}
                  isExpanded={isExpanded}
                  onExpand={setExpandedSubject}
                  onEdit={openEditModal}
                  onDelete={setDeleteSubjectId}
                  onAddSubtopic={handleAddSubtopic}
                  onToggleSubtopic={handleToggleSubtopic}
                  onDeleteSubtopic={handleDeleteSubtopic}
                  moveSubtopic={moveSubtopic}
                  newSubtopic={newSubtopic}
                  setNewSubtopic={setNewSubtopic}
                  subjectsLength={subjects.length}
                  subjects={subjects}
                  onReorderSubjects={onReorderSubjects}
                />
              );
            })}
            </Reorder.Group>
          </div>

          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-5 lg:py-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-semibold hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Adicionar Matéria
            </button>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 lg:p-6 space-y-4 lg:space-y-5 transition-colors border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
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
            </div>
          )}
        </div>
        </div>
      )}

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

      {/* NOVO: Modal de Edição */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm lg:max-w-md shadow-2xl p-5 lg:p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Editar Matéria</h3>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nome</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none text-base"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-400 mb-2">Meta (min)</label>
              <input
                type="number"
                min="1"
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Cor</label>
              <div className="flex flex-wrap gap-3">
                {subjectColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditColor(color)}
                    className={`w-8 h-8 rounded-full transition-all active:scale-90 ${
                      editColor === color
                        ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={`Cor ${color}`}
                  >
                    {editColor === color && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleSaveEdit} 
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                <Save size={18} /> Salvar
              </button>
              <button 
                onClick={() => setEditingSubject(null)} 
                className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all active:scale-95"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}