import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';
import Button from './Button';

interface FabTimerProps {
  onClick: () => void;
  isRunning: boolean;
}

export default function FabTimer({ onClick, isRunning }: FabTimerProps) {
  return (
    <motion.div
      id="fab-timer"
      className="hidden md:flex fixed bottom-8 right-8 z-50"
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
      <Button
        onClick={onClick}
        variant="primary"
        size="lg"
        className="w-16 h-16 rounded-full shadow-xl"
      >
        <Timer className="w-6 h-6" />
      </Button>
    </motion.div>
  );
}

