import { useState, useEffect } from 'react';
import { Save, BookOpen, Check, X, HelpCircle, RefreshCw } from 'lucide-react';
import { Subject, StudyLog, StudyType } from '../types';

interface RegisterPageProps {
  subjects: Subject[];
  onAddLog: (log: Omit<StudyLog, 'id' | 'timestamp'>) => void;
  prefilledTime?: { hours: number; minutes: number; seconds: number };
  onTimeClear?: () => void;
}

export default function RegisterPage({
  subjects,
  onAddLog,
  prefilledTime,
  onTimeClear,
}: RegisterPageProps) {
  const [subjectId, setSubjectId] = useState('');
  const [type, setType] = useState<StudyType>('teoria');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState(''); // NOVO STATE
  const [pages, setPages] = useState('');
  const [correct, setCorrect] = useState('');
  const [wrong, setWrong] = useState('');
  const [blank, setBlank] = useState('');
  const [enableBlank, setEnableBlank] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (prefilledTime) {
      setHours(String(prefilledTime.hours));
      setMinutes(String(prefilledTime.minutes));
      setSeconds(String(prefilledTime.seconds)); // Preenche segundos
    }
  }, [prefilledTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subjectId) {
      alert('Preencha a matéria e o tempo de estudo!');
      return;
    }

    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;

    if (h === 0 && m === 0 && s === 0) {
      alert('O tempo de estudo não pode ser zero.');
      return;
    }

    const log: Omit<StudyLog, 'id' | 'timestamp'> = {
      subjectId,
      type,
      hours: h,
      minutes: m,
      seconds: s, // Salva segundos
      date: new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
    };

    if (type === 'teoria' && pages) {
      log.pages = parseInt(pages);
    }

    if (type === 'questoes') {
      log.correct = parseInt(correct) || 0;
      log.wrong = parseInt(wrong) || 0;
      if (enableBlank) {
        log.blank = parseInt(blank) || 0;
      }
    }

    onAddLog(log);

    setSubjectId('');
    setHours('');
    setMinutes('');
    setSeconds('');
    setPages('');
    setCorrect('');
    setWrong('');
    setBlank('');
    setEnableBlank(false);
    setNotes('');

    if (onTimeClear) {
      onTimeClear();
    }

    alert('Estudo registrado com sucesso! 🚀');
  };

  const typeButtons = [
    { id: 'teoria' as StudyType, label: 'Teoria', icon: BookOpen },
    { id: 'questoes' as StudyType, label: 'Questões', icon: HelpCircle },
    { id: 'revisao' as StudyType, label: 'Revisão', icon: RefreshCw },
  ];

  return (
    <div className="max-w-lg mx-auto px-6 py-6 pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Registrar Estudo</h1>
        <p className="text-gray-600 text-sm">Adicione seus estudos manualmente</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Matéria *
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800 font-medium bg-white"
            required
          >
            <option value="">Selecione uma matéria</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Tipo de Estudo *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {typeButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setType(btn.id)}
                  className={`py-4 rounded-xl font-semibold text-sm transition-all flex flex-col items-center gap-2 ${
                    type === btn.id
                      ? 'bg-emerald-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tempo com 3 colunas (H, M, S) e inputMode numeric */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Horas
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800 font-medium text-center"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">H</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Minutos
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800 font-medium text-center"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">M</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Segundos
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800 font-medium text-center"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">S</span>
            </div>
          </div>
        </div>

        {type === 'teoria' && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Páginas Lidas
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="Opcional"
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800 font-medium"
            />
          </div>
        )}

        {type === 'questoes' && (
          <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Certas
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={correct}
                  onChange={(e) => setCorrect(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Erradas
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={wrong}
                  onChange={(e) => setWrong(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enableBlank"
                checked={enableBlank}
                onChange={(e) => setEnableBlank(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="enableBlank" className="text-sm font-medium text-gray-700">
                Registrar questões em branco
              </label>
            </div>

            {enableBlank && (
              <div className="animate-in fade-in slide-in-from-top-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Em Branco
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={blank}
                  onChange={(e) => setBlank(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800 font-medium"
                />
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Adicione notas sobre esse estudo..."
            rows={4}
            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-5 rounded-2xl font-bold text-lg text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <Save className="w-6 h-6" />
          Salvar Estudo
        </button>
      </form>
    </div>
  );
}