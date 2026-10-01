import React from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { Input, Button, Modal, Heading, Text, Badge } from '../ui';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
}) => {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      leftIcon={<Search size={16} />}
      style={{ maxWidth: '320px' }}
    />
  );
};

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} isLoading={isLoading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: variant === 'danger' ? 'var(--pbx-color-danger-50)' : 'var(--pbx-color-warning-50)',
            color: variant === 'danger' ? 'var(--pbx-color-danger-600)' : 'var(--pbx-color-warning-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={20} />
        </div>
        <div>
          <Heading level={3}>{title}</Heading>
          <Text variant="secondary" style={{ marginTop: '6px' }}>
            {message}
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  variant?: 'neutral' | 'primary' | 'success';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--pbx-radius-xl)',
        border: '1px solid var(--pbx-border-default)',
        padding: '20px 24px',
        boxShadow: 'var(--pbx-shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <Text size="xs" variant="secondary" weight="bold" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </Text>
        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--pbx-text-primary)', marginTop: '4px' }}>
          {value}
        </div>
        {trend && (
          <Text size="xs" variant="muted" style={{ marginTop: '4px' }}>
            {trend}
          </Text>
        )}
      </div>
      {icon && (
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--pbx-radius-lg)',
            backgroundColor: 'var(--pbx-color-primary-50)',
            color: 'var(--pbx-action-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      )}
    </div>
  );
};

export interface StatusPillProps {
  status: boolean | string;
  trueText?: string;
  falseText?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  trueText = 'Active',
  falseText = 'Disabled',
}) => {
  const isEnabled = typeof status === 'boolean' ? status : status === 'active' || status === 'OPEN' || status === 'enabled';
  return (
    <Badge variant={isEnabled ? 'success' : 'neutral'}>
      {isEnabled ? trueText : falseText}
    </Badge>
  );
};
