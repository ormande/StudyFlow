import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Check, X, ChevronDown, RefreshCw, Target, ArrowUp, ArrowDown, BookOpen, Clock, Calendar, Pencil, Save, GripVertical, BarChart2 } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import Button from '../components/Button';
import { Subject, StudyLog, Subtopic } from '../types';
import { getRandomColor, subjectColors } from '../utils/colors';
import Skeleton from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';

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
                <Button 
                  onClick={() => {
                    const newSubjects = [...subjects];
                    if (index > 0) {
                      [newSubjects[index], newSubjects[index - 1]] = [newSubjects[index - 1], newSubjects[index]];
                      onReorderSubjects(newSubjects);
                    }
                  }}
                  disabled={index === 0}
                  variant="ghost"
                  size="sm"
                  className="p-0.5 h-auto min-w-0"
                  aria-label="Mover matéria para cima"
                  title="Mover matéria para cima"
                >
                  <ArrowUp size={14} strokeWidth={3} />
                </Button>
                <Button 
                  onClick={() => {
                    const newSubjects = [...subjects];
                    if (index < subjectsLength - 1) {
                      [newSubjects[index], newSubjects[index + 1]] = [newSubjects[index + 1], newSubjects[index]];
                      onReorderSubjects(newSubjects);
                    }
                  }}
                  disabled={index === subjectsLength - 1}
                  variant="ghost"
                  size="sm"
                  className="p-0.5 h-auto min-w-0"
                  aria-label="Mover matéria para baixo"
                  title="Mover matéria para baixo"
                >
                  <ArrowDown size={14} strokeWidth={3} />
                </Button>
              </div>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{subject.name}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 pl-8">
              Meta: {subject.goalMinutes} min • Ciclo Atual: {totalMinutes} min
            </p>
          </div>
          
          {/* Botões de Ação: Editar e Excluir */}
          <div className="flex items-center gap-1">
            <Button 
              onClick={() => onEdit(subject)} 
              variant="ghost"
              size="sm"
              className="p-2 h-auto min-w-0"
              aria-label="Editar Matéria"
              title="Editar Matéria"
            >
              <Pencil className="w-5 h-5" />
            </Button>
            <Button 
              onClick={() => onDelete(subject.id)} 
              variant="danger"
              size="sm"
              className="p-2 h-auto min-w-0"
              aria-label="Excluir Matéria"
              title="Excluir Matéria"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
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

        <Button 
          onClick={() => onExpand(isExpanded ? null : subject.id)} 
          variant="ghost"
          fullWidth
          className="justify-between py-2 h-auto"
        >
          <span>Subtópicos ({subject.subtopics.filter((st) => st.completed).length}/{subject.subtopics.length})</span>
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* EFEITO ACORDEÃO NOS SUBTÓPICOS */}
      <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 lg:px-6 lg:pb-6 border-t border-gray-100 dark:border-gray-700 pt-4">
            <div className="space-y-2 lg:space-y-3 mb-4">
              {subject.subtopics.map((subtopic, subtopicIndex) => (
                <div key={subtopic.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 group">
                  
                  <div className="flex flex-col gap-0.5 opacity-50 hover:opacity-100 transition-opacity">
                     <Button 
                       onClick={() => moveSubtopic(subject.id, subtopicIndex, 'up')}
                       disabled={subtopicIndex === 0}
                       variant="ghost"
                       size="sm"
                       className="p-0.5 h-auto min-w-0"
                       aria-label={`Mover subtópico "${subtopic.name}" para cima`}
                       title="Mover subtópico para cima"
                     >
                       <ArrowUp size={10} strokeWidth={3} />
                     </Button>
                     <Button 
                       onClick={() => moveSubtopic(subject.id, subtopicIndex, 'down')}
                       disabled={subtopicIndex === subject.subtopics.length - 1}
                       variant="ghost"
                       size="sm"
                       className="p-0.5 h-auto min-w-0"
                       aria-label={`Mover subtópico "${subtopic.name}" para baixo`}
                       title="Mover subtópico para baixo"
                     >
                       <ArrowDown size={10} strokeWidth={3} />
                     </Button>
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
                  <span className={`flex-1 text-sm ${subtopic.completed ? 'text-gray-500 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-200 font-medium'}`}>
                    {subtopic.name}
                  </span>
                  <Button 
                    onClick={() => onDeleteSubtopic(subject.id, subtopic.id)} 
                    variant="danger"
                    size="sm"
                    className="p-1 h-auto min-w-0"
                    aria-label={`Excluir subtópico "${subtopic.name}"`}
                    title="Excluir subtópico"
                  >
                    <X className="w-4 h-4" />
                  </Button>
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
              <Button 
                onClick={() => onAddSubtopic(subject.id)} 
                variant="primary"
                size="md"
                className="flex-shrink-0 p-0 w-10 h-10"
                aria-label="Adicionar subtópico"
                title="Adicionar subtópico"
              >
                <Plus className="w-5 h-5" />
              </Button>
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
  const { addToast } = useToast();
  
  // ✅ ESTADO LOCAL OTIMISTA - Atualiza imediatamente antes de persistir
  const [cycleSubjects, setCycleSubjects] = useState<Subject[]>(subjects);
  const previousSubjectsRef = useRef<Subject[]>(subjects);
  
  // Sincronizar estado local quando subjects mudarem externamente (ex: após fetch do servidor)
  useEffect(() => {
    // Só atualizar se subjects mudou externamente (não por nossa ação otimista)
    // Compara por referência e IDs para evitar loops
    const subjectsChanged = 
      subjects.length !== previousSubjectsRef.current.length ||
      subjects.some((s, i) => s.id !== previousSubjectsRef.current[i]?.id);
    
    if (subjectsChanged) {
      setCycleSubjects(subjects);
      previousSubjectsRef.current = subjects;
    }
  }, [subjects]);
  
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
    
    // ✅ OPTIMISTIC UI: Criar matéria temporária com ID temporário
    const tempId = `temp-${Date.now()}`;
    const newSubject: Subject = {
      id: tempId,
      name: newName.trim(),
      goalMinutes: parseInt(newGoal),
      subtopics: [],
      color: getRandomColor(),
    };
    
    // Atualizar UI imediatamente
    setCycleSubjects(prev => [...prev, newSubject]);
    setNewName('');
    setNewGoal('');
    setIsAdding(false);
    
    // Persistir em background
    Promise.resolve(onAddSubject({
      name: newSubject.name,
      goalMinutes: newSubject.goalMinutes,
      subtopics: [],
      color: newSubject.color,
    })).catch(() => {
      // Reverter em caso de erro
      setCycleSubjects(prev => prev.filter(s => s.id !== tempId));
      addToast('Erro ao adicionar matéria. Tente novamente.', 'error');
    });
    // O estado será sincronizado pelo useEffect quando o servidor responder
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
    
    // ✅ OPTIMISTIC UI: Salvar estado anterior para possível reversão
    const previousSubject = cycleSubjects.find(s => s.id === editingSubject.id);
    if (!previousSubject) return;
    
    const updates = {
      name: editName.trim(),
      goalMinutes: parseInt(editGoal),
      color: editColor
    };
    
    // Atualizar UI imediatamente
    setCycleSubjects(prev => prev.map(s => 
      s.id === editingSubject.id ? { ...s, ...updates } : s
    ));
    setEditingSubject(null);
    
    // Persistir em background
    Promise.resolve(onUpdateSubject(editingSubject.id, updates)).catch(() => {
      // Reverter em caso de erro
      setCycleSubjects(prev => prev.map(s => 
        s.id === editingSubject.id ? previousSubject : s
      ));
      addToast('Erro ao atualizar matéria. Tente novamente.', 'error');
    });
    // O estado será sincronizado pelo useEffect quando o servidor responder
  };

  const getSubjectProgress = (subjectId: string, goalMinutes: number) => {
    const totalMinutes = logs
      .filter((log) => log.subjectId === subjectId && log.timestamp >= cycleStartDate)
      .reduce((sum, log) => sum + log.hours * 60 + log.minutes + Math.floor((log.seconds || 0) / 60), 0);
    const percentage = Math.min((totalMinutes / goalMinutes) * 100, 100);
    return { totalMinutes, percentage };
  };

  const getTotalCycleProgress = () => {
    if (cycleSubjects.length === 0) return 0;
    const totalPercentage = cycleSubjects.reduce((acc, sub) => {
      const { percentage } = getSubjectProgress(sub.id, sub.goalMinutes);
      return acc + percentage;
    }, 0);
    return Math.round(totalPercentage / cycleSubjects.length);
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
    const subject = cycleSubjects.find((s) => s.id === subjectId);
    if (!subject) return;
    
    // Gerar UUID válido usando crypto.randomUUID() ou fallback
    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback para browsers antigos
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    const subtopic: Subtopic = { id: generateUUID(), name: newSubtopic.trim(), completed: false };
    const newSubtopics = [...subject.subtopics, subtopic];
    
    // ✅ OPTIMISTIC UI: Atualizar imediatamente
    setCycleSubjects(prev => prev.map(s => 
      s.id === subjectId ? { ...s, subtopics: newSubtopics } : s
    ));
    setNewSubtopic('');
    
    // Persistir em background
    Promise.resolve(onUpdateSubject(subjectId, { subtopics: newSubtopics })).catch(() => {
      // Reverter em caso de erro
      setCycleSubjects(prev => prev.map(s => 
        s.id === subjectId ? { ...s, subtopics: subject.subtopics } : s
      ));
      addToast('Erro ao adicionar subtópico. Tente novamente.', 'error');
    });
  };

  const handleToggleSubtopic = (subjectId: string, subtopicId: string) => {
    const subject = cycleSubjects.find((s) => s.id === subjectId);
    if (!subject) return;
    
    const updatedSubtopics = subject.subtopics.map((st) =>
      st.id === subtopicId ? { ...st, completed: !st.completed } : st
    );
    
    // ✅ OPTIMISTIC UI: Atualizar imediatamente
    setCycleSubjects(prev => prev.map(s => 
      s.id === subjectId ? { ...s, subtopics: updatedSubtopics } : s
    ));
    
    // Persistir em background
    Promise.resolve(onUpdateSubject(subjectId, { subtopics: updatedSubtopics })).catch(() => {
      // Reverter em caso de erro
      setCycleSubjects(prev => prev.map(s => 
        s.id === subjectId ? { ...s, subtopics: subject.subtopics } : s
      ));
      addToast('Erro ao atualizar subtópico. Tente novamente.', 'error');
    });
  };

  const handleDeleteSubtopic = (subjectId: string, subtopicId: string) => {
    const subject = cycleSubjects.find((s) => s.id === subjectId);
    if (!subject) return;
    
    const updatedSubtopics = subject.subtopics.filter((st) => st.id !== subtopicId);
    
    // ✅ OPTIMISTIC UI: Atualizar imediatamente
    setCycleSubjects(prev => prev.map(s => 
      s.id === subjectId ? { ...s, subtopics: updatedSubtopics } : s
    ));
    
    // Persistir em background
    Promise.resolve(onUpdateSubject(subjectId, { subtopics: updatedSubtopics })).catch(() => {
      // Reverter em caso de erro
      setCycleSubjects(prev => prev.map(s => 
        s.id === subjectId ? { ...s, subtopics: subject.subtopics } : s
      ));
      addToast('Erro ao excluir subtópico. Tente novamente.', 'error');
    });
  };

  // Função para mover subtópicos
  const moveSubtopic = (subjectId: string, subtopicIndex: number, direction: 'up' | 'down') => {
    const subject = cycleSubjects.find((s) => s.id === subjectId);
    if (!subject) return;
    
    const newSubtopics = [...subject.subtopics];
    if (direction === 'up' && subtopicIndex > 0) {
      [newSubtopics[subtopicIndex], newSubtopics[subtopicIndex - 1]] = [newSubtopics[subtopicIndex - 1], newSubtopics[subtopicIndex]];
    } else if (direction === 'down' && subtopicIndex < newSubtopics.length - 1) {
      [newSubtopics[subtopicIndex], newSubtopics[subtopicIndex + 1]] = [newSubtopics[subtopicIndex + 1], newSubtopics[subtopicIndex]];
    }
    
    // ✅ OPTIMISTIC UI: Atualizar imediatamente
    setCycleSubjects(prev => prev.map(s => 
      s.id === subjectId ? { ...s, subtopics: newSubtopics } : s
    ));
    
    // Persistir em background
    Promise.resolve(onUpdateSubject(subjectId, { subtopics: newSubtopics })).catch(() => {
      // Reverter em caso de erro
      setCycleSubjects(prev => prev.map(s => 
        s.id === subjectId ? { ...s, subtopics: subject.subtopics } : s
      ));
      addToast('Erro ao reordenar subtópico. Tente novamente.', 'error');
    });
  };

  const totalCycleProgress = getTotalCycleProgress();

  return (
    <div className="max-w-lg md:max-w-7xl mx-auto px-6 py-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Ciclo de Estudos</h1>
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
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Status Geral</h2>
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
            <Button onClick={onRestartCycle} variant="danger" fullWidth leftIcon={<RefreshCw size={18} />} className="font-bold">
              REINICIAR CICLO
            </Button>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 lg:p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-3 flex items-center gap-1">
              <BarChart2 size={12} />
              Este Ciclo
            </p>
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
                  {cycleSubjects.length}
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
              values={cycleSubjects}
              onReorder={(newOrder) => {
                // ✅ OPTIMISTIC UI: Salvar estado anterior para possível reversão
                const previousOrder = [...cycleSubjects];
                
                // Atualizar UI imediatamente
                setCycleSubjects(newOrder);
                
                // Persistir em background
                Promise.resolve(onReorderSubjects(newOrder)).catch(() => {
                  // Reverter em caso de erro
                  setCycleSubjects(previousOrder);
                  addToast('Erro ao reordenar matérias. Tente novamente.', 'error');
                });
              }}
              className="space-y-4 xl:col-span-2"
            >
            {cycleSubjects.map((subject, index) => {
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
                  subjectsLength={cycleSubjects.length}
                  subjects={cycleSubjects}
                  onReorderSubjects={(newOrder) => {
                    // ✅ OPTIMISTIC UI: Salvar estado anterior para possível reversão
                    const previousOrder = [...cycleSubjects];
                    
                    // Atualizar UI imediatamente
                    setCycleSubjects(newOrder);
                    
                    // Persistir em background
                    Promise.resolve(onReorderSubjects(newOrder)).catch(() => {
                      // Reverter em caso de erro
                      setCycleSubjects(previousOrder);
                      addToast('Erro ao reordenar matérias. Tente novamente.', 'error');
                    });
                  }}
                />
              );
            })}
            </Reorder.Group>
          </div>

          {!isAdding ? (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              fullWidth
              size="lg"
              leftIcon={<Plus className="w-5 h-5" />}
              className="border-dashed py-5 lg:py-6"
            >
              Adicionar Matéria
            </Button>
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
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="1"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Ex: 300"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none text-base"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAddSubject} variant="primary" fullWidth className="flex-1 shadow-md">Salvar</Button>
                <Button onClick={() => { setIsAdding(false); setNewName(''); setNewGoal(''); }} variant="secondary" fullWidth className="flex-1">Cancelar</Button>
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
        message={`Tem certeza que deseja excluir "${cycleSubjects.find(s => s.id === deleteSubjectId)?.name}"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (deleteSubjectId) {
            // ✅ OPTIMISTIC UI: Salvar estado anterior para possível reversão
            const subjectToDelete = cycleSubjects.find(s => s.id === deleteSubjectId);
            if (!subjectToDelete) {
              setDeleteSubjectId(null);
              return;
            }
            
            // Atualizar UI imediatamente
            setCycleSubjects(prev => prev.filter(s => s.id !== deleteSubjectId));
            setDeleteSubjectId(null);
            
            // Persistir em background
            Promise.resolve(onDeleteSubject(deleteSubjectId)).catch(() => {
              // Reverter em caso de erro - encontrar posição original
              const originalIndex = subjects.findIndex(s => s.id === deleteSubjectId);
              setCycleSubjects(prev => {
                const newSubjects = [...prev];
                newSubjects.splice(originalIndex >= 0 ? originalIndex : prev.length, 0, subjectToDelete);
                return newSubjects;
              });
              addToast('Erro ao excluir matéria. Tente novamente.', 'error');
            });
            // O estado será sincronizado pelo useEffect quando o servidor responder
          }
        }}
        onCancel={() => setDeleteSubjectId(null)}
      />

      {/* NOVO: Modal de Edição */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm lg:max-w-md shadow-2xl p-5 lg:p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Editar Matéria</h3>
            
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
                inputMode="numeric"
                pattern="[0-9]*"
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
              <Button 
                onClick={handleSaveEdit} 
                variant="primary"
                fullWidth
                className="flex-1 shadow-md"
                leftIcon={<Save size={18} />}
              >
                Salvar
              </Button>
              <Button 
                onClick={() => setEditingSubject(null)} 
                variant="secondary"
                fullWidth
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}