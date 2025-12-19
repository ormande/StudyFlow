import { createContext, useContext, useState, ReactNode, ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useAppearance } from '../hooks/useAppearance';

type ToastType = 'success' | 'error' | 'warning' | 'info';

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

  const addToast = (content: string | ReactElement, type: ToastType = 'info', duration: number = 3000): string => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts((state) => [...state, { id, content, type, duration }]);

    // Auto remove após duration
    setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((state) => state.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Container dos Toasts (Fixo no topo) */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
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
  const { shouldReduceMotion } = useAppearance();
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
      layout={!shouldReduceMotion}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: -20, scale: 0.9 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={shouldReduceMotion ? { duration: 0 } : undefined}
      className={`pointer-events-auto bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border-l-4 ${borders[toast.type]} ${
        isCustomContent ? 'flex items-start gap-3' : 'flex items-center gap-3'
      } min-w-[300px] relative`}
    >
      {!isCustomContent && icons[toast.type]}
      <div className={isCustomContent ? 'flex-1 min-w-0' : 'flex-1'}>
        {typeof toast.content === 'string' ? (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {toast.content}
          </p>
        ) : (
          toast.content
        )}
      </div>
      <button 
        onClick={() => onRemove(toast.id)} 
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0 absolute top-1/2 right-2 -translate-y-1/2"
        aria-label="Fechar"
      >
        <X size={16} />
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