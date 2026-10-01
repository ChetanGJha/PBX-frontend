import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean | string;
  children: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  error,
  children,
  style,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <select
      ref={ref}
      disabled={disabled}
      style={{
        width: '100%',
        height: '40px',
        paddingLeft: '14px',
        paddingRight: '32px',
        backgroundColor: '#FFFFFF',
        color: 'var(--pbx-text-primary)',
        fontSize: '13px',
        fontWeight: 500,
        border: error ? '1px solid var(--pbx-color-danger-600)' : '1px solid var(--pbx-border-default)',
        borderRadius: 'var(--pbx-radius-lg)',
        outline: 'none',
        boxShadow: 'var(--pbx-shadow-sm)',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%64748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  error,
  style,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <textarea
      ref={ref}
      disabled={disabled}
      style={{
        width: '100%',
        minHeight: '80px',
        padding: '10px 14px',
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
        fontFamily: 'inherit',
        resize: 'vertical',
        ...style,
      }}
      className={className}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
