import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, Hourglass, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';
import Button from '../components/Button';
import { FADE_UP_ANIMATION, SCALE_ANIMATION, STAGGER_CONTAINER, STAGGER_ITEM } from '../utils/animations';

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
  
  // Estado para modal de confirmação de mudança de modo
  const [showModeChangeConfirm, setShowModeChangeConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<'cronometro' | 'temporizador' | 'pomodoro' | null>(null);
  
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
        // Não resetar selectedPreset para manter a seleção visual
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

  const handleModeChangeRequest = (newMode: 'cronometro' | 'temporizador' | 'pomodoro') => {
    if (isTimerRunning) {
      setPendingMode(newMode);
      setShowModeChangeConfirm(true);
    } else {
      setTimerMode(newMode);
    }
  };

  const handleConfirmModeChange = () => {
    if (pendingMode) {
      setIsTimerRunning(false);
      setTimerMode(pendingMode);
      if (pendingMode === 'cronometro' && mode === 'cronometro') {
        setTimerSeconds(0);
      }
      setPendingMode(null);
      setShowModeChangeConfirm(false);
    }
  };

  const handleCancelModeChange = () => {
    setPendingMode(null);
    setShowModeChangeConfirm(false);
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
  
  // Calcular progresso para a barra (0-100%)
  const getProgress = () => {
    if (mode === 'cronometro') {
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

  const getModeLabel = (modeOption: string) => {
    switch (modeOption) {
      case 'cronometro': return 'Cronômetro';
      case 'temporizador': return 'Temporizador';
      case 'pomodoro': return 'Pomodoro';
      default: return '';
    }
  };

  return (
    <motion.div
      {...FADE_UP_ANIMATION}
      className="flex flex-col min-h-screen overflow-y-auto pb-24 md:pb-8 px-4 md:px-6"
    >
      {/* Seletor de Modos (Abas) */}
      <div className="mb-6 mt-2 md:mt-4 pt-20 md:pt-4 relative z-10">
        {/* Mobile - Botões de Modo com Stagger Animation */}
        <div className="md:hidden flex flex-col gap-3 items-center">
          <motion.div 
            className="flex gap-3 justify-center w-full px-4"
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="show"
          >
            {(['cronometro', 'temporizador', 'pomodoro'] as const).map((modeOption) => {
              const Icon = modeOption === 'cronometro' ? Timer : modeOption === 'temporizador' ? Hourglass : Zap;
              return (
                <motion.div key={modeOption} variants={STAGGER_ITEM}>
                  <Button
                    onClick={() => handleModeChangeRequest(modeOption)}
                    variant={mode === modeOption ? 'primary' : 'secondary'}
                    size="sm"
                    className="flex flex-col items-center gap-1.5 px-3 py-2.5 flex-1"
                  >
                    <Icon size={18} />
                    <span>{getModeLabel(modeOption)}</span>
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Botões de Modo Desktop - Stagger Animation */}
        <motion.div 
          className="hidden md:flex gap-4 justify-center mb-8"
          variants={STAGGER_CONTAINER}
          initial="hidden"
          animate="show"
        >
          {(['cronometro', 'temporizador', 'pomodoro'] as const).map((modeOption) => {
            const Icon = modeOption === 'cronometro' ? Timer : modeOption === 'temporizador' ? Hourglass : Zap;
            return (
              <motion.div key={modeOption} variants={STAGGER_ITEM}>
                <Button
                  onClick={() => handleModeChangeRequest(modeOption)}
                  variant={mode === modeOption ? 'primary' : 'secondary'}
                  size="md"
                  leftIcon={<Icon size={22} />}
                  className="px-6 py-3"
                >
                  {getModeLabel(modeOption)}
                </Button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Título e Descrição - Transição entre Modos */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="text-center mb-4 md:mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
            {getModeTitle()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base transition-colors">
            {getModeDescription()}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* MOBILE: Layout vertical completo */}
      <div className="md:hidden">
        {/* Configuração de Temporizador - Mobile */}
        <AnimatePresence mode="wait">
          {mode === 'temporizador' && !isTimerRunning && timerSeconds === 0 && (
            <motion.div
              key="timer-config-mobile"
              {...SCALE_ANIMATION}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-6 max-w-md mx-auto w-full"
            >
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
                Defina o tempo inicial
              </p>
              <div className="flex gap-3 items-center justify-center">
                <div className="flex flex-col items-center">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-2">Horas</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
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
                    className="w-20 text-3xl font-bold text-center bg-gray-100 dark:bg-gray-700 rounded-xl p-2 text-gray-900 dark:text-white border-2 border-transparent focus:border-emerald-500 transition-colors placeholder:text-gray-400"
                  />
                </div>
                <span className="text-3xl font-bold text-gray-400 mt-6">:</span>
                <div className="flex flex-col items-center">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-2">Minutos</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
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
                    className="w-20 text-3xl font-bold text-center bg-gray-100 dark:bg-gray-700 rounded-xl p-2 text-gray-900 dark:text-white border-2 border-transparent focus:border-emerald-500 transition-colors placeholder:text-gray-400"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Presets de Pomodoro Mobile */}
        <AnimatePresence mode="wait">
          {mode === 'pomodoro' && !isTimerRunning && (
            <motion.div
              key="pomodoro-presets-mobile"
              {...FADE_UP_ANIMATION}
              className="flex gap-2 mb-4 justify-center flex-wrap max-w-md mx-auto w-full"
            >
              {POMODORO_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  onClick={() => handlePresetSelect(preset)}
                  variant="secondary"
                  size="sm"
                  className="px-2 py-1.5 flex flex-col items-center"
                  aria-label={`Selecionar preset Pomodoro: ${preset.label} (${preset.minutes} minutos)`}
                  title={`${preset.label} (${preset.minutes}min)`}
                >
                  {preset.label}
                  <br />
                  <span className="text-xs opacity-90">({preset.minutes}min)</span>
                </Button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Display do Tempo - Mobile */}
        <div className="flex-1 flex flex-col items-center justify-center mb-6">
          <div className="w-full max-w-xs mx-auto">
            {/* 🎬 PARTE 3: Barra de Progresso Mobile - Spring Animation */}
            {(mode === 'temporizador' || mode === 'pomodoro') && (
              <motion.div 
                className="w-full max-w-xs mx-auto mb-4"
                initial={{ opacity: 0, scaleX: 0.8 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ 
                      type: "spring",
                      stiffness: 50,
                      damping: 20
                    }}
                  >
                    {/* Shimmer effect (brilho passando) */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </motion.div>
                </div>
                {/* Porcentagem com counter animation */}
                <motion.p 
                  className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2"
                  key={Math.floor(progress)} // Re-anima a cada 1%
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {progress.toFixed(0)}% concluído
                </motion.p>
              </motion.div>
            )}
            
            {/* Display Digital Mobile */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`display-mobile-${mode}`}
                {...SCALE_ANIMATION}
                animate={{ 
                  ...SCALE_ANIMATION.animate,
                  boxShadow: isTimerRunning ? [
                    "0 10px 40px rgba(16, 185, 129, 0.1)",
                    "0 10px 40px rgba(16, 185, 129, 0.25)",
                    "0 10px 40px rgba(16, 185, 129, 0.1)"
                  ] : "0 10px 40px rgba(0, 0, 0, 0.1)"
                }}
                transition={{ 
                  ...SCALE_ANIMATION.transition,
                  boxShadow: { duration: 2, repeat: isTimerRunning ? Infinity : 0, ease: "easeInOut" }
                }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-4 w-full max-w-xs mx-auto relative overflow-hidden"
              >
                {/* Glow ring sutil quando ativo */}
                {isTimerRunning && (
                  <motion.div
                    className="absolute inset-0 border-2 border-emerald-500/30 rounded-3xl pointer-events-none"
                    animate={{ 
                      scale: [1, 1.01, 1],
                      opacity: [0.3, 0.6, 0.3] 
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                {/* Display estático (sem animação individual) */}
                <div className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight text-center font-mono relative z-10 timer-display">
                  {display}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* 🔧 CORREÇÃO 1: Botões de Controle Mobile - Animações completas */}
        <motion.div 
          className="flex gap-4 w-full max-w-md mx-auto mb-8"
          layout // Anima quando muda de Play pra Pause
        >
          {isTimerRunning ? (
            <>
              {/* Botão Pause Mobile */}
              <Button
                onClick={handlePlayPause}
                variant="primary"
                fullWidth
                size="lg"
                leftIcon={<Pause className="w-6 h-6" />}
                className="flex-1 bg-amber-500 hover:bg-amber-600 shadow-lg"
                aria-label="Pausar timer"
              >
                Pause
              </Button>
              
              {/* Botão Reset Mobile */}
              {timerSeconds > 0 && (
                <Button
                  onClick={handleReset}
                  variant="secondary"
                  size="lg"
                  className="px-6 py-6 shadow-lg"
                  aria-label="Resetar timer"
                  title="Resetar timer"
                >
                  <RotateCcw className="w-6 h-6" />
                </Button>
              )}
            </>
          ) : (
            /* Botão Play Mobile */
            <Button
              onClick={handlePlayPause}
              disabled={(mode === 'temporizador' && (timerHours === '' || timerHours === '0') && (timerMinutes === '' || timerMinutes === '0') && timerSeconds === 0) || (mode === 'pomodoro' && !selectedPreset)}
              variant="primary"
              fullWidth
              size="lg"
              leftIcon={<Play className="w-6 h-6" />}
              className="flex-1 shadow-lg"
              aria-label="Iniciar timer"
            >
              Play
            </Button>
          )}
        </motion.div>

        {/* Botão Parar e Registrar - Mobile */}
        <AnimatePresence mode="wait">
          {(mode === 'cronometro' && timerSeconds > 0 && !isTimerRunning) && (
            <Button
              key="stop-cronometro-mobile"
              onClick={handleStop}
              variant="danger"
              fullWidth
              size="lg"
              className="w-full max-w-md mx-auto py-5 mb-8 shadow-lg"
            >
              Parar e Registrar
            </Button>
          )}

          {(mode === 'temporizador' && initialTimerSeconds > 0 && !isTimerRunning) && (
            <Button
              key="stop-temporizador-mobile"
              onClick={handleStop}
              variant="danger"
              fullWidth
              size="lg"
              className="w-full max-w-md mx-auto py-5 mb-8 shadow-lg"
            >
              Parar e Registrar
            </Button>
          )}

          {(mode === 'pomodoro' && pomodoroStarted && pomodoroInitialSeconds > 0 && !isTimerRunning && selectedPreset?.label === 'Foco') && (
            <Button
              key="stop-pomodoro-mobile"
              onClick={handleStop}
              variant="danger"
              fullWidth
              size="lg"
              className="w-full max-w-md mx-auto py-5 mb-8 shadow-lg"
            >
              Parar e Registrar
            </Button>
          )}
        </AnimatePresence>
      </div>

      {/* DESKTOP: Layout Grid 5 Colunas (60/40) */}
      <div className="hidden md:grid md:grid-cols-5 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
        {/* COLUNA ESQUERDA: Timer + Controles */}
        <div className="col-span-3 flex flex-col items-center justify-center space-y-6">
          {/* 🎬 PARTE 3: Barra de Progresso Desktop - Spring + Shimmer */}
          {(mode === 'temporizador' || mode === 'pomodoro') && (
            <motion.div 
              className="w-full max-w-md"
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ 
                    type: "spring",
                    stiffness: 50,
                    damping: 20
                  }}
                >
                  {/* Shimmer effect (brilho passando) */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </motion.div>
              </div>
              {/* Porcentagem com counter animation */}
              <motion.p 
                className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2"
                key={Math.floor(progress)} // Re-anima a cada 1%
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {progress.toFixed(0)}% concluído
              </motion.p>
            </motion.div>
          )}

          {/* Display do Tempo Desktop */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`display-desktop-${mode}`}
              {...SCALE_ANIMATION}
              animate={{ 
                ...SCALE_ANIMATION.animate,
                boxShadow: isTimerRunning ? [
                  "0 10px 40px rgba(16, 185, 129, 0.1)",
                  "0 10px 40px rgba(16, 185, 129, 0.25)",
                  "0 10px 40px rgba(16, 185, 129, 0.1)"
                ] : "0 10px 40px rgba(0, 0, 0, 0.1)"
              }}
              transition={{ 
                ...SCALE_ANIMATION.transition,
                boxShadow: { duration: 2, repeat: isTimerRunning ? Infinity : 0, ease: "easeInOut" }
              }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 lg:p-12 w-full max-w-lg relative overflow-hidden"
            >
              {/* 🔧 CORREÇÃO 2: Glow ring sutil quando ativo (reduzido de border-4 para border-2) */}
              {isTimerRunning && (
                <motion.div
                  className="absolute inset-0 border-2 border-emerald-500/30 rounded-3xl pointer-events-none"
                  animate={{ 
                    scale: [1, 1.01, 1],
                    opacity: [0.3, 0.6, 0.3] 
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              
              {/* 🔧 CORREÇÃO 2: Display estático (sem animação individual - remove pisca-pisca) */}
              <div className="text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white tracking-tight text-center font-mono relative z-10">
                {display}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* 🎬 PARTE 5: Botões de Controle Desktop - Feedback Tátil */}
          <motion.div 
            className="flex items-center gap-4"
            layout // Anima quando muda de Play pra Pause
          >
            {isTimerRunning ? (
              <>
                {/* Botão Pause */}
                <Button
                  onClick={handlePlayPause}
                  variant="primary"
                  size="lg"
                  className="bg-amber-500 hover:bg-amber-600 p-6 rounded-full shadow-lg"
                  aria-label="Pausar timer"
                >
                  <Pause size={32} />
                </Button>
                
                {/* Botão Reset */}
                {timerSeconds > 0 && (
                  <Button
                    onClick={handleReset}
                    variant="danger"
                    size="lg"
                    className="p-6 rounded-full shadow-lg"
                    aria-label="Resetar timer"
                  >
                    <RotateCcw size={32} />
                  </Button>
                )}
              </>
            ) : (
              /* Botão Play */
              <Button
                onClick={handlePlayPause}
                disabled={(mode === 'temporizador' && (timerHours === '' || timerHours === '0') && (timerMinutes === '' || timerMinutes === '0') && timerSeconds === 0) || (mode === 'pomodoro' && !selectedPreset)}
                variant="primary"
                size="lg"
                leftIcon={<Play size={28} />}
                className="px-10 py-5 shadow-lg text-lg"
                aria-label="Iniciar timer"
              >
                Iniciar
              </Button>
            )}
          </motion.div>

          {/* Botão Parar e Registrar - Desktop */}
          <AnimatePresence mode="wait">
            {(mode === 'cronometro' && timerSeconds > 0 && !isTimerRunning) && (
              <Button
                key="stop-cronometro-desktop"
                onClick={handleStop}
                variant="danger"
                fullWidth
                size="lg"
                className="w-full max-w-sm py-5 shadow-lg text-base"
              >
                Parar e Registrar
              </Button>
            )}

            {(mode === 'temporizador' && initialTimerSeconds > 0 && !isTimerRunning) && (
              <Button
                key="stop-temporizador-desktop"
                onClick={handleStop}
                variant="danger"
                fullWidth
                size="lg"
                className="w-full max-w-sm py-5 shadow-lg text-base"
              >
                Parar e Registrar
              </Button>
            )}

            {(mode === 'pomodoro' && pomodoroStarted && pomodoroInitialSeconds > 0 && !isTimerRunning && selectedPreset?.label === 'Foco') && (
              <Button
                key="stop-pomodoro-desktop"
                onClick={handleStop}
                variant="danger"
                fullWidth
                size="lg"
                className="w-full max-w-sm py-5 shadow-lg text-base"
              >
                Parar e Registrar
              </Button>
            )}
          </AnimatePresence>
        </div>

        {/* COLUNA DIREITA: Info + Presets + Stats */}
        <div className="col-span-2 flex flex-col space-y-4">
          {/* Card de Informação do Modo */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`info-desktop-${mode}`}
              {...FADE_UP_ANIMATION}
              transition={{ ...FADE_UP_ANIMATION.transition, delay: 0.1 }}
              whileHover={{ 
                y: -5,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
              }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                >
                  {mode === 'cronometro' && <Timer className="text-emerald-500" size={24} />}
                  {mode === 'temporizador' && <Hourglass className="text-emerald-500" size={24} />}
                  {mode === 'pomodoro' && <Zap className="text-emerald-500" size={24} />}
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {getModeTitle()}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
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

          {/* Presets do Pomodoro Desktop */}
          <AnimatePresence mode="wait">
            {mode === 'pomodoro' && !isTimerRunning && (
              <motion.div
                key="pomodoro-presets-desktop"
                {...FADE_UP_ANIMATION}
                transition={{ ...FADE_UP_ANIMATION.transition, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4"
              >
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                  Presets Rápidos
                </h4>
                
                <motion.div 
                  className="grid grid-cols-3 gap-3"
                  variants={STAGGER_CONTAINER}
                  initial="hidden"
                  animate="show"
                >
                  {POMODORO_PRESETS.map((preset) => (
                    <motion.button
                      key={preset.minutes}
                      variants={STAGGER_ITEM}
                      whileHover={{ 
                        scale: 1.05,
                        backgroundColor: "rgb(16, 185, 129)", // emerald-500
                        color: "white",
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePresetSelect(preset)}
                      className="px-4 py-3 rounded-xl text-sm font-semibold transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {preset.label}
                      <br />
                      <span className="text-xs opacity-80">({preset.minutes}min)</span>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input de Tempo Desktop */}
          <AnimatePresence mode="wait">
            {mode === 'temporizador' && !isTimerRunning && timerSeconds === 0 && (
              <motion.div
                key="timer-config-desktop"
                {...FADE_UP_ANIMATION}
                transition={{ ...FADE_UP_ANIMATION.transition, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4"
              >
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                  Defina o tempo inicial
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Horas', value: timerHours, setter: setTimerHours, max: 23 },
                    { label: 'Minutos', value: timerMinutes, setter: setTimerMinutes, max: 59 }
                  ].map((field) => (
                    <motion.div key={field.label}>
                      <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                        {field.label}
                      </label>
                      <motion.input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        max={field.max}
                        value={field.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d{1,2}$/.test(val)) {
                            const num = val === '' ? '' : Math.max(0, Math.min(field.max, parseInt(val) || 0)).toString();
                            field.setter(num);
                          }
                        }}
                        whileFocus={{ 
                          scale: 1.05,
                          boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.1)"
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="w-full bg-gray-100 dark:bg-gray-700 text-center text-3xl font-bold p-3 rounded-xl text-gray-900 dark:text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 timer-display"
                        placeholder="0"
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card de Dica/Info Adicional */}
          <motion.div
            {...FADE_UP_ANIMATION}
            whileHover={{ y: -2 }}
            className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-2xl p-4 border border-emerald-500/20"
          >
            <div className="flex items-start gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Info className="text-emerald-500 flex-shrink-0 mt-1" size={20} />
              </motion.div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  <Info size={16} className="text-emerald-500" />
                  Dica
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {mode === 'cronometro' && 'Use o cronômetro para sessões de estudo sem limite de tempo.'}
                  {mode === 'temporizador' && 'Defina um tempo e mantenha o foco até o alarme tocar.'}
                  {mode === 'pomodoro' && 'A técnica Pomodoro alterna períodos de foco intenso com pausas curtas.'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de Confirmação de Mudança de Modo */}
      <ConfirmModal
        isOpen={showModeChangeConfirm}
        title="Mudar de Modo?"
        message="O timer está rodando. Deseja realmente mudar de modo?"
        confirmText="Sim, mudar"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={handleConfirmModeChange}
        onCancel={handleCancelModeChange}
      />
    </motion.div>
  );
}
