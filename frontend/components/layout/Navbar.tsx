'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { getWorkspaceMode, IS_PORTFOLIO_MODE } from '@/lib/portfolio';

export function Navbar() {
  const pathname = usePathname();
  const [workspaceMode] = useState(() => (IS_PORTFOLIO_MODE ? getWorkspaceMode() : null));

  const navLink = (path: string, label: string) => (
    <Link
      href={path}
      className={cn(
        "font-medium uppercase tracking-wider text-xs transition-colors px-3 py-1.5 rounded-md",
        pathname === path
          ? "text-primary bg-accent"
          : "text-muted-foreground hover:text-primary hover:bg-accent"
      )}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-sm font-semibold uppercase tracking-wider text-foreground inline-flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="20" rx="6" ry="5" className="fill-primary"/>
            <circle cx="9" cy="13" r="3" className="fill-primary"/>
            <circle cx="23" cy="13" r="3" className="fill-primary"/>
            <circle cx="13" cy="8" r="2.5" className="fill-primary"/>
            <circle cx="19" cy="8" r="2.5" className="fill-primary"/>
          </svg>
          REVIEW HOUND
        </Link>
        {workspaceMode && (
          <Link
            href="/welcome"
            className={cn(
              "font-medium uppercase tracking-wider text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer",
              workspaceMode === 'sample'
                ? "bg-accent text-accent-foreground hover:bg-accent/80"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            {workspaceMode === 'sample' ? 'Demo Mode' : 'Local Mode'}
          </Link>
        )}
        <div className="flex items-center space-x-2">
          {navLink("/", "Dashboard")}
          {navLink("/settings", "Settings")}
          {navLink("/welcome", "Guide")}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
