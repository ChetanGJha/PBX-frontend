import React from 'react';

export interface StackProps {
  gap?: '1' | '2' | '3' | '4' | '5' | '6' | '8';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Stack: React.FC<StackProps> = ({
  gap = '4',
  align = 'stretch',
  children,
  style,
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: gaps[gap],
        alignItems: align,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export interface InlineProps {
  gap?: '1' | '2' | '3' | '4' | '6';
  align?: 'flex-start' | 'center' | 'flex-end';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Inline: React.FC<InlineProps> = ({
  gap = '3',
  align = 'center',
  justify = 'flex-start',
  children,
  style,
}) => {
  const gaps: Record<string, string> = {
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '6': '24px',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: gaps[gap],
        alignItems: align,
        justifyContent: justify,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export interface GridProps {
  cols?: 1 | 2 | 3 | 4;
  gap?: '3' | '4' | '6';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Grid: React.FC<GridProps> = ({
  cols = 3,
  gap = '6',
  children,
  style,
}) => {
  const gaps: Record<string, string> = {
    '3': '12px',
    '4': '16px',
    '6': '24px',
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: gaps[gap],
        ...style,
      }}
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
