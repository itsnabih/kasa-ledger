import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-lg border touch-manipulation select-none focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50 disabled:pointer-events-none min-h-[44px] min-w-[44px]';

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-brand text-white border-brand hover:opacity-95 active:opacity-90',
    secondary:
      'bg-subtle text-text-primary border-border hover:bg-border/60 active:bg-border',
    outline:
      'bg-surface text-text-primary border-border hover:bg-subtle active:bg-border/50',
    danger: 'bg-expense text-white border-expense hover:opacity-95 active:opacity-90',
    ghost:
      'bg-transparent text-text-secondary border-transparent hover:bg-subtle hover:text-text-primary'
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
      {children ? <span>{children}</span> : null}
      {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
    </button>
  );
};
