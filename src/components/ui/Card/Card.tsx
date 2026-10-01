import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  style,
  className = '',
  ...props
}) => {
  const paddings: Record<string, string> = {
    none: '0',
    sm: '16px',
    md: '24px',
    lg: '32px',
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--pbx-radius-xl)',
        border: '1px solid var(--pbx-border-default)',
        boxShadow: 'var(--pbx-shadow-sm)',
        padding: paddings[padding],
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};
