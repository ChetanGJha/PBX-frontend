import React from 'react';
export * from './IconTile';


export interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md' }) => {
  const sizes: Record<string, { width: string; height: string; fontSize: string }> = {
    sm: { width: '28px', height: '28px', fontSize: '11px' },
    md: { width: '36px', height: '36px', fontSize: '13px' },
    lg: { width: '48px', height: '48px', fontSize: '16px' },
  };

  const current = sizes[size];
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        style={{
          width: current.width,
          height: current.height,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: current.width,
        height: current.height,
        borderRadius: '50%',
        backgroundColor: 'var(--pbx-color-primary-100)',
        color: 'var(--pbx-color-primary-600)',
        fontWeight: 700,
        fontSize: current.fontSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
};

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  margin?: string;
}

export const Divider: React.FC<DividerProps> = ({ orientation = 'horizontal', margin = '20px 0' }) => {
  if (orientation === 'vertical') {
    return (
      <div
        style={{
          width: '1px',
          height: '100%',
          backgroundColor: 'var(--pbx-border-default)',
          margin: '0 12px',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '1px',
        backgroundColor: 'var(--pbx-border-default)',
        margin,
      }}
    />
  );
};
