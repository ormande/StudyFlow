import { createContext, useContext, useState, useEffect, useRef, ReactNode, ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

const MAX_TOASTS = 3;
const QUEUE_DELAY = 300; // Delay entre a saída de um toast e a entrada do próximo

interface Toast {
  id: string;
  content: string | ReactElement;
  type: ToastType;
  duration?: number;
}

interface ToastContextData {
  addToast: (content: string | ReactElement, type?: ToastType, duration?: number) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [queue, setQueue] = useState<Toast[]>([]);
  const queueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addToast = (content: string | ReactElement, type: ToastType = 'info', duration: number = 3000): string => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, content, type, duration };

    setToasts((state) => {
      // Se há espaço disponível, adiciona diretamente
      if (state.length < MAX_TOASTS) {
        // Auto remove após duration
        setTimeout(() => {
          removeToast(id);
        }, duration);
        return [...state, newToast];
      } else {
        // Se não há espaço, adiciona à fila
        setQueue((prevQueue) => [...prevQueue, newToast]);
        return state;
      }
    });

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((state) => state.filter((toast) => toast.id !== id));
  };

  // Processa a fila quando há espaço disponível
  useEffect(() => {
    // Limpa timeout anterior se existir
    if (queueTimeoutRef.current) {
      clearTimeout(queueTimeoutRef.current);
    }

    // Se há espaço e itens na fila, processa após um delay
    if (toasts.length < MAX_TOASTS && queue.length > 0) {
      queueTimeoutRef.current = setTimeout(() => {
        setQueue((prevQueue) => {
          const nextToast = prevQueue[0];
          if (!nextToast) return prevQueue;

          // Adiciona o próximo toast da fila
          setToasts((prevToasts) => {
            // Auto remove após duration
            setTimeout(() => {
              removeToast(nextToast.id);
            }, nextToast.duration || 3000);
            return [...prevToasts, nextToast];
          });

          // Remove o primeiro da fila
          return prevQueue.slice(1);
        });
      }, QUEUE_DELAY);
    }

    // Cleanup
    return () => {
      if (queueTimeoutRef.current) {
        clearTimeout(queueTimeoutRef.current);
      }
    };
  }, [toasts.length, queue.length]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Container dos Toasts (Fixo no topo) */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full px-4 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// Componente visual individual
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  // Toasts sempre devem ter animação (são feedbacks importantes), mas respeitam prefers-reduced-motion do sistema
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const borders = {
    success: 'border-emerald-500',
    error: 'border-red-500',
    warning: 'border-amber-500',
    info: 'border-blue-500',
  };

  const isCustomContent = typeof toast.content !== 'string';

  return (
    <motion.div
      layout={!prefersReducedMotion}
      initial={prefersReducedMotion ? undefined : { opacity: 0, x: 50, scale: 0.9 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0, scale: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, x: 20, scale: 0.9 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, type: "spring", damping: 25, stiffness: 500 }}
      className={`pointer-events-auto bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border-l-4 ${borders[toast.type]} flex items-start gap-3 w-[90vw] sm:min-w-[350px] sm:max-w-md mx-auto`}
    >
      {!isCustomContent && icons[toast.type]}
      <div className="flex-1 min-w-0">
        {typeof toast.content === 'string' ? (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 break-words">
            {toast.content}
          </p>
        ) : (
          toast.content
        )}
      </div>
      <button 
        onClick={() => onRemove(toast.id)} 
        className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
        aria-label="Fechar"
      >
        <X className="size-5" />
      </button>
    </motion.div>
  );
}

// Hook para usar fácil
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}