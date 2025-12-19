import { useState, useEffect } from 'react';
import { Save, BookOpen, Check, X, HelpCircle, RefreshCw, Layers, Calendar, Clock, FileText, AlertTriangle } from 'lucide-react';
import { Subject, StudyLog } from '../types';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

interface RegisterPageProps {
  subjects: Subject[];
  onAddLog: (log: Omit<StudyLog, 'id' | 'timestamp'>) => void;
  onUpdateSubject?: (subjectId: string, updates: Partial<Subject>) => void;
  prefilledTime?: { hours: number; minutes: number; seconds: number };
  onTimeClear: () => void;
  timerSeconds: number;
  isTimerRunning: boolean;
}

// ✅ FUNÇÃO DE VALIDAÇÃO
const sanitizeNumericInput = (value: string, max?: number): string => {
  if (value === '') return '';
  const num = parseInt(value);
  if (isNaN(num) || num < 0) return '0';
  if (max !== undefined && num > max) return max.toString();
  return num.toString();
};

export default function RegisterPage({
  subjects,
  onAddLog,
  onUpdateSubject,
  prefilledTime,
  onTimeClear,
  timerSeconds,
  isTimerRunning,
}: RegisterPageProps) {
  const { addToast } = useToast();
  const [subjectId, setSubjectId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [type, setType] = useState<'teoria' | 'questoes' | 'revisao'>('teoria');
  const [dateOption, setDateOption] = useState<'today' | 'yesterday' | 'other'>('today');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [seconds, setSeconds] = useState('');
  const [minutes, setMinutes] = useState('');
  const [notes, setNotes] = useState('');
  
  const [pages, setPages] = useState('');
  const [correct, setCorrect] = useState('');
  const [wrong, setWrong] = useState('');
  const [blank, setBlank] = useState('');
  const [markSubtopicCompleted, setMarkSubtopicCompleted] = useState(false);

  const selectedSubject = subjects.find(s => s.id === subjectId);
  const selectedSubtopic = selectedSubject?.subtopics.find(st => st.id === subtopicId);

  useEffect(() => { 
    setSubtopicId(''); 
    setMarkSubtopicCompleted(false);
  }, [subjectId]);
  
  useEffect(() => {
    // Resetar checkbox quando subtópico muda
    setMarkSubtopicCompleted(false);
  }, [subtopicId]);
  
  useEffect(() => {
    if (prefilledTime) {
      setHours(prefilledTime.hours > 0 ? prefilledTime.hours.toString() : '');
      setMinutes(prefilledTime.minutes > 0 ? prefilledTime.minutes.toString() : '');
      setSeconds(prefilledTime.seconds > 0 ? prefilledTime.seconds.toString() : '');
    }
  }, [prefilledTime]);
  
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      const h = Math.floor(timerSeconds / 3600);
      const m = Math.floor((timerSeconds % 3600) / 60);
      const s = timerSeconds % 60;
      setHours(h > 0 ? h.toString() : '');
      setMinutes(m > 0 ? m.toString() : '');
      setSeconds(s > 0 ? s.toString() : '');
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setDateOption('today');
    }
  }, [timerSeconds, isTimerRunning]);

  // Função para validar data
  const isValidDate = (dateString: string): boolean => {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return selectedDate <= today;
  };

  // Função para calcular dias de diferença
  const getDaysDifference = (dateString: string): number => {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - selectedDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Handler para mudança de opção de data
  const handleDateOptionChange = (option: 'today' | 'yesterday' | 'other') => {
    setDateOption(option);
    
    if (option === 'today') {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    } else if (option === 'yesterday') {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Validação de madrugada (00:00 - 05:59)
      if (currentHour < 6) {
        const confirmMessage = `São ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}. Você quis dizer o dia anterior mesmo?`;
        if (!window.confirm(confirmMessage)) {
          // Se cancelar, volta para "Hoje"
          setDateOption('today');
          setDate(now.toISOString().split('T')[0]);
          return;
        }
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      setDate(yesterday.toISOString().split('T')[0]);
    }
    // Se for "other", mantém a data atual e mostra o date picker
  };

  // Handler para mudança direta do date picker
  const handleDateChange = (newDate: string) => {
    if (!isValidDate(newDate)) {
      addToast('Não é possível registrar estudo futuro', 'error');
      // Reverter para data válida (hoje)
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setDateOption('today');
      return;
    }

    const daysDiff = getDaysDifference(newDate);
    if (daysDiff > 30) {
      const confirmMessage = `Este estudo foi há ${daysDiff} dias. Confirma?`;
      if (!window.confirm(confirmMessage)) {
        // Reverter para data anterior válida
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setDate(yesterday.toISOString().split('T')[0]);
        setDateOption('yesterday');
        return;
      }
    }

    setDate(newDate);
    setDateOption('other');
  };

  const handleHoursChange = (value: string) => setHours(sanitizeNumericInput(value));
  const handleMinutesChange = (value: string) => setMinutes(sanitizeNumericInput(value, 59));
  const handleSecondsChange = (value: string) => setSeconds(sanitizeNumericInput(value, 59));
  const handlePagesChange = (value: string) => setPages(sanitizeNumericInput(value));
  const handleCorrectChange = (value: string) => setCorrect(sanitizeNumericInput(value));
  const handleWrongChange = (value: string) => setWrong(sanitizeNumericInput(value));
  const handleBlankChange = (value: string) => setBlank(sanitizeNumericInput(value));

  const handleSubmit = () => {
    if (!subjectId) {
      addToast('Selecione uma matéria, guerreiro!', 'warning');
      return;
    }
    const h = Math.max(0, parseInt(hours) || 0);
    const m = Math.max(0, parseInt(minutes) || 0);
    const s = Math.max(0, parseInt(seconds) || 0);
    if (h === 0 && m === 0 && s === 0) {
      addToast('O tempo de estudo não pode ser zero.', 'warning');
      return;
    }
    const subtopicName = selectedSubject?.subtopics.find(st => st.id === subtopicId)?.name;

    const newLog: Omit<StudyLog, 'id' | 'timestamp'> = {
      subjectId,
      subject: selectedSubject?.name || 'Desconhecida',
      subtopicId: subtopicId || undefined,
      subtopic: subtopicName || undefined,
      type,
      hours: h,
      minutes: m,
      seconds: s,
      date: date,
      notes: notes.trim(),
      pages: Math.max(0, parseInt(pages) || 0),
      correct: Math.max(0, parseInt(correct) || 0),
      wrong: Math.max(0, parseInt(wrong) || 0),
      blank: Math.max(0, parseInt(blank) || 0),
    };
    
    onAddLog(newLog);
    
    // Marcar subtópico como concluído se opção estiver marcada
    if (markSubtopicCompleted && subtopicId && subjectId && onUpdateSubject && selectedSubject) {
      const updatedSubtopics = selectedSubject.subtopics.map((st) =>
        st.id === subtopicId ? { ...st, completed: true } : st
      );
      onUpdateSubject(subjectId, { subtopics: updatedSubtopics });
    }
    
    setSubjectId('');
    setSubtopicId('');
    setHours('');
    setSeconds('');
    setMinutes('');
    setNotes('');
    setPages('');
    setCorrect('');
    setWrong('');
    setBlank('');
    setMarkSubtopicCompleted(false);
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setDateOption('today');
    onTimeClear();
    
    if (navigator.vibrate) navigator.vibrate(200);
    
    addToast('Estudo registrado com sucesso!', 'success');
  };

  const typeButtons = [
    { id: 'teoria', label: 'Teoria', icon: BookOpen },
    { id: 'questoes', label: 'Questões', icon: HelpCircle },
    { id: 'revisao', label: 'Revisão', icon: RefreshCw },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* OTIMIZAÇÃO MOBILE: Padding lateral reduzido de px-6 para px-4 no mobile para dar mais espaço */}
      
      {/* Header Fixo */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1 transition-colors">Registrar</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">Salve sua missão cumprida</p>
      </div>

      {/* OTIMIZAÇÃO MOBILE: Gap aumentado de gap-4 para gap-5 no mobile, mantendo gap-6 no desktop para melhor respiração */}
      {/* Grid Flexível - Cards Soltos */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
        
        {/* OTIMIZAÇÃO MOBILE: Padding interno mantido p-4 no mobile, md:p-6 no desktop. Gap entre campos aumentado de space-y-4 para space-y-5 */}
        {/* Card 1 - Setup: Matéria e Subtópico */}
        <div className="md:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 space-y-5 transition-colors duration-300">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
              <BookOpen size={14} className="text-emerald-500" /> Matéria
            </label>
            {/* OTIMIZAÇÃO MOBILE: Padding garantido p-3 (mínimo adequado), font-size text-sm para legibilidade */}
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 outline-none text-sm md:text-base text-gray-900 dark:text-white transition-colors">
              <option value="">Selecione a matéria...</option>
              {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>

          {selectedSubject && selectedSubject.subtopics.length > 0 && (
             <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                  <Layers size={14} className="text-emerald-500" /> Subtópico <span className="text-[10px] font-normal opacity-70 normal-case">(Opcional)</span>
                </label>
                {/* OTIMIZAÇÃO MOBILE: Padding garantido p-3, font-size text-sm para legibilidade */}
                <select value={subtopicId} onChange={(e) => setSubtopicId(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 outline-none text-sm text-gray-900 dark:text-white transition-colors">
                  <option value="">Geral (Sem subtópico específico)</option>
                  {selectedSubject.subtopics.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} {st.completed ? '(Concluído)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Opção para marcar subtópico como concluído */}
              {subtopicId && selectedSubtopic && !selectedSubtopic.completed && (
                <button
                  type="button"
                  onClick={() => setMarkSubtopicCompleted(!markSubtopicCompleted)}
                  className={`w-full flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all active:scale-95 ${
                    markSubtopicCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-700'
                  }`}
                >
                  {/* Círculo customizado */}
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    markSubtopicCompleted
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'bg-transparent border-gray-300 dark:border-gray-500'
                  }`}>
                    {markSubtopicCompleted && (
                      <Check size={14} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <span className={`text-sm font-semibold flex items-center gap-2 ${
                      markSubtopicCompleted
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-gray-800 dark:text-white'
                    }`}>
                      Marcar subtópico como concluído
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      "{selectedSubtopic.name}" será marcado como concluído após salvar
                    </p>
                  </div>
                </button>
              )}
              
              {/* Indicador se subtópico já está concluído */}
              {subtopicId && selectedSubtopic && selectedSubtopic.completed && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      Este subtópico já está concluído
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* OTIMIZAÇÃO MOBILE: Padding interno mantido p-4 no mobile, md:p-6 no desktop */}
        {/* Card 2 - Data */}
        <div className="md:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 transition-colors duration-300">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1">
            <Calendar size={14} className="text-emerald-500" /> Data do Estudo
          </label>
          
          {/* Seletor de Opções Rápidas */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              type="button"
              onClick={() => handleDateOptionChange('today')}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95 min-h-[44px] flex items-center justify-center ${
                dateOption === 'today'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => handleDateOptionChange('yesterday')}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95 min-h-[44px] flex items-center justify-center ${
                dateOption === 'yesterday'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Ontem
            </button>
            <button
              type="button"
              onClick={() => handleDateOptionChange('other')}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95 min-h-[44px] flex items-center justify-center ${
                dateOption === 'other'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Outro
            </button>
          </div>

          {/* Date Picker (apenas quando "Outro" está selecionado) */}
          <AnimatePresence>
            {dateOption === 'other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 pointer-events-none z-10" size={20} />
                  <input 
                    type="date" 
                    value={date} 
                    max={new Date().toISOString().split('T')[0]} 
                    onChange={(e) => handleDateChange(e.target.value)} 
                    className="w-full p-3 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 outline-none text-sm md:text-base text-gray-900 dark:text-white transition-colors appearance-none h-12 [color-scheme:light] dark:[color-scheme:dark]" 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* OTIMIZAÇÃO MOBILE: Padding interno mantido p-4 no mobile, md:p-6 no desktop */}
        {/* Card 3 - Tipo de Estudo */}
        <div className="md:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 transition-colors duration-300">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1">
            <RefreshCw size={14} className="text-emerald-500" /> Tipo de Estudo
          </label>
          {/* OTIMIZAÇÃO MOBILE: Gap aumentado de gap-2 para gap-3 para melhor espaçamento. Altura mínima garantida (py-3.5 = ~44px) para toque fácil */}
          <div className="grid grid-cols-3 gap-3">
            {typeButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button key={btn.id} type="button" onClick={() => setType(btn.id as any)} className={`py-3.5 rounded-xl font-semibold text-xs transition-all active:scale-95 flex flex-col items-center gap-1.5 min-h-[44px] ${type === btn.id ? 'bg-emerald-500 text-white shadow-lg scale-105' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  <Icon className="w-4 h-4" /> {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* OTIMIZAÇÃO MOBILE: Padding interno mantido p-4 no mobile, md:p-6 no desktop */}
        {/* Card 4 - Tempo Estudado */}
        <div className="md:col-span-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 transition-colors duration-300">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-4 flex items-center gap-1">
            <Clock size={14} className="text-emerald-500" /> Tempo Estudado
          </label>
          {/* OTIMIZAÇÃO MOBILE: Gap ajustado para gap-3 no mobile (era gap-4), mantendo gap-4 no desktop para melhor respiração */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="flex flex-col items-center">
              <input 
                type="number" 
                inputMode="numeric" 
                min="0" 
                value={hours} 
                onChange={(e) => handleHoursChange(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isTimerRunning} 
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl outline-none text-center font-black text-3xl text-gray-900 dark:text-white focus:border-emerald-500 disabled:opacity-50 transition-colors" 
                placeholder="00" 
              />
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase">Horas</span>
            </div>
            <div className="flex flex-col items-center">
              <input 
                type="number" 
                inputMode="numeric" 
                min="0" 
                max="59" 
                value={minutes} 
                onChange={(e) => handleMinutesChange(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isTimerRunning} 
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl outline-none text-center font-black text-3xl text-gray-900 dark:text-white focus:border-emerald-500 disabled:opacity-50 transition-colors" 
                placeholder="00" 
              />
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase">Minutos</span>
            </div>
            <div className="flex flex-col items-center">
              <input 
                type="number" 
                inputMode="numeric" 
                min="0" 
                max="59" 
                value={seconds} 
                onChange={(e) => handleSecondsChange(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isTimerRunning} 
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl outline-none text-center font-black text-3xl text-gray-900 dark:text-white focus:border-emerald-500 disabled:opacity-50 transition-colors" 
                placeholder="00" 
              />
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase">Segundos</span>
            </div>
          </div>
        </div>

        {/* OTIMIZAÇÃO MOBILE: Padding interno mantido p-4 no mobile, md:p-6 no desktop */}
        {/* Card 5 - Páginas Lidas */}
        <div className="md:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 transition-colors duration-300">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1">
            <BookOpen size={14} className="text-emerald-500" /> Páginas Lidas
          </label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            {/* OTIMIZAÇÃO MOBILE: Padding garantido p-3, font-size text-sm no mobile para legibilidade */}
            <input 
              type="number" 
              inputMode="numeric" 
              min="0" 
              value={pages} 
              onChange={(e) => handlePagesChange(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full p-3 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-emerald-500 text-sm md:text-base text-gray-900 dark:text-white transition-colors h-12" 
              placeholder="Quantidade" 
            />
          </div>
        </div>

        {/* OTIMIZAÇÃO MOBILE: Padding interno mantido p-4 no mobile, md:p-6 no desktop */}
        {/* Card 6 - Desempenho */}
        <div className="md:col-span-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 transition-colors duration-300">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1">
            <FileText size={14} className="text-emerald-500" /> Desempenho
          </label>
          
          {/* OTIMIZAÇÃO MOBILE: Gap mantido gap-3 (já adequado) */}
          <div className="flex gap-3 pr-1">
            {/* BLOCO CERTAS */}
            <div className="flex-1">
              <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 block">CERTAS</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center bg-emerald-500 rounded-l-lg"><Check size={16} className="text-white" /></div>
                {/* OTIMIZAÇÃO MOBILE: Padding aumentado de p-2 para p-2.5 (mínimo adequado), font-size text-sm no mobile */}
                <input 
                  type="number" 
                  inputMode="numeric" 
                  min="0" 
                  placeholder="0" 
                  className="w-full pl-10 p-2.5 border border-emerald-500 bg-gray-50 dark:bg-gray-700 rounded-lg text-emerald-700 dark:text-emerald-300 font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm md:text-base transition-all" 
                  value={correct} 
                  onChange={e => handleCorrectChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </div>
            </div>

            {/* BLOCO ERRADAS */}
            <div className="flex-1">
              <label className="text-[10px] font-bold text-red-600 dark:text-red-400 mb-1 block">ERRADAS</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center bg-red-500 rounded-l-lg"><X size={16} className="text-white" /></div>
                {/* OTIMIZAÇÃO MOBILE: Padding aumentado de p-2 para p-2.5 (mínimo adequado), font-size text-sm no mobile */}
                <input 
                  type="number" 
                  inputMode="numeric" 
                  min="0" 
                  placeholder="0" 
                  className="w-full pl-10 p-2.5 border border-red-500 bg-gray-50 dark:bg-gray-700 rounded-lg text-red-700 dark:text-red-300 font-bold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm md:text-base transition-all" 
                  value={wrong} 
                  onChange={e => handleWrongChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </div>
            </div>

            {/* BLOCO BRANCO */}
            <div className="flex-1">
              <label className="text-[10px] font-bold text-blue-500 dark:text-blue-400 mb-1 block">BRANCO</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center bg-blue-500 rounded-l-lg"><HelpCircle size={16} className="text-white" /></div>
                {/* OTIMIZAÇÃO MOBILE: Padding aumentado de p-2 para p-2.5 (mínimo adequado), font-size text-sm no mobile */}
                <input 
                  type="number" 
                  inputMode="numeric" 
                  min="0" 
                  placeholder="0" 
                  className="w-full pl-10 p-2.5 border border-blue-500 bg-gray-50 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-300 font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm md:text-base transition-all" 
                  value={blank} 
                  onChange={e => handleBlankChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* OTIMIZAÇÃO MOBILE: Padding interno mantido p-4 no mobile, md:p-6 no desktop */}
        {/* Card 7 - Observações */}
        <div className="md:col-span-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 transition-colors duration-300">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
            <FileText size={14} className="text-emerald-500" /> Observações
          </label>
          {/* OTIMIZAÇÃO MOBILE: Padding garantido p-3, altura mínima mantida min-h-[100px] para legibilidade */}
          <textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm text-gray-900 dark:text-white focus:border-emerald-500 resize-none transition-colors min-h-[100px]" 
            placeholder="Ex: Art. 5º, Inciso XI..."
          />
        </div>

        {/* Botão Salvar - Destaque */}
        <div className="md:col-span-12">
          <button 
            onClick={handleSubmit} 
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Save size={20} /> <span>Salvar Registro</span>
          </button>
        </div>
      </div>
    </div>
  );
}