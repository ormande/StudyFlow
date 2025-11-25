import { useState, useEffect } from 'react';
import { Save, BookOpen, Check, X, HelpCircle, RefreshCw } from 'lucide-react';
import { Subject, StudyLog } from '../types';

interface RegisterPageProps {
  subjects: Subject[];
  onAddLog: (log: Omit<StudyLog, 'id' | 'timestamp'>) => void;
  prefilledTime?: { hours: number; minutes: number; seconds: number };
  onTimeClear: () => void;
  timerSeconds: number;
  isTimerRunning: boolean;
}

export default function RegisterPage({
  subjects,
  onAddLog,
  prefilledTime,
  onTimeClear,
  timerSeconds,
  isTimerRunning,
}: RegisterPageProps) {
  const [subjectId, setSubjectId] = useState('');
  const [type, setType] = useState<'teoria' | 'questoes' | 'revisao'>('teoria');
  const [hours, setHours] = useState('');
  const [seconds, setSeconds] = useState('');
  const [minutes, setMinutes] = useState('');
  const [notes, setNotes] = useState('');
  
  const [pages, setPages] = useState('');
  const [correct, setCorrect] = useState('');
  const [wrong, setWrong] = useState('');
  const [blank, setBlank] = useState('');
  const [showBlank, setShowBlank] = useState(false);

  useEffect(() => {
    if (prefilledTime) {
      setHours(prefilledTime.hours.toString());
      setMinutes(prefilledTime.minutes.toString());
      setSeconds(prefilledTime.seconds.toString());
    }
  }, [prefilledTime]);

  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      const h = Math.floor(timerSeconds / 3600);
      const m = Math.floor((timerSeconds % 3600) / 60);
      const s = timerSeconds % 60;
      setHours(h.toString());
      setMinutes(m.toString());
      setSeconds(s.toString());
    }
  }, [timerSeconds, isTimerRunning]);

  const handleSubmit = () => {
    if (!subjectId) {
      alert('Selecione uma matéria, guerreiro!');
      return;
    }

    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;

    if (h === 0 && m === 0 && s === 0) {
      alert('O tempo de estudo não pode ser zero.');
      return;
    }

    const subject = subjects.find(s => s.id === subjectId);

    const newLog: any = {
      subjectId,
      subject: subject?.name || 'Desconhecida',
      type,
      hours: h,
      minutes: m,
      seconds: s,
      date: (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })(),
      notes: notes.trim(),
    };

    if (type === 'teoria') {
      newLog.pages = parseInt(pages) || 0;
    } else if (type === 'questoes') {
      newLog.correct = parseInt(correct) || 0;
      newLog.wrong = parseInt(wrong) || 0;
      newLog.blank = parseInt(blank) || 0;
    }

    onAddLog(newLog);
    
    setSubjectId('');
    setHours('');
    setSeconds('');
    setMinutes('');
    setNotes('');
    setPages('');
    setCorrect('');
    setWrong('');
    setBlank('');
    onTimeClear();
    
    alert('Estudo registrado! 🚀');
  };

  const typeButtons = [
    { id: 'teoria', label: 'Teoria', icon: BookOpen },
    { id: 'questoes', label: 'Questões', icon: HelpCircle },
    { id: 'revisao', label: 'Revisão', icon: RefreshCw },
  ];

  return (
    <div className="max-w-lg mx-auto px-6 py-6 pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1 transition-colors">Registrar</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">Salve sua missão cumprida</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6 transition-colors duration-300">
        
        {/* Seleção de Matéria */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Matéria</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 outline-none text-base text-gray-900 dark:text-white transition-colors"
          >
            <option value="">Selecione a matéria...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Estudo */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">
            Tipo de Estudo
          </label>
          <div className="grid grid-cols-3 gap-3">
            {typeButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setType(btn.id as any)}
                  className={`py-4 rounded-xl font-semibold text-sm transition-all flex flex-col items-center gap-2 ${
                    type === btn.id
                      ? 'bg-emerald-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tempo */}
        <div className="grid grid-cols-3 gap-3">
          {['Horas', 'Minutos', 'Segundos'].map((label, idx) => (
            <div key={label}>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{label}</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max={idx > 0 ? 59 : undefined}
                  value={idx === 0 ? hours : idx === 1 ? minutes : seconds}
                  onChange={(e) => {
                    if (idx === 0) setHours(e.target.value);
                    else if (idx === 1) setMinutes(e.target.value);
                    else setSeconds(e.target.value);
                  }}
                  disabled={isTimerRunning}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-center font-bold text-lg text-gray-900 dark:text-white focus:border-emerald-500 disabled:opacity-50 transition-colors"
                  placeholder="00"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">{label[0]}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Condicional: Teoria (Páginas) */}
        {type === 'teoria' && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-200">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Páginas Lidas</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input
                type="number"
                inputMode="numeric"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className="w-full p-3 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-emerald-500 text-base text-gray-900 dark:text-white transition-colors"
                placeholder="Quantidade de páginas"
              />
            </div>
          </div>
        )}

        {/* Condicional: Questões */}
        {type === 'questoes' && (
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200 transition-colors">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Desempenho</label>
              <button 
                onClick={() => setShowBlank(!showBlank)}
                className="text-[10px] font-bold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-colors shadow-sm active:scale-95"
              >
                {showBlank ? 'Ocultar "Em Branco"' : 'Mostrar "Em Branco"'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Certas */}
              <div>
                <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 block">CERTAS</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center bg-emerald-500 rounded-l-lg">
                    <Check size={16} className="text-white" />
                  </div>
                  <input 
                    type="number" inputMode="numeric" placeholder="0" 
                    className="w-full pl-10 p-2 border border-emerald-500 bg-white dark:bg-gray-700 rounded-lg text-emerald-700 dark:text-emerald-300 font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-base transition-colors" 
                    value={correct} onChange={e => setCorrect(e.target.value)} 
                  />
                </div>
              </div>
              
              {/* Erradas */}
              <div>
                <label className="text-[10px] font-bold text-red-600 dark:text-red-400 mb-1 block">ERRADAS</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center bg-red-500 rounded-l-lg">
                    <X size={16} className="text-white" />
                  </div>
                  <input 
                    type="number" inputMode="numeric" placeholder="0" 
                    className="w-full pl-10 p-2 border border-red-500 bg-white dark:bg-gray-700 rounded-lg text-red-700 dark:text-red-300 font-bold outline-none focus:ring-2 focus:ring-red-500 text-base transition-colors" 
                    value={wrong} onChange={e => setWrong(e.target.value)} 
                  />
                </div>
              </div>
              
              {/* Em Branco */}
              {showBlank && (
                <div className="col-span-2 animate-in fade-in slide-in-from-top-1">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 block">EM BRANCO</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center bg-gray-500 rounded-l-lg">
                      <HelpCircle size={16} className="text-white" />
                    </div>
                    <input 
                      type="number" inputMode="numeric" placeholder="0" 
                      className="w-full pl-10 p-2 border border-gray-500 bg-white dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-200 font-bold outline-none focus:ring-2 focus:ring-gray-400 text-base transition-colors" 
                      value={blank} onChange={e => setBlank(e.target.value)} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Observações */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Observações</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm text-gray-900 dark:text-white focus:border-emerald-500 resize-none transition-colors"
            placeholder="Ex: Art. 5º, Inciso XI..."
          ></textarea>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          <Save size={20} />
          <span>Salvar Registro</span>
        </button>
      </div>
    </div>
  );
}