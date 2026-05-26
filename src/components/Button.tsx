import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Classes base
    const baseClasses = [
      'flex',
      'items-center',
      'justify-center',
      'font-semibold',
      'transition-all',
      'duration-200',
      'active:scale-95',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:active:scale-100',
      'rounded-xl',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'focus:ring-emerald-500',
    ];

    // Classes de variante
    const variantClasses = {
      primary: [
        'bg-emerald-500',
        'text-white',
        'hover:bg-emerald-600',
        'shadow-sm',
      ],
      secondary: [
        'bg-gray-100',
        'text-gray-900',
        'hover:bg-gray-200',
        'dark:bg-gray-800',
        'dark:text-gray-100',
        'dark:hover:bg-gray-700',
      ],
      outline: [
        'border-2',
        'border-emerald-500',
        'text-emerald-500',
        'hover:bg-emerald-50',
        'dark:hover:bg-emerald-900/20',
      ],
      ghost: [
        'text-gray-600',
        'hover:bg-gray-100',
        'dark:text-gray-400',
        'dark:hover:bg-gray-800',
      ],
      danger: [
        'bg-red-500',
        'text-white',
        'hover:bg-red-600',
      ],
    };

    // Classes de tamanho
    const sizeClasses = {
      sm: ['h-8', 'px-3', 'text-xs'],
      md: ['h-10', 'px-4', 'text-sm'],
      lg: ['h-12', 'px-6', 'text-base'],
    };

    // Classes adicionais
    const additionalClasses = [];
    if (fullWidth) {
      additionalClasses.push('w-full');
    }

    // Combinar todas as classes
    const allClasses = [
      ...baseClasses,
      ...variantClasses[variant],
      ...sizeClasses[size],
      ...additionalClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Spinner SVG
    const Spinner = () => (
      <svg
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        style={{ width: '1em', height: '1em' }}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    // Determinar se deve mostrar ícones
    const showLeftIcon = isLoading ? false : !!leftIcon;
    const showRightIcon = isLoading ? false : !!rightIcon;

    return (
      <button
        ref={ref}
        className={allClasses}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="mr-2">
            <Spinner />
          </span>
        )}
        {showLeftIcon && (
          <span className="mr-2 flex-shrink-0">{leftIcon}</span>
        )}
        {children && <span className="flex items-center justify-center">{children}</span>}
        {showRightIcon && (
          <span className="ml-2 flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

