import React from 'react';

export interface IconTileProps {
  icon?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'primary' | 'neutral' | 'success' | 'danger' | 'warning';
  className?: string;
}

export const IconTile: React.FC<IconTileProps> = ({
  icon,
  children,
  variant = 'primary',
  className = '',
}) => {
  const variantClasses = {
    primary: 'bg-[var(--pbx-color-primary-50)] text-[var(--pbx-action-primary)]',
    neutral: 'bg-[var(--pbx-bg-surface-hover)] text-[var(--pbx-text-secondary)]',
    success: 'bg-[var(--pbx-color-success-50)] text-[var(--pbx-color-success-700)]',
    danger: 'bg-[var(--pbx-color-danger-50)] text-[var(--pbx-color-danger-700)]',
    warning: 'bg-[var(--pbx-color-warning-50)] text-[var(--pbx-color-warning-700)]',
  };

  return (
    <div
      className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-md flex items-center justify-center shrink-0 ${variantClasses[variant]} ${className}`}
    >
      {icon || children}
    </div>
  );
};
