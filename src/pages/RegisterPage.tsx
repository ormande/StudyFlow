import { useState, useEffect } from 'react';
import { Save, BookOpen, Check, X, HelpCircle, RefreshCw, Layers, Calendar, Clock, FileText } from 'lucide-react';
import { Subject, StudyLog } from '../types';
import { useToast } from '../contexts/ToastContext';

interface RegisterPageProps {
  subjects: Subject[];
  onAddLog: (log: Omit<StudyLog, 'id' | 'timestamp'>) => void;
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
  prefilledTime,
  onTimeClear,
  timerSeconds,
  isTimerRunning,
}: RegisterPageProps) {
  const { addToast } = useToast();
  const [subjectId, setSubjectId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [type, setType] = useState<'teoria' | 'questoes' | 'revisao'>('teoria');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [seconds, setSeconds] = useState('');
  const [minutes, setMinutes] = useState('');
  const [notes, setNotes] = useState('');
  
  const [pages, setPages] = useState('');
  const [correct, setCorrect] = useState('');
  const [wrong, setWrong] = useState('');
  const [blank, setBlank] = useState('');

  const selectedSubject = subjects.find(s => s.id === subjectId);

  useEffect(() => { setSubtopicId(''); }, [subjectId]);
  
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
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [timerSeconds, isTimerRunning]);

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
    setDate(new Date().toISOString().split('T')[0]);
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
    <div className="max-w-7xl mx-auto px-6 py-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      
      {/* Header Fixo */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1 transition-colors">Registrar</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">Salve sua missão cumprida</p>
      </div>

      {/* Grid Flexível - Cards Soltos */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        
        {/* Card 1 - Setup: Matéria e Subtópico */}
        <div className="md:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-4 transition-colors duration-300">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
              <BookOpen size={14} className="text-emerald-500" /> Matéria
            </label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 outline-none text-base text-gray-900 dark:text-white transition-colors">
              <option value="">Selecione a matéria...</option>
              {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>

          {selectedSubject && selectedSubject.subtopics.length > 0 && (
             <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                <Layers size={14} className="text-emerald-500" /> Subtópico <span className="text-[10px] font-normal opacity-70 normal-case">(Opcional)</span>
              </label>
              <select value={subtopicId} onChange={(e) => setSubtopicId(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 outline-none text-sm text-gray-900 dark:text-white transition-colors">
                <option value="">Geral (Sem subtópico específico)</option>
                {selectedSubject.subtopics.map((st) => (<option key={st.id} value={st.id}>{st.name}</option>))}
              </select>
            </div>
          )}
        </div>

        {/* Card 2 - Data */}
        <div className="md:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
            <Calendar size={14} className="text-emerald-500" /> Data
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 pointer-events-none" size={20} />
            <input 
              type="date" 
              value={date} 
              max={new Date().toISOString().split('T')[0]} 
              onChange={(e) => setDate(e.target.value)} 
              className="w-full p-3 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 outline-none text-base text-gray-900 dark:text-white transition-colors appearance-none h-12 [color-scheme:light] dark:[color-scheme:dark]" 
            />
          </div>
        </div>

        {/* Card 3 - Tipo de Estudo */}
        <div className="md:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1">
            <RefreshCw size={14} className="text-emerald-500" /> Tipo de Estudo
          </label>
          <div className="grid grid-cols-3 gap-2">
            {typeButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button key={btn.id} type="button" onClick={() => setType(btn.id as any)} className={`py-3 rounded-xl font-semibold text-xs transition-all active:scale-95 flex flex-col items-center gap-1 ${type === btn.id ? 'bg-emerald-500 text-white shadow-lg scale-105' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  <Icon className="w-4 h-4" /> {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 4 - Tempo Estudado */}
        <div className="md:col-span-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-4 flex items-center gap-1">
            <Clock size={14} className="text-emerald-500" /> Tempo Estudado
          </label>
          <div className="grid grid-cols-3 gap-4">
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

        {/* Card 5 - Páginas Lidas */}
        <div className="md:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1">
            <BookOpen size={14} className="text-emerald-500" /> Páginas Lidas
          </label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
              className="w-full p-3 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-emerald-500 text-base text-gray-900 dark:text-white transition-colors h-12" 
              placeholder="Quantidade" 
            />
          </div>
        </div>

        {/* Card 6 - Desempenho */}
        <div className="md:col-span-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1">
            <FileText size={14} className="text-emerald-500" /> Desempenho
          </label>
          
          <div className="flex gap-3 pr-1">
            {/* BLOCO CERTAS */}
            <div className="flex-1">
              <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 block">CERTAS</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center bg-emerald-500 rounded-l-lg"><Check size={16} className="text-white" /></div>
                <input 
                  type="number" 
                  inputMode="numeric" 
                  min="0" 
                  placeholder="0" 
                  className="w-full pl-10 p-2 border border-emerald-500 bg-gray-50 dark:bg-gray-700 rounded-lg text-emerald-700 dark:text-emerald-300 font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-base transition-all" 
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
                <input 
                  type="number" 
                  inputMode="numeric" 
                  min="0" 
                  placeholder="0" 
                  className="w-full pl-10 p-2 border border-red-500 bg-gray-50 dark:bg-gray-700 rounded-lg text-red-700 dark:text-red-300 font-bold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-base transition-all" 
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
                <input 
                  type="number" 
                  inputMode="numeric" 
                  min="0" 
                  placeholder="0" 
                  className="w-full pl-10 p-2 border border-blue-500 bg-gray-50 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-300 font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-base transition-all" 
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

        {/* Card 7 - Observações */}
        <div className="md:col-span-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
            <FileText size={14} className="text-emerald-500" /> Observações
          </label>
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