import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';

interface FabTimerProps {
  onClick: () => void;
  isRunning: boolean;
}

export default function FabTimer({ onClick, isRunning }: FabTimerProps) {
  return (
    <motion.button
      onClick={onClick}
      className="hidden md:flex fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
      initial={{ scale: 0 }}
      animate={{ 
        scale: 1,
        boxShadow: isRunning 
          ? [
              '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 0 rgba(16, 185, 129, 0.7)',
              '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 8px rgba(16, 185, 129, 0)',
              '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 0 rgba(16, 185, 129, 0.7)',
            ]
          : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}
      transition={{
        scale: { type: 'spring', stiffness: 300, damping: 20 },
        boxShadow: isRunning 
          ? { 
              duration: 2, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }
          : { duration: 0.2 },
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Timer className="w-6 h-6" />
    </motion.button>
  );
}

