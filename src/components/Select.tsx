import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md";
  variant?: "default" | "muted";
  leftIcon?: React.ReactNode;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  disabled = false,
  fullWidth = true,
  size = "md",
  variant = "default",
  leftIcon,
  className = "",
  id,
  "aria-label": ariaLabel,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;
  const hasValue = Boolean(selectedOption);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  const sizeClasses = {
    sm: "py-2 text-sm",
    md: "py-2.5 sm:py-3 text-sm md:text-base",
  };

  const variantClasses = {
    default: {
      trigger: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
      triggerOpen: "bg-white dark:bg-gray-800",
    },
    muted: {
      trigger: "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500",
      triggerOpen: "bg-gray-50 dark:bg-gray-700",
    },
  };

  const handleSelect = (optionValue: string, optionDisabled?: boolean) => {
    if (optionDisabled) return;
    onChange(optionValue);
    close();
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${fullWidth ? "w-full" : ""} ${className}`}
    >
      <button
        type="button"
        id={selectId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={[
          "flex w-full items-center justify-between gap-2 rounded-xl border transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900",
          "disabled:cursor-not-allowed disabled:opacity-50",
          leftIcon ? "pl-10 pr-3" : "px-4",
          sizeClasses[size],
          isOpen
            ? `border-emerald-500 ${variantClasses[variant].triggerOpen}`
            : variantClasses[variant].trigger,
        ].join(" ")}
      >
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            {leftIcon}
          </span>
        )}

        <span
          className={`min-w-0 flex-1 truncate text-left ${
            hasValue
              ? "text-gray-900 dark:text-white"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {displayLabel}
        </span>

        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-500" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            id={listboxId}
            role="listbox"
            aria-labelledby={selectId}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value || `opt-${option.label}`} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value, option.disabled)}
                    className={[
                      "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                      "disabled:cursor-not-allowed disabled:opacity-40",
                      isSelected
                        ? "bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60",
                    ].join(" ")}
                  >
                    <Check
                      size={16}
                      className={`flex-shrink-0 ${
                        isSelected ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <span className="truncate">{option.label}</span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
