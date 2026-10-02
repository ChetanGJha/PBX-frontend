import React from 'react';

export interface StackProps {
  gap?: '1' | '2' | '3' | '4' | '5' | '6' | '8' | '12' | number | string;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  gap = '4',
  align = 'stretch',
  children,
  style,
  className = '',
}) => {
  const gaps: Record<string, string> = {
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '8': '32px',
    '12': '48px',
  };

  const gapValue = typeof gap === 'number' ? `${gap}px` : (gaps[String(gap)] || String(gap));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: gapValue,
        alignItems: align,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
};

export interface InlineProps {
  gap?: '1' | '2' | '3' | '4' | '5' | '6' | '8' | number | string;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'between';
  wrap?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const Inline: React.FC<InlineProps> = ({
  gap = '3',
  align = 'center',
  justify = 'flex-start',
  wrap = true,
  children,
  style,
  className = '',
}) => {
  const gaps: Record<string, string> = {
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '8': '32px',
  };

  const gapValue = typeof gap === 'number' ? `${gap}px` : (gaps[String(gap)] || String(gap));
  const justifyValue = justify === 'between' ? 'space-between' : justify;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: wrap ? 'wrap' : 'nowrap',
        gap: gapValue,
        alignItems: align,
        justifyContent: justifyValue,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
};

export interface GridProps {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: '1' | '2' | '3' | '4' | '5' | '6' | '8' | number | string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  cols = 3,
  gap = '6',
  children,
  style,
  className = '',
}) => {
  const gaps: Record<string, string> = {
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '8': '32px',
  };

  const gapValue = typeof gap === 'number' ? `${gap}px` : (gaps[String(gap)] || String(gap));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: gapValue,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
};

export interface AppShellProps {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  sidebar,
  topbar,
  children,
}) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--pbx-bg-canvas)' }}>
      {sidebar}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {topbar}
        <main style={{ flex: 1, padding: '24px 32px' }}>{children}</main>
      </div>
    </div>
  );
};
