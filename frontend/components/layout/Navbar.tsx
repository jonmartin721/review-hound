'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const pathname = usePathname();
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const linkClass = (path: string) => {
    const active = pathname === path;
    return `font-medium uppercase tracking-wider text-xs transition-colors px-3 py-1.5 ${active ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-surface-hover)]'}`;
  };

  return (
    <nav className="bg-[var(--bg-surface)] border-b border-[var(--border)] sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)] inline-flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="20" rx="6" ry="5" fill="var(--accent)"/>
            <circle cx="9" cy="13" r="3" fill="var(--accent)"/>
            <circle cx="23" cy="13" r="3" fill="var(--accent)"/>
            <circle cx="13" cy="8" r="2.5" fill="var(--accent)"/>
            <circle cx="19" cy="8" r="2.5" fill="var(--accent)"/>
          </svg>
          REVIEW HOUND
        </Link>
        <div className="flex items-center space-x-6">
          <Link href="/" className={linkClass('/')}>Dashboard</Link>
          <Link href="/settings" className={linkClass('/settings')}>Settings</Link>
          <Link href="/welcome" className={linkClass('/welcome')}>Guide</Link>
          <ThemeToggle />
        </div>
      </div>
      {isDemo && (
        <div className="bg-[var(--accent-dim)] border-b border-[var(--border)]">
          <div className="container mx-auto px-6 py-1.5 text-center text-xs text-[var(--accent)]">
            Demo mode — data stored in your browser. Clear browser data = data gone.
          </div>
        </div>
      )}
    </nav>
  );
}
