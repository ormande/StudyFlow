import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, Hourglass, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimerPageProps {
  onTimerStop: (hours: number, minutes: number, seconds: number) => void;
  timerSeconds: number;
  setTimerSeconds: (seconds: number) => void;
  isTimerRunning: boolean;
  setIsTimerRunning: (running: boolean) => void;
  timerMode: 'cronometro' | 'temporizador' | 'pomodoro';
  setTimerMode: (mode: 'cronometro' | 'temporizador' | 'pomodoro') => void;
}

type PomodoroPreset = {
  label: string;
  minutes: number;
};

const POMODORO_PRESETS: PomodoroPreset[] = [
  { label: 'Foco', minutes: 25 },
  { label: 'Pausa Curta', minutes: 5 },
  { label: 'Pausa Longa', minutes: 15 },
];

export default function TimerPage({
  onTimerStop,
  timerSeconds,
  setTimerSeconds,
  isTimerRunning,
  setIsTimerRunning,
  timerMode,
  setTimerMode
}: TimerPageProps) {
  const mode = timerMode;
  
  // Estados para Temporizador
  const [timerHours, setTimerHours] = useState('');
  const [timerMinutes, setTimerMinutes] = useState('');
  const [initialTimerSeconds, setInitialTimerSeconds] = useState(0);
  
  // Estados para Pomodoro
  const [selectedPreset, setSelectedPreset] = useState<PomodoroPreset | null>(null);
  const [pomodoroInitialSeconds, setPomodoroInitialSeconds] = useState(0);
  const [pomodoroStarted, setPomodoroStarted] = useState(false);
  
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return {
      display: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      hours,
      minutes,
      seconds: secs,
    };
  };

  // Resetar estados ao mudar de modo (reiniciar timer quando troca de aba dentro do timer)
  useEffect(() => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    
    if (mode === 'cronometro') {
      setTimerHours('');
      setTimerMinutes('');
      setInitialTimerSeconds(0);
      setSelectedPreset(null);
      setPomodoroInitialSeconds(0);
    } else if (mode === 'temporizador') {
      setSelectedPreset(null);
      setPomodoroInitialSeconds(0);
    } else if (mode === 'pomodoro') {
      setTimerHours('');
      setTimerMinutes('');
      setInitialTimerSeconds(0);
      setPomodoroStarted(false);
    }
  }, [mode, setIsTimerRunning, setTimerSeconds]);

  const handlePlayPause = () => {
    if (mode === 'temporizador') {
      if (timerSeconds === 0 && initialTimerSeconds === 0) {
        // Configurar tempo inicial
        const hours = parseInt(timerHours) || 0;
        const minutes = parseInt(timerMinutes) || 0;
        const total = hours * 3600 + minutes * 60;
        if (total === 0) return;
        setInitialTimerSeconds(total);
        setTimerSeconds(total);
      }
    } else if (mode === 'pomodoro') {
      if (!selectedPreset) return;
      if (!pomodoroStarted) {
        // Primeira vez iniciando - configurar tempo inicial
        const total = selectedPreset.minutes * 60;
        setPomodoroInitialSeconds(total);
        setTimerSeconds(total);
        setPomodoroStarted(true);
      }
      // Se já foi iniciado, apenas pausa/retoma sem resetar o tempo
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const handleStop = () => {
    if (mode === 'cronometro') {
      if (timerSeconds > 0) {
        const { hours, minutes, seconds } = formatTime(timerSeconds);
        setIsTimerRunning(false);
        setTimerSeconds(0);
        onTimerStop(hours, minutes, seconds);
      }
    } else if (mode === 'temporizador') {
      if (initialTimerSeconds > 0) {
        // Registrar o tempo decorrido (inicial - atual)
        const elapsedSeconds = initialTimerSeconds - timerSeconds;
        const { hours, minutes, seconds } = formatTime(elapsedSeconds);
        setIsTimerRunning(false);
        setTimerSeconds(0);
        setInitialTimerSeconds(0);
        onTimerStop(hours, minutes, seconds);
      }
    } else if (mode === 'pomodoro') {
      if (pomodoroInitialSeconds > 0 && selectedPreset) {
        // Registrar o tempo decorrido (inicial - atual)
        const elapsedSeconds = pomodoroInitialSeconds - timerSeconds;
        const { hours, minutes, seconds } = formatTime(elapsedSeconds);
        setIsTimerRunning(false);
        setTimerSeconds(0);
        setPomodoroInitialSeconds(0);
        setPomodoroStarted(false);
        setSelectedPreset(null);
        onTimerStop(hours, minutes, seconds);
      }
    }
  };

  const handleReset = () => {
    setIsTimerRunning(false);
    if (mode === 'cronometro') {
      setTimerSeconds(0);
    } else if (mode === 'temporizador') {
      setTimerSeconds(0);
      setInitialTimerSeconds(0);
    } else if (mode === 'pomodoro') {
      setTimerSeconds(0);
      setPomodoroInitialSeconds(0);
      setPomodoroStarted(false);
      // Não resetar selectedPreset para manter a seleção
    }
  };

  const handlePresetSelect = (preset: PomodoroPreset) => {
    if (isTimerRunning) return;
    setSelectedPreset(preset);
    const total = preset.minutes * 60;
    setTimerSeconds(total);
    // Resetar estados ao selecionar novo preset
    setPomodoroInitialSeconds(0);
    setPomodoroStarted(false);
  };

  const { display } = formatTime(timerSeconds);
  
  // Calcular progresso para o anel (0-100%)
  const getProgress = () => {
    if (mode === 'cronometro') {
      // Para cronômetro, não mostramos progresso (ou podemos usar um máximo arbitrário)
      return 0;
    } else if (mode === 'temporizador') {
      if (initialTimerSeconds === 0) return 0;
      return ((initialTimerSeconds - timerSeconds) / initialTimerSeconds) * 100;
    } else if (mode === 'pomodoro') {
      if (pomodoroInitialSeconds === 0) return 0;
      return ((pomodoroInitialSeconds - timerSeconds) / pomodoroInitialSeconds) * 100;
    }
    return 0;
  };

  const progress = getProgress();
  const radius = 100; // Reduzido para mobile
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getModeTitle = () => {
    switch (mode) {
      case 'cronometro': return 'Cronômetro';
      case 'temporizador': return 'Temporizador';
      case 'pomodoro': return 'Pomodoro';
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'cronometro': return 'Acompanhe seu tempo de estudo';
      case 'temporizador': return 'Defina um tempo e foque';
      case 'pomodoro': return 'Técnica de produtividade';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden px-4 md:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Seletor de Modos (Abas) - Layout Mobile (ícones acima) e Desktop (horizontal) */}
      <div className="mb-6 mt-4 md:mt-4 pt-16 md:pt-4">
        {/* Mobile: Layout vertical com ícones acima */}
        <div className="md:hidden flex flex-col gap-3 items-center">
          <div className="flex gap-3 justify-center w-full px-4">
            <motion.button
              onClick={() => {
                if (isTimerRunning) {
                  if (confirm('O timer está rodando. Deseja realmente mudar de modo?')) {
                    setIsTimerRunning(false);
                    setTimerMode('cronometro');
                    if (mode === 'cronometro') {
                      setTimerSeconds(0);
                    }
                  }
                } else {
                  setTimerMode('cronometro');
                }
              }}
              className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-xs transition-all flex-1 ${
                mode === 'cronometro'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Timer size={20} />
              <span>Cronômetro</span>
            </motion.button>
            <motion.button
              onClick={() => {
                if (isTimerRunning) {
                  if (confirm('O timer está rodando. Deseja realmente mudar de modo?')) {
                    setIsTimerRunning(false);
                    setTimerMode('temporizador');
                  }
                } else {
                  setTimerMode('temporizador');
                }
              }}
              className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-xs transition-all flex-1 ${
                mode === 'temporizador'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Hourglass size={20} />
              <span>Temporizador</span>
            </motion.button>
            <motion.button
              onClick={() => {
                if (isTimerRunning) {
                  if (confirm('O timer está rodando. Deseja realmente mudar de modo?')) {
                    setIsTimerRunning(false);
                    setTimerMode('pomodoro');
                  }
                } else {
                  setTimerMode('pomodoro');
                }
              }}
              className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-xs transition-all flex-1 ${
                mode === 'pomodoro'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Zap size={20} />
              <span>Pomodoro</span>
            </motion.button>
          </div>
        </div>

        {/* Desktop: Layout horizontal tradicional */}
        <div className="hidden md:flex gap-2 justify-center">
          <motion.button
            onClick={() => {
              if (isTimerRunning) {
                if (confirm('O timer está rodando. Deseja realmente mudar de modo?')) {
                  setIsTimerRunning(false);
                  setTimerMode('cronometro');
                  if (mode === 'cronometro') {
                    setTimerSeconds(0);
                  }
                }
              } else {
                setTimerMode('cronometro');
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              mode === 'cronometro'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Timer size={18} />
            Cronômetro
          </motion.button>
          <motion.button
            onClick={() => {
              if (isTimerRunning) {
                if (confirm('O timer está rodando. Deseja realmente mudar de modo?')) {
                  setIsTimerRunning(false);
                  setTimerMode('temporizador');
                }
              } else {
                setTimerMode('temporizador');
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              mode === 'temporizador'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Hourglass size={18} />
            Temporizador
          </motion.button>
          <motion.button
            onClick={() => {
              if (isTimerRunning) {
                if (confirm('O timer está rodando. Deseja realmente mudar de modo?')) {
                  setIsTimerRunning(false);
                  setTimerMode('pomodoro');
                }
              } else {
                setTimerMode('pomodoro');
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              mode === 'pomodoro'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Zap size={18} />
            Pomodoro
          </motion.button>
        </div>
      </div>

      {/* Título e Descrição - Animado */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 transition-colors">
            {getModeTitle()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">
            {getModeDescription()}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Configuração de Temporizador - Animado */}
      <AnimatePresence mode="wait">
        {mode === 'temporizador' && !isTimerRunning && timerSeconds === 0 && (
          <motion.div
            key="timer-config"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 max-w-md mx-auto w-full"
          >
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
            Defina o tempo inicial
          </p>
          <div className="flex gap-4 items-center justify-center">
            <div className="flex flex-col items-center">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-2">Horas</label>
              <input
                type="number"
                min="0"
                max="23"
                maxLength={2}
                value={timerHours}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d{1,2}$/.test(val)) {
                    const num = val === '' ? '' : Math.max(0, Math.min(23, parseInt(val) || 0)).toString();
                    setTimerHours(num);
                  }
                }}
                placeholder="0"
                className="w-20 text-3xl font-bold text-center bg-gray-100 dark:bg-gray-700 rounded-xl py-3 text-gray-800 dark:text-white border-2 border-transparent focus:border-emerald-500 transition-colors placeholder:text-gray-400"
              />
            </div>
            <span className="text-3xl font-bold text-gray-400 mt-6">:</span>
            <div className="flex flex-col items-center">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-2">Minutos</label>
              <input
                type="number"
                min="0"
                max="59"
                maxLength={2}
                value={timerMinutes}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d{1,2}$/.test(val)) {
                    const num = val === '' ? '' : Math.max(0, Math.min(59, parseInt(val) || 0)).toString();
                    setTimerMinutes(num);
                  }
                }}
                placeholder="0"
                className="w-20 text-3xl font-bold text-center bg-gray-100 dark:bg-gray-700 rounded-xl py-3 text-gray-800 dark:text-white border-2 border-transparent focus:border-emerald-500 transition-colors placeholder:text-gray-400"
              />
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Presets de Pomodoro - Animado */}
      <AnimatePresence mode="wait">
        {mode === 'pomodoro' && !isTimerRunning && (
          <motion.div
            key="pomodoro-presets"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-3 mb-6 justify-center flex-wrap max-w-md mx-auto w-full"
          >
          {POMODORO_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetSelect(preset)}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                selectedPreset?.label === preset.label
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {preset.label}
              <br />
              <span className="text-xs opacity-90">({preset.minutes}min)</span>
            </button>
          ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Display do Tempo com Anel de Progresso - Layout Desktop/Mobile */}
      <div className="flex-1 flex items-center justify-center mb-6 md:mb-0">
        <div className="w-full max-w-md md:max-w-6xl mx-auto md:grid md:grid-cols-2 md:gap-8 md:items-center">
          {/* Coluna Esquerda - Display do Tempo */}
          <div className="relative flex items-center justify-center w-full">
          {/* Anel de Progresso SVG (apenas para Temporizador e Pomodoro) - Tamanho reduzido no mobile */}
          {(mode === 'temporizador' || mode === 'pomodoro') && (
              <svg 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90" 
                width="240"
                height="240"
                style={{ pointerEvents: 'none' }}
              >
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-emerald-500 transition-all duration-1000 ease-linear"
                />
              </svg>
            )}
            
            {/* Display Digital - Padding reduzido no mobile */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`display-${mode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 md:p-12 w-full transition-colors duration-300 relative z-10"
              >
                <div className="text-5xl md:text-7xl font-bold text-gray-800 dark:text-white tracking-tight text-center font-mono transition-colors">
                  {display}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Coluna Direita - Informações Adicionais (Desktop) */}
          <div className="hidden md:flex md:flex-col md:gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`info-${mode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                  {getModeTitle()}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {getModeDescription()}
                </p>
                {mode === 'temporizador' && initialTimerSeconds > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tempo inicial:</p>
                    <p className="text-xl font-bold text-emerald-500">
                      {formatTime(initialTimerSeconds).display}
                    </p>
                  </div>
                )}
                {mode === 'pomodoro' && pomodoroInitialSeconds > 0 && selectedPreset && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sessão:</p>
                    <p className="text-xl font-bold text-emerald-500">
                      {selectedPreset.label} ({selectedPreset.minutes}min)
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Botões de Controle - Layout Desktop/Mobile */}
      <div className="flex gap-4 w-full max-w-md md:max-w-2xl mx-auto mb-4 md:mb-6">
        <button
          onClick={handlePlayPause}
          disabled={(mode === 'temporizador' && (timerHours === '' || timerHours === '0') && (timerMinutes === '' || timerMinutes === '0') && timerSeconds === 0) || (mode === 'pomodoro' && !selectedPreset)}
          className={`flex-1 py-6 rounded-2xl font-semibold text-lg text-white shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
            isTimerRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {isTimerRunning ? (
            <>
              <Pause className="w-6 h-6" /> <span className="hidden md:inline">Pausar</span> <span className="md:hidden">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-6 h-6" /> <span className="hidden md:inline">Iniciar</span> <span className="md:hidden">Play</span>
            </>
          )}
        </button>

        <AnimatePresence>
          {timerSeconds > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleReset}
              className="px-6 py-6 rounded-2xl font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-lg transition-all"
            >
              <RotateCcw className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Botão de Parar e Registrar - Animado */}
      <AnimatePresence mode="wait">
        {(mode === 'cronometro' && timerSeconds > 0 && !isTimerRunning) && (
          <motion.button
            key="stop-cronometro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleStop}
            className="w-full max-w-md md:max-w-2xl mx-auto py-5 rounded-2xl font-semibold text-lg text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all"
          >
            Parar e Registrar
          </motion.button>
        )}

        {(mode === 'temporizador' && initialTimerSeconds > 0 && !isTimerRunning) && (
          <motion.button
            key="stop-temporizador"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleStop}
            className="w-full max-w-md md:max-w-2xl mx-auto py-5 rounded-2xl font-semibold text-lg text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all"
          >
            Parar e Registrar
          </motion.button>
        )}

        {(mode === 'pomodoro' && pomodoroStarted && pomodoroInitialSeconds > 0 && !isTimerRunning) && (
          <motion.button
            key="stop-pomodoro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleStop}
            className="w-full max-w-md md:max-w-2xl mx-auto py-5 rounded-2xl font-semibold text-lg text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all"
          >
            Parar e Registrar
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
