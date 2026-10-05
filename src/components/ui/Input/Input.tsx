import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  error,
  leftIcon,
  rightIcon,
  style,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
      {leftIcon && (
        <div style={{ position: 'absolute', left: '12px', color: 'var(--pbx-text-muted)', display: 'flex' }}>
          {leftIcon}
        </div>
      )}
      <input
        ref={ref}
        disabled={disabled}
        style={{
          width: '100%',
          height: '40px',
          paddingLeft: leftIcon ? '36px' : '14px',
          paddingRight: rightIcon ? '36px' : '14px',
          backgroundColor: '#FFFFFF',
          color: 'var(--pbx-text-primary)',
          fontSize: '13px',
          fontWeight: 500,
          border: error ? '1px solid var(--pbx-color-danger-600)' : '1px solid var(--pbx-border-default)',
          borderRadius: 'var(--pbx-radius-lg)',
          outline: 'none',
          boxShadow: 'var(--pbx-shadow-sm)',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          ...style,
        }}
        className={className}
        {...props}
      />
      {rightIcon && (
        <div style={{ position: 'absolute', right: '12px', color: 'var(--pbx-text-muted)', display: 'flex' }}>
          {rightIcon}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  hint,
  required,
  children,
  style,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', width: '100%', ...style }}>
      {label && (
        <label
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--pbx-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            minHeight: '26px',
            display: 'flex',
            alignItems: 'flex-end',
            lineHeight: '1.3',
          }}
        >
          <span>
            {label} {required && <span style={{ color: 'var(--pbx-color-danger-600)' }}>*</span>}
          </span>
        </label>
      )}
      {children}
      {error ? (
        <span style={{ fontSize: '11px', color: 'var(--pbx-color-danger-600)', fontWeight: 500 }}>{error}</span>
      ) : hint ? (
        <span style={{ fontSize: '11px', color: 'var(--pbx-text-muted)' }}>{hint}</span>
      ) : null}
    </div>
  );
};
