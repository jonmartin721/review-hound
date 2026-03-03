'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const pathname = usePathname();
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const linkClass = (path: string) => {
    const active = pathname === path;
    return `font-medium uppercase tracking-wider text-xs transition-colors ${active ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'}`;
  };

  return (
    <nav className="bg-[var(--bg-surface)] border-b border-[var(--border)] sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
          <span className="text-[var(--accent)]">◆</span> REVIEW HOUND
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
