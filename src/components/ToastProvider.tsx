import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toastSuccess: (title: string, message?: string) => void;
  toastError: (title: string, message?: string) => void;
  toastWarning: (title: string, message?: string) => void;
  toastInfo: (title: string, message?: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({
  toastSuccess: () => {},
  toastError: () => {},
  toastWarning: () => {},
  toastInfo: () => {},
});

export const useToast = () => useContext(ToastContext);

// ─── Toast Item Component ─────────────────────────────────────────────────────
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; title: string }> = {
  success: { bg: '#F0FDF4', border: '#BBF7D0', icon: '#16A34A', title: '#14532D' },
  error:   { bg: '#FEF2F2', border: '#FECACA', icon: '#DC2626', title: '#7F1D1D' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', icon: '#D97706', title: '#78350F' },
  info:    { bg: '#EFF6FF', border: '#BFDBFE', icon: '#2563EB', title: '#1E3A8A' },
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const c = COLORS[toast.type];
  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderLeft: `4px solid ${c.icon}`,
        borderRadius: '10px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        maxWidth: '380px',
        minWidth: '300px',
        animation: 'slideInRight 0.3s ease',
      }}
    >
      <span style={{ color: c.icon, flexShrink: 0, marginTop: '1px' }}>{ICONS[toast.type]}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '13px', color: c.title }}>{toast.title}</div>
        {toast.message && (
          <div style={{ fontSize: '12px', color: '#374151', marginTop: '3px', lineHeight: 1.5 }}>{toast.message}</div>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', flexShrink: 0, padding: '2px' }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

// ─── Toast Provider ───────────────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const value: ToastContextValue = {
    toastSuccess: (t, m) => addToast('success', t, m),
    toastError:   (t, m) => addToast('error', t, m, 6000),
    toastWarning: (t, m) => addToast('warning', t, m),
    toastInfo:    (t, m) => addToast('info', t, m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'all' }}>
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

// ─── Confirmation Modal ───────────────────────────────────────────────────────
interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel
}) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="terrix-modal" style={{ maxWidth: '440px' }}>
        <div className="modal-head">
          <div className={`modal-icon ${danger ? 'red' : 'orange'}`}>
            {danger ? <XCircle size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div>
            <h3>{title}</h3>
          </div>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{message}</div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
