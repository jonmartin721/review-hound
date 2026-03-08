import { type SelectHTMLAttributes, type ReactNode, forwardRef, useId } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, children, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
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
