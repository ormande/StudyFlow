import { useState } from 'react';
import { Plus, Trash2, Check, X, ChevronDown, ChevronUp, RefreshCw, Target } from 'lucide-react';
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
}

export default function CyclePage({
  subjects,
  logs,
  cycleStartDate,
  onAddSubject,
  onDeleteSubject,
  onUpdateSubject,
  onRestartCycle
}: CyclePageProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [newSubtopic, setNewSubtopic] = useState('');

  const handleAddSubject = () => {
    if (!newName.trim() || !newGoal) {
      alert('Preencha todos os campos!');
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

  const totalCycleProgress = getTotalCycleProgress();

  return (
    <div className="max-w-lg mx-auto px-6 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 transition-colors">Ciclo de Estudos</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">Gerencie suas matérias e acompanhe o progresso</p>
      </div>

      {/* CARD DE STATUS DO CICLO */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg mb-8 transition-colors duration-300">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Status do Ciclo</h2>
            <p className="text-xs text-gray-400">Média geral de conclusão</p>
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
          <RefreshCw size={18} /> ENCERRAR E REINICIAR CICLO
        </button>
      </div>

      {/* Lista de Matérias */}
      <div className="space-y-4 mb-12">
        {subjects.map((subject) => {
          const { totalMinutes, percentage } = getSubjectProgress(subject.id, subject.goalMinutes);
          const isExpanded = expandedSubject === subject.id;

          return (
            <div key={subject.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-colors duration-300">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">{subject.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Meta: {subject.goalMinutes} min • Ciclo Atual: {totalMinutes} min
                    </p>
                  </div>
                  <button onClick={() => { if (confirm(`Excluir "${subject.name}"?`)) onDeleteSubject(subject.id); }} className="text-red-500 hover:text-red-600 p-2">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div className="h-full transition-all duration-300 rounded-full" style={{ width: `${percentage}%`, backgroundColor: percentage >= 100 ? '#10b981' : subject.color }} />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-right">{percentage.toFixed(1)}%</p>
                </div>

                <button onClick={() => setExpandedSubject(isExpanded ? null : subject.id)} className="w-full flex items-center justify-between py-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                  <span>Subtópicos ({subject.subtopics.filter((st) => st.completed).length}/{subject.subtopics.length})</span>
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="space-y-2 mb-4">
                    {subject.subtopics.map((subtopic) => (
                      <div key={subtopic.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <button
                          onClick={() => handleToggleSubtopic(subject.id, subtopic.id)}
                          className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            subtopic.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-500 hover:border-emerald-400'
                          }`}
                        >
                          {subtopic.completed && <Check className="w-4 h-4 text-white" />}
                        </button>
                        <span className={`flex-1 text-sm ${subtopic.completed ? 'text-gray-500 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200 font-medium'}`}>
                          {subtopic.name}
                        </span>
                        <button onClick={() => handleDeleteSubtopic(subject.id, subtopic.id)} className="text-red-500 hover:text-red-600 p-1">
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
                      onKeyPress={(e) => { if (e.key === 'Enter') handleAddSubtopic(subject.id); }}
                    />
                    <button onClick={() => handleAddSubtopic(subject.id)} className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-semibold hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Adicionar Matéria
          </button>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 space-y-4 transition-colors">
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Meta do Ciclo (minutos)</label>
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
              <button onClick={handleAddSubject} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-all">Salvar</button>
              <button onClick={() => { setIsAdding(false); setNewName(''); setNewGoal(''); }} className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}