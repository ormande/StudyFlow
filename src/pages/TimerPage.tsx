import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, Hourglass, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';

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

  // 🎬 PARTE 1: ENTRADA DA PÁGINA - Container Principal com animação suave
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.25, 0.1, 0.25, 1] // Custom bezier (suave)
      }}
      className="flex flex-col min-h-screen overflow-y-auto pb-24 md:pb-8 px-4 md:px-6"
    >
      {/* Seletor de Modos (Abas) */}
      <div className="mb-6 mt-2 md:mt-4 pt-20 md:pt-4 relative z-10">
        {/* 🔧 CORREÇÃO 1: Mobile - Botões de Modo com Stagger Animation */}
        <div className="md:hidden flex flex-col gap-3 items-center">
          <motion.div 
            className="flex gap-3 justify-center w-full px-4"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            initial="hidden"
            animate="show"
          >
            {(['cronometro', 'temporizador', 'pomodoro'] as const).map((modeOption) => {
              const Icon = modeOption === 'cronometro' ? Timer : modeOption === 'temporizador' ? Hourglass : Zap;
              return (
                <motion.button
                  key={modeOption}
                  onClick={() => handleModeChangeRequest(modeOption)}
                  variants={{
                    hidden: { opacity: 0, y: -20, scale: 0.9 },
                    show: { opacity: 1, y: 0, scale: 1 }
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { type: "spring", stiffness: 400, damping: 10 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all flex-1 ${
                    mode === modeOption
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {/* Ícone com rotação suave no hover */}
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  >
                    <Icon size={18} />
                  </motion.div>
                  <span>{getModeLabel(modeOption)}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* 🎬 PARTE 2: Botões de Modo Desktop - Stagger Animation */}
        <motion.div 
          className="hidden md:flex gap-4 justify-center mb-8"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1 // Cada botão aparece 0.1s depois do anterior
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {(['cronometro', 'temporizador', 'pomodoro'] as const).map((modeOption) => {
            const Icon = modeOption === 'cronometro' ? Timer : modeOption === 'temporizador' ? Hourglass : Zap;
            return (
              <motion.button
                key={modeOption}
                onClick={() => handleModeChangeRequest(modeOption)}
                variants={{
                  hidden: { opacity: 0, y: -20, scale: 0.9 },
                  show: { opacity: 1, y: 0, scale: 1 }
                }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-base transition-all ${
                  mode === modeOption
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {/* Ícone com rotação suave no hover */}
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <Icon size={22} />
                </motion.div>
                <span>{getModeLabel(modeOption)}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* 🎬 Título e Descrição - Transição entre Modos */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-center mb-4 md:mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2 transition-colors">
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
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
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
                    className="w-20 text-3xl font-bold text-center bg-gray-100 dark:bg-gray-700 rounded-xl p-2 text-gray-800 dark:text-white border-2 border-transparent focus:border-emerald-500 transition-colors placeholder:text-gray-400"
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
                    className="w-20 text-3xl font-bold text-center bg-gray-100 dark:bg-gray-700 rounded-xl p-2 text-gray-800 dark:text-white border-2 border-transparent focus:border-emerald-500 transition-colors placeholder:text-gray-400"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔧 CORREÇÃO 1: Presets de Pomodoro Mobile - Stagger Animation */}
        <AnimatePresence mode="wait">
          {mode === 'pomodoro' && !isTimerRunning && (
            <motion.div
              key="pomodoro-presets-mobile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex gap-2 mb-4 justify-center flex-wrap max-w-md mx-auto w-full"
            >
              {POMODORO_PRESETS.map((preset, index) => (
                <motion.button
                  key={preset.label}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: selectedPreset?.label === preset.label ? undefined : "rgb(16, 185, 129)",
                    color: selectedPreset?.label === preset.label ? undefined : "white",
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-2 py-1.5 rounded-xl font-semibold text-xs transition-all ${
                    selectedPreset?.label === preset.label
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  aria-label={`Selecionar preset Pomodoro: ${preset.label} (${preset.minutes} minutos)`}
                  title={`${preset.label} (${preset.minutes}min)`}
                >
                  {preset.label}
                  <br />
                  <span className="text-xs opacity-90">({preset.minutes}min)</span>
                </motion.button>
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
            
            {/* 🔧 CORREÇÃO 2: Display Digital Mobile - Texto estático + pulso sutil */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`display-mobile-${mode}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  boxShadow: isTimerRunning ? [
                    "0 10px 40px rgba(16, 185, 129, 0.1)",
                    "0 10px 40px rgba(16, 185, 129, 0.25)",
                    "0 10px 40px rgba(16, 185, 129, 0.1)"
                  ] : "0 10px 40px rgba(0, 0, 0, 0.1)"
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ 
                  duration: 0.4, 
                  ease: "easeInOut",
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
                <div className="text-4xl font-bold text-gray-800 dark:text-white tracking-tight text-center font-mono relative z-10">
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
              <motion.button
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: "0 10px 30px rgba(245, 158, 11, 0.3)"
                }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={handlePlayPause}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-2xl shadow-lg relative overflow-hidden flex items-center justify-center gap-2"
                aria-label="Pausar timer"
              >
                {/* Ripple effect no clique */}
                <motion.div
                  className="absolute inset-0 bg-white/30 rounded-2xl"
                  initial={{ scale: 0, opacity: 1 }}
                  whileTap={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
                <Pause className="w-6 h-6 relative z-10" />
                <span className="relative z-10">Pause</span>
              </motion.button>
              
              {/* Botão Reset Mobile */}
              {timerSeconds > 0 && (
                <motion.button
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: -15,
                    boxShadow: "0 10px 30px rgba(239, 68, 68, 0.3)"
                  }}
                  whileTap={{ scale: 0.9, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={handleReset}
                  className="px-6 py-6 rounded-2xl font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-lg relative"
                  aria-label="Resetar timer"
                  title="Resetar timer"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <RotateCcw className="w-6 h-6" />
                  </motion.div>
                </motion.button>
              )}
            </>
          ) : (
            /* Botão Play Mobile */
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 15px 40px rgba(16, 185, 129, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={handlePlayPause}
              disabled={(mode === 'temporizador' && (timerHours === '' || timerHours === '0') && (timerMinutes === '' || timerMinutes === '0') && timerSeconds === 0) || (mode === 'pomodoro' && !selectedPreset)}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl shadow-lg text-base font-semibold relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              aria-label="Iniciar timer"
            >
              {/* Gradient shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div 
                className="flex items-center gap-2 relative z-10"
                whileHover={{ x: 5 }}
              >
                <Play className="w-6 h-6" />
                <span>Play</span>
              </motion.div>
            </motion.button>
          )}
        </motion.div>

        {/* Botão Parar e Registrar - Mobile */}
        <AnimatePresence mode="wait">
          {(mode === 'cronometro' && timerSeconds > 0 && !isTimerRunning) && (
            <motion.button
              key="stop-cronometro-mobile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={handleStop}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full max-w-md mx-auto py-5 mb-8 rounded-2xl font-semibold text-base text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all"
            >
              Parar e Registrar
            </motion.button>
          )}

          {(mode === 'temporizador' && initialTimerSeconds > 0 && !isTimerRunning) && (
            <motion.button
              key="stop-temporizador-mobile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={handleStop}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full max-w-md mx-auto py-5 mb-8 rounded-2xl font-semibold text-base text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all"
            >
              Parar e Registrar
            </motion.button>
          )}

          {(mode === 'pomodoro' && pomodoroStarted && pomodoroInitialSeconds > 0 && !isTimerRunning && selectedPreset?.label === 'Foco') && (
            <motion.button
              key="stop-pomodoro-mobile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={handleStop}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full max-w-md mx-auto py-5 mb-8 rounded-2xl font-semibold text-base text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all"
            >
              Parar e Registrar
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* DESKTOP: Layout Grid 2 Colunas (50/50) */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-8 lg:gap-12 max-w-7xl mx-auto">
        {/* COLUNA ESQUERDA: Timer + Controles */}
        <div className="flex flex-col items-center justify-center space-y-6">
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

          {/* 🎬 PARTE 4: Display do Tempo Desktop - Pulso quando rodando */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`display-desktop-${mode}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                boxShadow: isTimerRunning ? [
                  "0 10px 40px rgba(16, 185, 129, 0.1)",
                  "0 10px 40px rgba(16, 185, 129, 0.25)",
                  "0 10px 40px rgba(16, 185, 129, 0.1)"
                ] : "0 10px 40px rgba(0, 0, 0, 0.1)"
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                duration: 0.4, 
                ease: "easeInOut",
                boxShadow: { duration: 2, repeat: isTimerRunning ? Infinity : 0, ease: "easeInOut" }
              }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-16 w-full max-w-xl relative overflow-hidden"
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
              <div className="text-8xl font-bold text-gray-800 dark:text-white tracking-tight text-center font-mono relative z-10">
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
                <motion.button
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  whileHover={{ 
                    scale: 1.1,
                    boxShadow: "0 10px 30px rgba(245, 158, 11, 0.3)"
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={handlePlayPause}
                  className="bg-amber-500 hover:bg-amber-600 text-white p-6 rounded-full shadow-lg relative overflow-hidden"
                  aria-label="Pausar timer"
                >
                  {/* Ripple effect no clique */}
                  <motion.div
                    className="absolute inset-0 bg-white/30 rounded-full"
                    initial={{ scale: 0, opacity: 1 }}
                    whileTap={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                  <Pause size={32} />
                </motion.button>
                
                {/* Botão Reset */}
                {timerSeconds > 0 && (
                  <motion.button
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    whileHover={{ 
                      scale: 1.1,
                      rotate: -15,
                      boxShadow: "0 10px 30px rgba(239, 68, 68, 0.3)"
                    }}
                    whileTap={{ scale: 0.9, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={handleReset}
                    className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-full shadow-lg relative"
                    aria-label="Resetar timer"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <RotateCcw size={32} />
                    </motion.div>
                  </motion.button>
                )}
              </>
            ) : (
              /* Botão Play */
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 15px 40px rgba(16, 185, 129, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={handlePlayPause}
                disabled={(mode === 'temporizador' && (timerHours === '' || timerHours === '0') && (timerMinutes === '' || timerMinutes === '0') && timerSeconds === 0) || (mode === 'pomodoro' && !selectedPreset)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-12 py-6 rounded-2xl shadow-lg text-xl font-semibold relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Iniciar timer"
              >
                {/* Gradient shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                <motion.div 
                  className="flex items-center gap-2 relative z-10"
                  whileHover={{ x: 5 }}
                >
                  <Play size={28} />
                  <span>Iniciar</span>
                </motion.div>
              </motion.button>
            )}
          </motion.div>

          {/* Botão Parar e Registrar - Desktop */}
          <AnimatePresence mode="wait">
            {(mode === 'cronometro' && timerSeconds > 0 && !isTimerRunning) && (
              <motion.button
                key="stop-cronometro-desktop"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={handleStop}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full max-w-md py-6 rounded-2xl font-semibold text-lg text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all"
              >
                Parar e Registrar
              </motion.button>
            )}

            {(mode === 'temporizador' && initialTimerSeconds > 0 && !isTimerRunning) && (
              <motion.button
                key="stop-temporizador-desktop"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={handleStop}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full max-w-md py-6 rounded-2xl font-semibold text-lg text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all"
              >
                Parar e Registrar
              </motion.button>
            )}

            {(mode === 'pomodoro' && pomodoroStarted && pomodoroInitialSeconds > 0 && !isTimerRunning && selectedPreset?.label === 'Foco') && (
              <motion.button
                key="stop-pomodoro-desktop"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={handleStop}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full max-w-md py-6 rounded-2xl font-semibold text-lg text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all"
              >
                Parar e Registrar
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* COLUNA DIREITA: Info + Presets + Stats */}
        <div className="flex flex-col space-y-6">
          {/* 🎬 PARTE 8: Card de Informação do Modo - Hover Lift */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`info-desktop-${mode}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: 0.1, duration: 0.4, ease: "easeInOut" }}
              whileHover={{ 
                y: -5,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
              }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
            >
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                >
                  {mode === 'cronometro' && <Timer className="text-emerald-500" size={28} />}
                  {mode === 'temporizador' && <Hourglass className="text-emerald-500" size={28} />}
                  {mode === 'pomodoro' && <Zap className="text-emerald-500" size={28} />}
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
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

          {/* 🎬 PARTE 6: Presets do Pomodoro Desktop - Stagger + Hover */}
          <AnimatePresence mode="wait">
            {mode === 'pomodoro' && !isTimerRunning && (
              <motion.div
                key="pomodoro-presets-desktop"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "easeInOut" }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Presets Rápidos
                </h4>
                
                <motion.div 
                  className="grid grid-cols-3 gap-3"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.1 }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                >
                  {POMODORO_PRESETS.map((preset) => (
                    <motion.button
                      key={preset.minutes}
                      variants={{
                        hidden: { opacity: 0, scale: 0.8, y: 20 },
                        show: { opacity: 1, scale: 1, y: 0 }
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        backgroundColor: "rgb(16, 185, 129)", // emerald-500
                        color: "white",
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePresetSelect(preset)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        selectedPreset?.label === preset.label
                          ? 'bg-emerald-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
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

          {/* 🎬 PARTE 7: Input de Tempo Desktop - Focus Effect */}
          <AnimatePresence mode="wait">
            {mode === 'temporizador' && !isTimerRunning && timerSeconds === 0 && (
              <motion.div
                key="timer-config-desktop"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "easeInOut" }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
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
                        className="w-full bg-gray-100 dark:bg-gray-700 text-center text-4xl font-bold p-4 rounded-xl text-gray-800 dark:text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        min="0"
                        max={field.max}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            whileHover={{ y: -2 }}
            className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-2xl p-6 border border-emerald-500/20"
          >
            <div className="flex items-start gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Info className="text-emerald-500 flex-shrink-0 mt-1" size={20} />
              </motion.div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
                  💡 Dica
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
