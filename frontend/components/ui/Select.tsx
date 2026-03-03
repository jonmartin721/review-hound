import { type SelectHTMLAttributes, type ReactNode, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, children, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">{label}</label>
        )}
        <select
          ref={ref}
          className={`w-full border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-none px-3 py-2.5 ${className}`}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = 'Select';
