import React from 'react';
import { Loader2, AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { Heading, Text } from '../Typography/Typography';

export interface SpinnerProps {
  size?: number;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 20, color = 'var(--pbx-action-primary)' }) => {
  return <Loader2 size={size} style={{ color, animation: 'spin 1s linear infinite' }} />;
};

export interface SkeletonProps {
  height?: string;
  width?: string;
  borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  height = '20px',
  width = '100%',
  borderRadius = 'var(--pbx-radius-md)',
}) => {
  return (
    <div
      style={{
        height,
        width,
        borderRadius,
        backgroundColor: 'var(--pbx-color-neutral-200)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
};

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon && (
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--pbx-bg-subtle)',
            color: 'var(--pbx-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          {icon}
        </div>
      )}
      <Heading level={4}>{title}</Heading>
      {description && (
        <Text variant="secondary" style={{ marginTop: '4px', maxWidth: '400px' }}>
          {description}
        </Text>
      )}
      {action && <div style={{ marginTop: '20px' }}>{action}</div>}
    </div>
  );
};

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  icon,
  children,
}) => {
  const styles: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    info: { bg: 'var(--pbx-color-info-50)', border: 'var(--pbx-color-info-200)', text: 'var(--pbx-color-info-700)', icon: <Info size={18} /> },
    success: { bg: 'var(--pbx-color-success-50)', border: 'var(--pbx-color-success-200)', text: 'var(--pbx-color-success-700)', icon: <CheckCircle2 size={18} /> },
    warning: { bg: 'var(--pbx-color-warning-50)', border: 'var(--pbx-color-warning-200)', text: 'var(--pbx-color-warning-700)', icon: <AlertCircle size={18} /> },
    danger: { bg: 'var(--pbx-color-danger-50)', border: 'var(--pbx-color-danger-200)', text: 'var(--pbx-color-danger-700)', icon: <XCircle size={18} /> },
  };

  const current = styles[variant];

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 'var(--pbx-radius-lg)',
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        color: current.text,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        fontSize: '13px',
      }}
    >
      <div style={{ marginTop: '2px', flexShrink: 0 }}>{icon || current.icon}</div>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 700, marginBottom: '2px' }}>{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
};
