import React from 'react';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5;
  children: React.ReactNode;
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({
  level = 2,
  children,
  className = '',
  style,
  ...props
}) => {
  const styles: Record<number, React.CSSProperties> = {
    1: { fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, color: 'var(--pbx-text-primary)' },
    2: { fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3, color: 'var(--pbx-text-primary)' },
    3: { fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.4, color: 'var(--pbx-text-primary)' },
    4: { fontSize: '15px', fontWeight: 600, lineHeight: 1.4, color: 'var(--pbx-text-primary)' },
    5: { fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--pbx-text-secondary)' },
  };

  const tagStyle = { ...styles[level], ...style };

  switch (level) {
    case 1:
      return <h1 style={tagStyle} className={className} {...props}>{children}</h1>;
    case 3:
      return <h3 style={tagStyle} className={className} {...props}>{children}</h3>;
    case 4:
      return <h4 style={tagStyle} className={className} {...props}>{children}</h4>;
    case 5:
      return <h5 style={tagStyle} className={className} {...props}>{children}</h5>;
    case 2:
    default:
      return <h2 style={tagStyle} className={className} {...props}>{children}</h2>;
  }
};

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'xs' | 'sm' | 'base' | 'lg';
  variant?: 'primary' | 'secondary' | 'muted' | 'danger' | 'success';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
  as?: 'p' | 'span' | 'div';
}

export const Text: React.FC<TextProps> = ({
  size = 'base',
  variant = 'primary',
  weight = 'normal',
  children,
  as = 'p',
  style,
  className = '',
  ...props
}) => {
  const sizes: Record<string, string> = {
    xs: '11px',
    sm: '12px',
    base: '13px',
    lg: '15px',
  };

  const colors: Record<string, string> = {
    primary: 'var(--pbx-text-primary)',
    secondary: 'var(--pbx-text-secondary)',
    muted: 'var(--pbx-text-muted)',
    danger: 'var(--pbx-color-danger-600)',
    success: 'var(--pbx-color-success-600)',
  };

  const weights: Record<string, number> = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  };

  const textStyle: React.CSSProperties = {
    fontSize: sizes[size],
    color: colors[variant],
    fontWeight: weights[weight],
    lineHeight: 1.5,
    margin: 0,
    ...style,
  };

  if (as === 'span') {
    return <span style={textStyle} className={className} {...props}>{children}</span>;
  }
  if (as === 'div') {
    return <div style={textStyle} className={className} {...props}>{children}</div>;
  }
  return <p style={textStyle} className={className} {...props}>{children}</p>;
};
