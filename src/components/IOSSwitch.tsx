import { useState } from 'react';

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
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleToggle}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        relative inline-flex items-center
        w-[51px] h-[31px]
        rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isPressed ? 'scale-95' : 'scale-100'}
        ${checked 
          ? 'bg-emerald-500 dark:bg-emerald-500' 
          : 'bg-gray-300 dark:bg-gray-600'
        }
      `}
    >
      {/* Círculo interno deslizante */}
      <span
        className={`
          absolute
          w-[27px] h-[27px]
          rounded-full
          bg-white
          shadow-sm
          transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-[22px]' : 'translate-x-[2px]'}
        `}
      />
    </button>
  );
}
