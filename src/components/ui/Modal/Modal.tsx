import React, { useEffect, useRef } from 'react';
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
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on modal open
    const timer = setTimeout(() => {
      if (modalRef.current) {
        // Priority 1: First interactive form input/select/textarea
        const firstFormInput = modalRef.current.querySelector<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
        );
        if (firstFormInput) {
          firstFormInput.focus();
        } else {
          // Priority 2: Any focusable element that is NOT the close button
          const firstFocusable = modalRef.current.querySelector<HTMLElement>(
            'button:not([aria-label="Close dialog"]):not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            modalRef.current.focus();
          }
        }
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidths: Record<string, string> = {
    sm: '400px',
    md: '520px',
    lg: '640px',
    xl: '768px',
    '2xl': '900px',
  };

  const titleId = title ? `modal-title-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined;

  return (
    <div
      aria-modal="true"
      aria-labelledby={titleId}
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--pbx-z-modal, 1400)' as any,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        style={{
          backgroundColor: 'var(--pbx-bg-surface)',
          borderRadius: 'var(--pbx-radius-xl)',
          width: '100%',
          maxWidth: maxWidths[maxWidth],
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--pbx-shadow-xl)',
          border: '1px solid var(--pbx-border-default)',
          outline: 'none',
        }}
      >
        {(title || subtitle) && (
          <div
            style={{
              padding: '24px',
              borderBottom: '1px solid var(--pbx-border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ flex: 1 }}>
              {title && <Heading id={titleId} level={3}>{title}</Heading>}
              {subtitle && (
                <p style={{ fontSize: '13px', color: 'var(--pbx-text-secondary)', marginTop: '4px', margin: '4px 0 0 0' }}>
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
                padding: '6px',
                borderRadius: 'var(--pbx-radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>{children}</div>

        {footer && (
          <div
            style={{
              padding: '24px',
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
