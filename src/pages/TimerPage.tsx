import { Play, Pause, RotateCcw } from 'lucide-react';

interface TimerPageProps {
  seconds: number;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  onFinish: () => void;
}

export default function TimerPage({ 
  seconds, 
  isRunning, 
  onToggle, 
  onReset, 
  onFinish 
}: TimerPageProps) {

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 md:px-6">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Cronômetro</h1>
        <p className="text-gray-600 text-sm">Acompanhe seu tempo de estudo</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-6 md:p-12 mb-8 md:mb-12 w-full max-w-md mx-auto">
        <div className="text-5xl md:text-7xl font-bold text-gray-800 tracking-tight text-center font-mono">
          {formatTime(seconds)}
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={onToggle}
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
            onClick={onReset}
            className="px-6 py-6 rounded-2xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 shadow-lg transition-all active:scale-95"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        )}
      </div>

      {seconds > 0 && !isRunning && (
        <button
          onClick={onFinish}
          className="mt-4 w-full max-w-md py-5 rounded-2xl font-semibold text-lg text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all active:scale-95"
        >
          Parar e Registrar
        </button>
      )}
    </div>
  );
}