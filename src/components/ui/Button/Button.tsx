import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  children,
  style,
  className = '',
  ...props
}) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { height: '32px', padding: '0 12px', fontSize: '12px', borderRadius: 'var(--pbx-radius-md)' },
    md: { height: '40px', padding: '0 16px', fontSize: '13px', borderRadius: 'var(--pbx-radius-lg)' },
    lg: { height: '48px', padding: '0 24px', fontSize: '14px', borderRadius: 'var(--pbx-radius-lg)' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--pbx-action-primary)',
      color: '#FFFFFF',
      border: 'none',
      boxShadow: '0 2px 4px rgba(255, 84, 48, 0.2)',
    },
    secondary: {
      backgroundColor: 'var(--pbx-bg-subtle)',
      color: 'var(--pbx-text-primary)',
      border: '1px solid var(--pbx-border-default)',
    },
    danger: {
      backgroundColor: 'var(--pbx-color-danger-600)',
      color: '#FFFFFF',
      border: 'none',
      boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--pbx-text-secondary)',
      border: 'none',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--pbx-action-primary)',
      border: '1px solid var(--pbx-action-primary)',
    },
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: 'all 0.15s ease-in-out',
        outline: 'none',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      className={className}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 16} /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
