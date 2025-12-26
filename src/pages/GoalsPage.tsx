import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Minus, Save, AlertTriangle, Clock, HelpCircle, Settings, Info, Target } from 'lucide-react';
import { useGoals, Goals } from '../hooks/useGoals';
import { StudyLog } from '../types';
import { useToast } from '../contexts/ToastContext';
import IOSSwitch from '../components/IOSSwitch';
import Button from '../components/Button';

interface GoalsPageProps {
  logs: StudyLog[];
  onNavigateBack: () => void;
}

export default function GoalsPage({ logs, onNavigateBack }: GoalsPageProps) {
  const { goals, updateGoals: _updateGoals, saveGoals } = useGoals(logs);
  const { addToast } = useToast();
  
  const [localGoals, setLocalGoals] = useState<Goals>(goals);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Estados para controle de edição manual
  const [isDailyEditing, setIsDailyEditing] = useState(false);
  const [dailyInputValue, setDailyInputValue] = useState('');
  const [isWeeklyEditing, setIsWeeklyEditing] = useState(false);
  const [weeklyInputValue, setWeeklyInputValue] = useState('');
  
  // Estados para controle de edição de questões
  const [isDailyQuestionsEditing, setIsDailyQuestionsEditing] = useState(false);
  const [dailyQuestionsInputValue, setDailyQuestionsInputValue] = useState('');
  const [isWeeklyQuestionsEditing, setIsWeeklyQuestionsEditing] = useState(false);
  const [weeklyQuestionsInputValue, setWeeklyQuestionsInputValue] = useState('');

  // Sincronizar com goals do hook quando mudarem
  useEffect(() => {
    setLocalGoals(goals);
  }, [goals]);

  // Função para formatar horas em texto legível
  const formatHoursToText = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (minutes === 0) {
      return `${wholeHours}h`;
    }
    return `${wholeHours}h${minutes}min`;
  };

  // Função para converter texto em horas decimais
  const parseTextToHours = (text: string): number | null => {
    // Remove espaços
    const cleaned = text.trim().toLowerCase();
    
    // Rejeita strings vazias
    if (!cleaned) return null;
    
    // Regex: captura "3h30min" ou "3h" ou "30min" ou "3.5"
    // Aceita: "3h30min", "3h", "30min", "3.5", "3", ".5"
    const regex = /^(?:(\d+)h)?(?:(\d+)min)?$|^(\d*\.?\d+)$/;
    const match = cleaned.match(regex);
    
    if (!match) return null;
    
    // Caso: número decimal direto (ex: "3.5", "3", ".5")
    if (match[3]) {
      const value = parseFloat(match[3]);
      if (isNaN(value) || value < 0) return null;
      return value;
    }
    
    // Caso: formato "Xh Ymin" ou apenas "Xh" ou apenas "Ymin"
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    
    // Validações
    if (hours < 0 || minutes < 0) return null;
    if (minutes >= 60) return null; // Minutos inválidos
    
    // Aceita 0h (zero horas) mas rejeita se não tiver nenhum valor válido
    // Se não tem horas nem minutos definidos, é inválido
    if (!match[1] && !match[2]) return null;
    
    return hours + (minutes / 60);
  };

  // Validações
  const validateGoals = (): boolean => {
    const errors: Record<string, string> = {};

    // Meta diária > Meta semanal
    if (localGoals.dailyTimeGoal > localGoals.weeklyTimeGoal) {
      errors.dailyTime = 'Meta diária maior que semanal. Ajuste!';
    }

    // Meta diária de questões > Meta semanal
    if (localGoals.dailyQuestionsGoal > localGoals.weeklyQuestionsGoal) {
      errors.dailyQuestions = 'Meta diária maior que semanal. Ajuste!';
    }

    // Valores muito altos
    if (localGoals.dailyTimeGoal > 12) {
      errors.dailyTimeHigh = 'Meta muito alta, tem certeza?';
    }
    if (localGoals.weeklyTimeGoal > 60) {
      errors.weeklyTimeHigh = 'Meta semanal muito alta';
    }

    // Valores muito baixos
    if (localGoals.dailyTimeGoal < 0.5 && localGoals.dailyTimeGoal > 0) {
      errors.dailyTimeLow = 'Mínimo recomendado: 30min';
    }
    if (localGoals.weeklyTimeGoal < 3 && localGoals.weeklyTimeGoal > 0) {
      errors.weeklyTimeLow = 'Mínimo recomendado: 3h/semana';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Atualizar valor local
  const updateLocalGoal = (field: keyof Goals, value: any) => {
    if (field === 'settings') {
      setLocalGoals(prev => ({
        ...prev,
        settings: { ...prev.settings, ...value },
      }));
    } else {
      setLocalGoals(prev => ({
        ...prev,
        [field]: value,
      }));
    }
    // Limpar erros ao editar
    setValidationErrors({});
  };

  // Ajustar valor com botões +/-
  const adjustValue = (field: 'dailyTimeGoal' | 'weeklyTimeGoal' | 'dailyQuestionsGoal' | 'weeklyQuestionsGoal', delta: number) => {
    const current = localGoals[field];
    let newValue: number;

    if (field === 'dailyTimeGoal') {
      newValue = Math.max(0.5, Math.min(16, current + delta * 0.5));
      newValue = Math.round(newValue * 2) / 2; // Arredondar para 0.5
    } else if (field === 'weeklyTimeGoal') {
      newValue = Math.max(1, Math.min(80, current + delta));
      newValue = Math.round(newValue);
    } else if (field === 'dailyQuestionsGoal') {
      newValue = Math.max(5, Math.min(500, current + delta * 5));
      newValue = Math.round(newValue / 5) * 5; // Múltiplo de 5
    } else {
      newValue = Math.max(10, Math.min(2000, current + delta * 10));
      newValue = Math.round(newValue / 10) * 10; // Múltiplo de 10
    }

    updateLocalGoal(field, newValue);
  };

  // Salvar metas
  const handleSave = () => {
    if (!validateGoals()) {
      addToast('Corrija os erros antes de salvar', 'warning');
      return;
    }

    // Arredondar valores decimais para 1 casa
    const roundedGoals: Goals = {
      ...localGoals,
      dailyTimeGoal: Math.round(localGoals.dailyTimeGoal * 10) / 10,
      weeklyTimeGoal: Math.round(localGoals.weeklyTimeGoal * 10) / 10,
    };

    saveGoals(roundedGoals);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Header */}
      <div className="mb-6">
        <Button
          onClick={onNavigateBack}
          variant="ghost"
          size="md"
          leftIcon={<ArrowLeft size={20} />}
          className="md:hidden mb-4"
        >
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Target className="text-emerald-500" size={28} />
          Metas de Estudo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Configure suas metas diárias e semanais</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* SEÇÃO 1 - METAS DE TEMPO */}
        <div className="md:col-span-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={20} className="text-emerald-500" />
            Metas de Tempo
          </h2>

          <div className="space-y-6">
            {/* Meta Diária (Sugerida) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Meta Diária (Sugerida)
              </label>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    if (isDailyEditing) {
                      setIsDailyEditing(false);
                      setDailyInputValue(formatHoursToText(localGoals.dailyTimeGoal));
                    }
                    adjustValue('dailyTimeGoal', -1);
                  }}
                  variant="secondary"
                  size="sm"
                  className="w-12 h-12 md:w-14 md:h-14 p-0"
                  aria-label="Decrementar 30 minutos"
                >
                  <Minus size={20} className="text-gray-700 dark:text-gray-300" />
                </Button>
                <div className="flex-1">
                  {!isDailyEditing ? (
                    <button
                      onClick={() => {
                        setIsDailyEditing(true);
                        setDailyInputValue(formatHoursToText(localGoals.dailyTimeGoal));
                      }}
                      className="w-full text-center text-2xl font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 hover:border-emerald-500 dark:hover:border-emerald-400"
                    >
                      {formatHoursToText(localGoals.dailyTimeGoal)}
                    </button>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={dailyInputValue}
                        onChange={(e) => setDailyInputValue(e.target.value)}
                        onBlur={() => {
                          const parsed = parseTextToHours(dailyInputValue);
                          
                          if (parsed === null) {
                            addToast('Formato inválido! Use: 4h30min, 4h ou 4.5', 'error');
                            setDailyInputValue(formatHoursToText(localGoals.dailyTimeGoal));
                          } else if (parsed < 0 || parsed > 24) {
                            addToast('Meta deve estar entre 0h e 24h', 'error');
                            setDailyInputValue(formatHoursToText(localGoals.dailyTimeGoal));
                          } else {
                            updateLocalGoal('dailyTimeGoal', parsed);
                          }
                          
                          setIsDailyEditing(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur(); // Dispara o onBlur
                          }
                          if (e.key === 'Escape') {
                            setIsDailyEditing(false);
                            setDailyInputValue(formatHoursToText(localGoals.dailyTimeGoal));
                          }
                        }}
                        autoFocus
                        className="w-full text-center text-2xl font-bold text-emerald-600 dark:text-emerald-400 bg-transparent border-b-2 border-emerald-500 dark:border-emerald-400 outline-none py-3 px-4"
                        placeholder="Ex: 4h30min"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                        Ex: 4h30min, 4h, 270min ou 4.5
                      </p>
                    </div>
                  )}
                  {!isDailyEditing && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">horas/dia</p>
                  )}
                </div>
                <Button
                  onClick={() => {
                    if (isDailyEditing) {
                      setIsDailyEditing(false);
                      setDailyInputValue(formatHoursToText(localGoals.dailyTimeGoal));
                    }
                    adjustValue('dailyTimeGoal', 1);
                  }}
                  variant="secondary"
                  size="sm"
                  className="w-12 h-12 md:w-14 md:h-14 p-0"
                  aria-label="Incrementar 30 minutos"
                >
                  <Plus size={20} className="text-gray-700 dark:text-gray-300" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Ajuda na consistência, mas é flexível</p>
              {validationErrors.dailyTime && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {validationErrors.dailyTime}
                </p>
              )}
              {validationErrors.dailyTimeHigh && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {validationErrors.dailyTimeHigh}
                </p>
              )}
              {validationErrors.dailyTimeLow && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                  <Info size={14} />
                  {validationErrors.dailyTimeLow}
                </p>
              )}
            </div>

            {/* Meta Semanal (Obrigatória) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Meta Semanal (Obrigatória)
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (isWeeklyEditing) {
                      setIsWeeklyEditing(false);
                      setWeeklyInputValue(formatHoursToText(localGoals.weeklyTimeGoal));
                    }
                    adjustValue('weeklyTimeGoal', -1);
                  }}
                  className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  aria-label="Decrementar 1 hora"
                >
                  <Minus size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex-1">
                  {!isWeeklyEditing ? (
                    <button
                      onClick={() => {
                        setIsWeeklyEditing(true);
                        setWeeklyInputValue(formatHoursToText(localGoals.weeklyTimeGoal));
                      }}
                      className="w-full text-center text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 hover:border-blue-500 dark:hover:border-blue-400"
                    >
                      {formatHoursToText(localGoals.weeklyTimeGoal)}
                    </button>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={weeklyInputValue}
                        onChange={(e) => setWeeklyInputValue(e.target.value)}
                        onBlur={() => {
                          const parsed = parseTextToHours(weeklyInputValue);
                          
                          if (parsed === null) {
                            addToast('Formato inválido! Use: 25h30min, 25h ou 25.5', 'error');
                            setWeeklyInputValue(formatHoursToText(localGoals.weeklyTimeGoal));
                          } else if (parsed < 0 || parsed > 168) {
                            addToast('Meta deve estar entre 0h e 168h (7 dias)', 'error');
                            setWeeklyInputValue(formatHoursToText(localGoals.weeklyTimeGoal));
                          } else {
                            updateLocalGoal('weeklyTimeGoal', parsed);
                          }
                          
                          setIsWeeklyEditing(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur(); // Dispara o onBlur
                          }
                          if (e.key === 'Escape') {
                            setIsWeeklyEditing(false);
                            setWeeklyInputValue(formatHoursToText(localGoals.weeklyTimeGoal));
                          }
                        }}
                        autoFocus
                        className="w-full text-center text-2xl font-bold text-blue-600 dark:text-blue-400 bg-transparent border-b-2 border-blue-500 dark:border-blue-400 outline-none py-3 px-4"
                        placeholder="Ex: 25h"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                        Ex: 25h30min, 25h, 1530min ou 25.5
                      </p>
                    </div>
                  )}
                  {!isWeeklyEditing && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">horas/semana</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (isWeeklyEditing) {
                      setIsWeeklyEditing(false);
                      setWeeklyInputValue(formatHoursToText(localGoals.weeklyTimeGoal));
                    }
                    adjustValue('weeklyTimeGoal', 1);
                  }}
                  className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  aria-label="Incrementar 1 hora"
                >
                  <Plus size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Meta principal - permite compensar dias</p>
              {validationErrors.weeklyTimeHigh && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {validationErrors.weeklyTimeHigh}
                </p>
              )}
              {validationErrors.weeklyTimeLow && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                  <Info size={14} />
                  {validationErrors.weeklyTimeLow}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SEÇÃO 2 - METAS DE QUESTÕES */}
        <div className="md:col-span-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <HelpCircle size={20} className="text-emerald-500" />
            Metas de Questões
          </h2>

          <div className="space-y-6">
            {/* Meta Diária (Sugerida) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Meta Diária (Sugerida)
              </label>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    if (isDailyQuestionsEditing) {
                      setIsDailyQuestionsEditing(false);
                      setDailyQuestionsInputValue(localGoals.dailyQuestionsGoal.toString());
                    }
                    adjustValue('dailyQuestionsGoal', -1);
                  }}
                  variant="secondary"
                  size="sm"
                  className="w-12 h-12 md:w-14 md:h-14 p-0"
                  aria-label="Decrementar 5 questões"
                >
                  <Minus size={20} className="text-gray-700 dark:text-gray-300" />
                </Button>
                <div className="flex-1">
                  {!isDailyQuestionsEditing ? (
                    <button
                      onClick={() => {
                        setIsDailyQuestionsEditing(true);
                        setDailyQuestionsInputValue(localGoals.dailyQuestionsGoal.toString());
                      }}
                      className="w-full text-center text-2xl font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 hover:border-emerald-500 dark:hover:border-emerald-400"
                    >
                      {localGoals.dailyQuestionsGoal}
                    </button>
                  ) : (
                    <div>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        step="5"
                        min="5"
                        max="500"
                        value={dailyQuestionsInputValue}
                        onChange={(e) => setDailyQuestionsInputValue(e.target.value)}
                        onBlur={() => {
                          const value = parseInt(dailyQuestionsInputValue) || 0;
                          const clamped = Math.max(5, Math.min(500, value));
                          updateLocalGoal('dailyQuestionsGoal', clamped);
                          setIsDailyQuestionsEditing(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                          if (e.key === 'Escape') {
                            setIsDailyQuestionsEditing(false);
                            setDailyQuestionsInputValue(localGoals.dailyQuestionsGoal.toString());
                          }
                        }}
                        autoFocus
                        className="w-full text-center text-2xl font-bold text-emerald-600 dark:text-emerald-400 bg-transparent border-b-2 border-emerald-500 dark:border-emerald-400 outline-none py-3 px-4"
                        placeholder="Ex: 50"
                      />
                    </div>
                  )}
                  {!isDailyQuestionsEditing && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">questões/dia</p>
                  )}
                </div>
                <Button
                  onClick={() => {
                    if (isDailyQuestionsEditing) {
                      setIsDailyQuestionsEditing(false);
                      setDailyQuestionsInputValue(localGoals.dailyQuestionsGoal.toString());
                    }
                    adjustValue('dailyQuestionsGoal', 1);
                  }}
                  variant="secondary"
                  size="sm"
                  className="w-12 h-12 md:w-14 md:h-14 p-0"
                  aria-label="Incrementar 5 questões"
                >
                  <Plus size={20} className="text-gray-700 dark:text-gray-300" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Quantidade sugerida por dia</p>
              {validationErrors.dailyQuestions && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {validationErrors.dailyQuestions}
                </p>
              )}
            </div>

            {/* Meta Semanal (Obrigatória) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Meta Semanal (Obrigatória)
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (isWeeklyQuestionsEditing) {
                      setIsWeeklyQuestionsEditing(false);
                      setWeeklyQuestionsInputValue(localGoals.weeklyQuestionsGoal.toString());
                    }
                    adjustValue('weeklyQuestionsGoal', -1);
                  }}
                  className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  aria-label="Decrementar 10 questões"
                >
                  <Minus size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex-1">
                  {!isWeeklyQuestionsEditing ? (
                    <button
                      onClick={() => {
                        setIsWeeklyQuestionsEditing(true);
                        setWeeklyQuestionsInputValue(localGoals.weeklyQuestionsGoal.toString());
                      }}
                      className="w-full text-center text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 hover:border-blue-500 dark:hover:border-blue-400"
                    >
                      {localGoals.weeklyQuestionsGoal}
                    </button>
                  ) : (
                    <div>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        step="10"
                        min="10"
                        max="2000"
                        value={weeklyQuestionsInputValue}
                        onChange={(e) => setWeeklyQuestionsInputValue(e.target.value)}
                        onBlur={() => {
                          const value = parseInt(weeklyQuestionsInputValue) || 0;
                          const clamped = Math.max(10, Math.min(2000, value));
                          updateLocalGoal('weeklyQuestionsGoal', clamped);
                          setIsWeeklyQuestionsEditing(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                          if (e.key === 'Escape') {
                            setIsWeeklyQuestionsEditing(false);
                            setWeeklyQuestionsInputValue(localGoals.weeklyQuestionsGoal.toString());
                          }
                        }}
                        autoFocus
                        className="w-full text-center text-2xl font-bold text-blue-600 dark:text-blue-400 bg-transparent border-b-2 border-blue-500 dark:border-blue-400 outline-none py-3 px-4"
                        placeholder="Ex: 100"
                      />
                    </div>
                  )}
                  {!isWeeklyQuestionsEditing && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">questões/semana</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (isWeeklyQuestionsEditing) {
                      setIsWeeklyQuestionsEditing(false);
                      setWeeklyQuestionsInputValue(localGoals.weeklyQuestionsGoal.toString());
                    }
                    adjustValue('weeklyQuestionsGoal', 1);
                  }}
                  className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  aria-label="Incrementar 10 questões"
                >
                  <Plus size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Meta principal da semana</p>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3 - CONFIGURAÇÕES AVANÇADAS */}
        <div className="md:col-span-12 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings size={20} className="text-emerald-500" />
            Configurações Avançadas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Contar finais de semana */}
            <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Contar finais de semana
                </span>
                <IOSSwitch
                  checked={localGoals.settings.countWeekends}
                  onChange={(checked) => updateLocalGoal('settings', { countWeekends: checked })}
                  aria-label="Contar finais de semana na meta semanal"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {localGoals.settings.countWeekends 
                  ? 'Meta divide por 7 dias' 
                  : 'Meta divide por 5 dias (seg-sex)'}
              </p>
            </div>

            {/* Modo estrito */}
            <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Modo estrito
                </span>
                <IOSSwitch
                  checked={localGoals.settings.strictMode}
                  onChange={(checked) => updateLocalGoal('settings', { strictMode: checked })}
                  aria-label="Modo estrito (exigir 100% para sucesso)"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {localGoals.settings.strictMode 
                  ? 'Só verde com 100%+' 
                  : 'Sistema de níveis (50%/80%/100%)'}
              </p>
            </div>

            {/* Notificações */}
            <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Notificações diárias
                </span>
                <IOSSwitch
                  checked={localGoals.settings.notifications}
                  onChange={(checked) => updateLocalGoal('settings', { notifications: checked })}
                  aria-label="Notificações de progresso diário"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Notifica fim do dia com % atingido
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="mt-6 flex justify-center">
        <Button
          onClick={handleSave}
          variant="primary"
          size="lg"
          leftIcon={<Save size={20} />}
          className="w-full md:w-auto md:px-12 shadow-lg shadow-emerald-500/20"
        >
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
