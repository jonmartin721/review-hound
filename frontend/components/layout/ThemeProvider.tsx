'use client';
import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      // Default to dark; only switch to light if explicitly stored.
      // try/catch guards against localStorage being unavailable (private browsing, etc.)
      const stored = localStorage.getItem('theme');
      if (stored === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    } catch {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return <>{children}</>;
}
