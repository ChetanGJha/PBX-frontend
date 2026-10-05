import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        gap: '16px',
        flexWrap: 'wrap',
      }}
      className={className}
    >
      <div>
        {eyebrow && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--pbx-text-muted)',
              marginBottom: '4px',
            }}
          >
            {eyebrow}
          </div>
        )}
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

export interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  subtitle,
  eyebrow,
  badge,
  actions,
  maxWidth = '1400px',
  className = '',
}) => {
  return (
    <div
      style={{
        maxWidth,
        margin: '0 auto',
        padding: '24px 32px 48px',
        width: '100%',
      }}
      className={className}
    >
      {title && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          eyebrow={eyebrow}
          badge={badge}
          actions={actions}
        />
      )}
      {children}
    </div>
  );
};
