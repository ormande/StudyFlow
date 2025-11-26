import { Play, Pause, RotateCcw } from 'lucide-react';

interface TimerPageProps {
  onTimerStop: (hours: number, minutes: number, seconds: number) => void;
  timerSeconds: number;
  setTimerSeconds: (seconds: number) => void;
  isTimerRunning: boolean;
  setIsTimerRunning: (running: boolean) => void;
}

export default function TimerPage({
  onTimerStop,
  timerSeconds,
  setTimerSeconds,
  isTimerRunning,
  setIsTimerRunning
}: TimerPageProps) {

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return {
      display: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      hours,
      minutes,
    };
  };

  const handlePlayPause = () => setIsTimerRunning(!isTimerRunning);

  const handleStop = () => {
    if (timerSeconds > 0) {
      const { hours, minutes } = formatTime(timerSeconds);
      const secs = timerSeconds % 60;
      setIsTimerRunning(false);
      setTimerSeconds(0);
      onTimerStop(hours, minutes, secs);
    }
  };

  const handleReset = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const { display } = formatTime(timerSeconds);

  return (
    // ALTERAÇÃO AQUI: h-[calc(100vh-140px)] força a altura exata e overflow-hidden trava o scroll
    <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] overflow-hidden px-4 md:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 transition-colors">Cronômetro</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">Acompanhe seu tempo de estudo</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 md:p-12 mb-8 md:mb-12 w-full max-w-md mx-auto transition-colors duration-300">
        <div className="text-5xl md:text-7xl font-bold text-gray-800 dark:text-white tracking-tight text-center font-mono transition-colors">
          {display}
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={handlePlayPause}
          className={`flex-1 py-6 rounded-2xl font-semibold text-lg text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 ${
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

        {timerSeconds > 0 && (
          <button
            onClick={handleReset}
            className="px-6 py-6 rounded-2xl font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-lg transition-all active:scale-95"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        )}
      </div>

      {timerSeconds > 0 && !isTimerRunning && (
        <button
          onClick={handleStop}
          className="mt-4 w-full max-w-md py-5 rounded-2xl font-semibold text-lg text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-2"
        >
          Parar e Registrar
        </button>
      )}
    </div>
  );
}