import { useState } from 'react';
import { motion } from 'framer-motion';

interface IOSSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export default function IOSSwitch({ 
  checked, 
  onChange, 
  disabled = false,
  'aria-label': ariaLabel 
}: IOSSwitchProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleToggle}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      animate={{
        scale: isPressed ? 0.95 : 1,
        backgroundColor: checked 
          ? 'rgb(16, 185, 129)' // emerald-500
          : 'rgb(209, 213, 219)' // gray-300
      }}
      transition={{
        duration: 0.2,
        ease: 'easeInOut'
      }}
      className={`
        relative inline-flex items-center
        w-[51px] h-[31px]
        rounded-full
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        dark:bg-gray-600
      `}
    >
      {/* Círculo interno deslizante */}
      <motion.span
        animate={{
          x: checked ? 22 : 2
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30
        }}
        className={`
          absolute
          w-[27px] h-[27px]
          rounded-full
          bg-white
          shadow-sm
        `}
      />
    </motion.button>
  );
}
