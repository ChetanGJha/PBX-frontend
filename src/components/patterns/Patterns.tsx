import React from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { Input, Button, Modal, Heading, Text, Badge, IconTile } from '../ui';

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
      className="max-w-[320px]"
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
      <div className="flex gap-4 items-start">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            variant === 'danger'
              ? 'bg-[var(--pbx-color-danger-50)] text-[var(--pbx-color-danger-600)]'
              : 'bg-[var(--pbx-color-warning-50)] text-[var(--pbx-color-warning-600)]'
          }`}
        >
          <AlertTriangle size={20} />
        </div>
        <div>
          <Heading level={3}>{title}</Heading>
          <Text variant="secondary" className="mt-1.5">
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
  style?: React.CSSProperties;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  className = '',
}) => {
  return (
    <div
      className={`bg-[var(--pbx-bg-surface)] rounded-xl border border-[var(--pbx-border-default)] p-5 shadow-sm flex items-start justify-between h-full ${className}`}
    >
      <div className="flex flex-col items-start gap-1 flex-1 min-w-0 pr-3">
        <Text size="xs" variant="secondary" weight="bold" className="uppercase tracking-wider">
          {title}
        </Text>
        <div className="text-2xl font-extrabold text-[var(--pbx-text-primary)] mt-1">
          {value}
        </div>
        {trend && (
          <Text size="xs" variant="muted" className="mt-1 leading-normal break-words">
            {trend}
          </Text>
        )}
      </div>
      {icon && <IconTile icon={icon} />}
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
