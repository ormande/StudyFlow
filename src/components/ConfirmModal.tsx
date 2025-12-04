import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      button: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      icon: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      button: 'bg-orange-500 hover:bg-orange-600',
    },
    success: {
      icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      button: 'bg-emerald-500 hover:bg-emerald-600',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 text-center">
          <div className={`w-14 h-14 rounded-full ${styles.icon} flex items-center justify-center mx-auto mb-4`}>
            <AlertTriangle size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{message}</p>
        </div>

        {/* Botões */}
        <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-semibold text-white ${styles.button} transition-all active:scale-95`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}