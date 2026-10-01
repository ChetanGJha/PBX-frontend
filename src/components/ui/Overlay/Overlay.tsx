import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Heading } from '../Typography/Typography';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1500,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          backgroundColor: '#FFFFFF',
          boxShadow: 'var(--pbx-shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {title && (
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--pbx-border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Heading level={3}>{title}</Heading>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pbx-text-muted)' }}
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>{children}</div>
        {footer && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--pbx-border-default)', backgroundColor: 'var(--pbx-bg-subtle)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export interface TooltipProps {
  content: string;
  children: React.ReactElement;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-6px)',
            backgroundColor: 'var(--pbx-color-neutral-900)',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 500,
            padding: '4px 8px',
            borderRadius: 'var(--pbx-radius-sm)',
            whiteSpace: 'nowrap',
            zIndex: 1700,
            pointerEvents: 'none',
            boxShadow: 'var(--pbx-shadow-md)',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
