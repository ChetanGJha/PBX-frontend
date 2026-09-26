import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface AckModalState {
  open: boolean;
  type: ToastType;
  title: string;
  message: string;
  onAcknowledge?: () => void;
}

interface ToastContextValue {
  toastSuccess: (title: string, message?: string) => void;
  toastError: (title: string, message?: string) => void;
  toastWarning: (title: string, message?: string) => void;
  toastInfo: (title: string, message?: string) => void;
  showSuccessModal: (title: string, message: string, onAcknowledge?: () => void) => void;
  showErrorModal: (title: string, message: string, onAcknowledge?: () => void) => void;
  showWarningModal: (title: string, message: string, onAcknowledge?: () => void) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({
  toastSuccess: () => {},
  toastError: () => {},
  toastWarning: () => {},
  toastInfo: () => {},
  showSuccessModal: () => {},
  showErrorModal: () => {},
  showWarningModal: () => {},
});

export const useToast = () => useContext(ToastContext);

// ─── Toast Item Component ─────────────────────────────────────────────────────
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
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

// ─── Toast & Acknowledgement Provider ─────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ackModal, setAckModal] = useState<AckModalState>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

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

  const showAckModal = useCallback((type: ToastType, title: string, message: string, onAcknowledge?: () => void) => {
    setAckModal({
      open: true,
      type,
      title,
      message,
      onAcknowledge,
    });
  }, []);

  const closeAckModal = () => {
    if (ackModal.onAcknowledge) {
      try { ackModal.onAcknowledge(); } catch (e) { console.error(e); }
    }
    setAckModal(prev => ({ ...prev, open: false }));
  };

  const value: ToastContextValue = {
    toastSuccess: (t, m) => addToast('success', t, m),
    toastError:   (t, m) => addToast('error', t, m, 6000),
    toastWarning: (t, m) => addToast('warning', t, m),
    toastInfo:    (t, m) => addToast('info', t, m),
    showSuccessModal: (title, message, onAck) => showAckModal('success', title, message, onAck),
    showErrorModal:   (title, message, onAck) => showAckModal('error', title, message, onAck),
    showWarningModal: (title, message, onAck) => showAckModal('warning', title, message, onAck),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Notification Container */}
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

            {/* Explicit Acknowledgement Modal */}
      {ackModal.open && (
        <div className="modal-backdrop" style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="terrix-modal"
            style={{
              maxWidth: '460px',
              width: '92%',
              animation: 'modalScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              borderRadius: '16px',
              padding: '0',
              overflow: 'hidden',
              background: '#FFFFFF',
              position: 'relative'
            }}
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={closeAckModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
                zIndex: 1
              }}
            >
              <X size={16} />
            </button>

            {/* Header Content */}
            <div style={{ padding: '32px 28px 16px', textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  background:
                    ackModal.type === 'success'
                      ? '#DCFCE7'
                      : ackModal.type === 'error'
                      ? '#FEE2E2'
                      : '#FEF3C7',
                  color:
                    ackModal.type === 'success'
                      ? '#16A34A'
                      : ackModal.type === 'error'
                      ? '#DC2626'
                      : '#D97706',
                  boxShadow:
                    ackModal.type === 'success'
                      ? '0 4px 12px rgba(22, 163, 74, 0.15)'
                      : ackModal.type === 'error'
                      ? '0 4px 12px rgba(220, 38, 38, 0.15)'
                      : '0 4px 12px rgba(217, 119, 6, 0.15)',
                }}
              >
                {ackModal.type === 'success' && <CheckCircle2 size={30} />}
                {ackModal.type === 'error' && <XCircle size={30} />}
                {ackModal.type === 'warning' && <AlertTriangle size={30} />}
                {ackModal.type === 'info' && <Info size={30} />}
              </div>

              <div
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '3px 12px',
                  borderRadius: '20px',
                  marginBottom: '10px',
                  background:
                    ackModal.type === 'success'
                      ? '#ECFDF5'
                      : ackModal.type === 'error'
                      ? '#FEF2F2'
                      : '#FFFBEB',
                  color:
                    ackModal.type === 'success'
                      ? '#059669'
                      : ackModal.type === 'error'
                      ? '#DC2626'
                      : '#D97706',
                }}
              >
                {ackModal.type === 'success' ? 'Operation Completed' : ackModal.type === 'error' ? 'Action Failed' : 'Notice'}
              </div>

              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: '0 0 8px',
                  lineHeight: '1.35',
                  wordBreak: 'break-word',
                  textAlign: 'center'
                }}
              >
                {ackModal.title}
              </h3>
            </div>

            {/* Message Body */}
            <div style={{ padding: '0 28px 24px' }}>
              <div
                style={{
                  fontSize: '13.5px',
                  color: '#334155',
                  lineHeight: '1.6',
                  textAlign: 'center',
                  background: ackModal.type === 'error' ? '#FFF5F5' : '#F8FAFC',
                  border: `1px solid ${ackModal.type === 'error' ? '#FED7D7' : '#E2E8F0'}`,
                  borderRadius: '12px',
                  padding: '14px 18px',
                  wordBreak: 'break-word',
                  fontFamily: ackModal.type === 'error' ? 'monospace' : 'inherit',
                }}
              >
                {ackModal.message}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                borderTop: '1px solid #F1F5F9',
                padding: '16px 28px 24px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                onClick={closeAckModal}
                style={{
                  width: '100%',
                  background:
                    ackModal.type === 'success'
                      ? '#16A34A'
                      : ackModal.type === 'error'
                      ? '#DC2626'
                      : '#FF5430',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '14px',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  transition: 'opacity 0.15s ease',
                }}
              >
                Acknowledge & Continue
              </button>
            </div>
          </div>
        </div>
      )}


      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes modalScaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
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
    <div className="modal-backdrop" style={{ zIndex: 10000 }}>
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
