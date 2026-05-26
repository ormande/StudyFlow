import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingBackButtonProps {
  onClick: () => void;
}

export default function FloatingBackButton({ onClick }: FloatingBackButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all"
      aria-label="Voltar"
    >
      <ArrowLeft size={20} />
    </motion.button>
  );
}

