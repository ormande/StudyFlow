import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Minus, Save, AlertTriangle, Clock, HelpCircle, Settings, Info, Target } from 'lucide-react';
import { useGoals, Goals } from '../hooks/useGoals';
import { StudyLog } from '../types';
import { useToast } from '../contexts/ToastContext';
import IOSSwitch from '../components/IOSSwitch';

interface GoalsPageProps {
  logs: StudyLog[];
  onNavigateBack: () => void;
}

export default function GoalsPage({ logs, onNavigateBack }: GoalsPageProps) {
  const { goals, updateGoals: _updateGoals, saveGoals } = useGoals(logs);
  const { addToast } = useToast();
  
  const [localGoals, setLocalGoals] = useState<Goals>(goals);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Sincronizar com goals do hook quando mudarem
  useEffect(() => {
    setLocalGoals(goals);
  }, [goals]);

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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onNavigateBack}
          className="md:hidden flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="font-semibold">Voltar</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
          <Target className="text-emerald-500" size={28} />
          Metas de Estudo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Configure suas metas diárias e semanais</p>
      </div>

      <div className="space-y-6">
        {/* SEÇÃO 1 - METAS DE TEMPO */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
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
                <button
                  onClick={() => adjustValue('dailyTimeGoal', -1)}
                  className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  aria-label="Decrementar 30 minutos"
                >
                  <Minus size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="16"
                    value={localGoals.dailyTimeGoal}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      const clamped = Math.max(0.5, Math.min(16, value));
                      updateLocalGoal('dailyTimeGoal', clamped);
                    }}
                    className="w-full text-center text-2xl font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">horas/dia</p>
                </div>
                <button
                  onClick={() => adjustValue('dailyTimeGoal', 1)}
                  className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  aria-label="Incrementar 30 minutos"
                >
                  <Plus size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
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
                  onClick={() => adjustValue('weeklyTimeGoal', -1)}
                  className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  aria-label="Decrementar 1 hora"
                >
                  <Minus size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex-1">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="80"
                    value={localGoals.weeklyTimeGoal}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      const clamped = Math.max(1, Math.min(80, value));
                      updateLocalGoal('weeklyTimeGoal', clamped);
                    }}
                    className="w-full text-center text-2xl font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">horas/semana</p>
                </div>
                <button
                  onClick={() => adjustValue('weeklyTimeGoal', 1)}
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
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
                <button
                  onClick={() => adjustValue('dailyQuestionsGoal', -1)}
                  className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  aria-label="Decrementar 5 questões"
                >
                  <Minus size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex-1">
                  <input
                    type="number"
                    step="5"
                    min="5"
                    max="500"
                    value={localGoals.dailyQuestionsGoal}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const clamped = Math.max(5, Math.min(500, value));
                      updateLocalGoal('dailyQuestionsGoal', clamped);
                    }}
                    className="w-full text-center text-2xl font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">questões/dia</p>
                </div>
                <button
                  onClick={() => adjustValue('dailyQuestionsGoal', 1)}
                  className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  aria-label="Incrementar 5 questões"
                >
                  <Plus size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
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
                  onClick={() => adjustValue('weeklyQuestionsGoal', -1)}
                  className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  aria-label="Decrementar 10 questões"
                >
                  <Minus size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex-1">
                  <input
                    type="number"
                    step="10"
                    min="10"
                    max="2000"
                    value={localGoals.weeklyQuestionsGoal}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const clamped = Math.max(10, Math.min(2000, value));
                      updateLocalGoal('weeklyQuestionsGoal', clamped);
                    }}
                    className="w-full text-center text-2xl font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">questões/semana</p>
                </div>
                <button
                  onClick={() => adjustValue('weeklyQuestionsGoal', 1)}
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Settings size={20} className="text-emerald-500" />
            Configurações Avançadas
          </h2>

          <div className="space-y-4">
            {/* Contar finais de semana */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-800 dark:text-white block">
                  Contar finais de semana na meta semanal
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {localGoals.settings.countWeekends 
                    ? 'Meta semanal divide por 7 (todos os dias)' 
                    : 'Meta semanal divide por 5 (seg-sex)'}
                </p>
              </div>
              <IOSSwitch
                checked={localGoals.settings.countWeekends}
                onChange={(checked) => updateLocalGoal('settings', { countWeekends: checked })}
                aria-label="Contar finais de semana na meta semanal"
              />
            </div>

            {/* Modo estrito */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-800 dark:text-white block">
                  Modo estrito (exigir 100% para sucesso)
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {localGoals.settings.strictMode 
                    ? 'Só verde com 100%+' 
                    : 'Sistema de níveis (50%/80%/100%)'}
                </p>
              </div>
              <IOSSwitch
                checked={localGoals.settings.strictMode}
                onChange={(checked) => updateLocalGoal('settings', { strictMode: checked })}
                aria-label="Modo estrito (exigir 100% para sucesso)"
              />
            </div>

            {/* Notificações */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-800 dark:text-white block">
                  Notificações de progresso diário
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Notifica fim do dia com % atingido
                </p>
              </div>
              <IOSSwitch
                checked={localGoals.settings.notifications}
                onChange={(checked) => updateLocalGoal('settings', { notifications: checked })}
                aria-label="Notificações de progresso diário"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="mt-6">
        <button
          onClick={handleSave}
          className="w-full md:w-auto md:px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-base transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Save size={20} />
          Salvar Alterações
        </button>
      </div>
    </div>
  );
}
