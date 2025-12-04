import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText?: string;
  variant?: 'success' | 'warning' | 'info';
  onClose: () => void;
}

export default function AlertModal({
  isOpen,
  title,
  message,
  buttonText = 'OK',
  variant = 'info',
  onClose,
}: AlertModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    success: {
      icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      button: 'bg-emerald-500 hover:bg-emerald-600',
      Icon: CheckCircle,
    },
    warning: {
      icon: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      button: 'bg-orange-500 hover:bg-orange-600',
      Icon: AlertTriangle,
    },
    info: {
      icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      button: 'bg-blue-500 hover:bg-blue-600',
      Icon: Info,
    },
  };

  const styles = variantStyles[variant];
  const IconComponent = styles.Icon;

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 text-center">
          <div className={`w-14 h-14 rounded-full ${styles.icon} flex items-center justify-center mx-auto mb-4`}>
            <IconComponent size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{message}</p>
        </div>

        {/* Botão */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-semibold text-white ${styles.button} transition-all active:scale-95`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}