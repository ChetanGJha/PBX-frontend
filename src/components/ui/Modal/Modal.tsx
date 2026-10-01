import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Heading } from '../Typography/Typography';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths: Record<string, string> = {
    sm: '400px',
    md: '520px',
    lg: '640px',
    xl: '768px',
    '2xl': '900px',
  };

  return (
    <div
      aria-modal="true"
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--pbx-radius-xl)',
          width: '100%',
          maxWidth: maxWidths[maxWidth],
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--pbx-shadow-xl)',
          border: '1px solid var(--pbx-border-default)',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {(title || subtitle) && (
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--pbx-border-default)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <div>
              {title && <Heading level={3}>{title}</Heading>}
              {subtitle && (
                <p style={{ fontSize: '13px', color: 'var(--pbx-text-secondary)', marginTop: '4px' }}>
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--pbx-text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: 'var(--pbx-radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>{children}</div>

        {footer && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--pbx-border-default)',
              backgroundColor: 'var(--pbx-bg-subtle)',
              borderBottomLeftRadius: 'var(--pbx-radius-xl)',
              borderBottomRightRadius: 'var(--pbx-radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
