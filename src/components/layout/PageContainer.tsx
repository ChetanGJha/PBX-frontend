import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = '1400px',
}) => {
  return (
    <div
      style={{
        maxWidth,
        margin: '0 auto',
        padding: '24px 32px 48px',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
};

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--pbx-text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--pbx-text-secondary)',
              marginTop: '4px',
              margin: '4px 0 0 0',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{actions}</div>}
    </div>
  );
};
