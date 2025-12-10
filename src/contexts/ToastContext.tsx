import { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextData {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts((state) => [...state, { id, message, type }]);

    // Auto remove após 3 segundos
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((state) => state.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
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
function ToastItem({ toast, onRemove }: { toast: { id: string; message: string; type: ToastType }; onRemove: (id: string) => void }) {
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border-l-4 ${borders[toast.type]} flex items-center gap-3 min-w-[300px]`}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">
        {toast.message}
      </p>
      <button onClick={() => onRemove(toast.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
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