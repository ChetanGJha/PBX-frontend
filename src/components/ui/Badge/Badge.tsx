import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  style,
  className = '',
  ...props
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    success: { backgroundColor: 'var(--pbx-color-success-50)', color: 'var(--pbx-color-success-700)', border: '1px solid var(--pbx-color-success-100)' },
    warning: { backgroundColor: 'var(--pbx-color-warning-50)', color: 'var(--pbx-color-warning-700)', border: '1px solid var(--pbx-color-warning-100)' },
    danger: { backgroundColor: 'var(--pbx-color-danger-50)', color: 'var(--pbx-color-danger-700)', border: '1px solid var(--pbx-color-danger-100)' },
    info: { backgroundColor: 'var(--pbx-color-neutral-100)', color: 'var(--pbx-text-secondary)', border: '1px solid var(--pbx-border-default)' },
    neutral: { backgroundColor: 'var(--pbx-color-neutral-100)', color: 'var(--pbx-text-secondary)', border: '1px solid var(--pbx-border-default)' },
    primary: { backgroundColor: 'var(--pbx-color-primary-50)', color: 'var(--pbx-color-primary-600)', border: '1px solid var(--pbx-color-primary-100)' },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '2px 8px', fontSize: '11px' },
    md: { padding: '4px 10px', fontSize: '12px' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: 600,
        borderRadius: 'var(--pbx-radius-full)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </span>
  );
};
