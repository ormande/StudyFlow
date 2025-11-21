import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface TimerPageProps {
  onTimerStop: (hours: number, minutes: number) => void;
}

export default function TimerPage({ onTimerStop }: TimerPageProps) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

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

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    if (seconds > 0) {
      const { hours, minutes } = formatTime(seconds);
      setIsRunning(false);
      setSeconds(0);
      onTimerStop(hours, minutes);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  const { display } = formatTime(seconds);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 md:px-6">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Cronômetro</h1>
        <p className="text-gray-600 text-sm">Acompanhe seu tempo de estudo</p>
      </div>

      {/* AQUI FOI O AJUSTE TÁTICO: 
          1. mx-auto: Garante centro absoluto.
          2. p-6 md:p-12: Diminui o padding no celular para sobrar espaço pro texto.
      */}
      <div className="bg-white rounded-3xl shadow-xl p-6 md:p-12 mb-8 md:mb-12 w-full max-w-md mx-auto">
        {/* AQUI A FONTE DIMINUI NO MOBILE:
          text-5xl (mobile) -> md:text-7xl (PC)
        */}
        <div className="text-5xl md:text-7xl font-bold text-gray-800 tracking-tight text-center font-mono">
          {display}
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={handlePlayPause}
          className={`flex-1 py-6 rounded-2xl font-semibold text-lg text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 ${
            isRunning
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-6 h-6" />
              <span className="hidden md:inline">Pausar</span>
              <span className="md:hidden">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              <span className="hidden md:inline">Iniciar</span>
              <span className="md:hidden">Play</span>
            </>
          )}
        </button>

        {seconds > 0 && (
          <button
            onClick={handleReset}
            className="px-6 py-6 rounded-2xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 shadow-lg transition-all active:scale-95"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        )}
      </div>

      {seconds > 0 && !isRunning && (
        <button
          onClick={handleStop}
          className="mt-4 w-full max-w-md py-5 rounded-2xl font-semibold text-lg text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all active:scale-95"
        >
          Parar e Registrar
        </button>
      )}
    </div>
  );
}