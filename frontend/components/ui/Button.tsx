import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', loading, children, disabled, className = '', ...props }: ButtonProps) {
  const base = 'px-4 py-2.5 rounded-none font-medium transition inline-flex items-center justify-center gap-2 cursor-pointer';
  const variants = {
    primary: 'bg-[var(--accent)] text-[var(--accent-contrast)] hover:brightness-105',
    secondary: 'border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
    danger: 'bg-[var(--negative)] text-[var(--solid-contrast)] hover:brightness-105',
    ghost: 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
    success: 'bg-[var(--positive)] text-[var(--solid-contrast)] hover:brightness-105',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
