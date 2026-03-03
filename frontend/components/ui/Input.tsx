import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-none px-3 py-2.5 placeholder-[var(--text-muted)] ${className}`}
          {...props}
        />
        {helpText && <p className="text-xs text-[var(--text-muted)] mt-1.5">{helpText}</p>}
        {error && <p className="text-xs text-[var(--negative)] mt-1.5">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
