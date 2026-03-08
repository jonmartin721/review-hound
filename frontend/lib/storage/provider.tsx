'use client';

import { createContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import type { StorageAdapter } from './adapter';
import { Spinner } from '@/components/ui/Spinner';

const StorageContext = createContext<StorageAdapter | null>(null);

export function StorageProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  const adapter = useMemo(() => {
    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    if (isDemo) {
      const { IndexedDBAdapter } = require('./indexeddb-adapter');
      return new IndexedDBAdapter() as StorageAdapter;
    } else {
      const { APIAdapter } = require('./api-adapter');
      return new APIAdapter() as StorageAdapter;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        const { seedDemoData } = await import('../db/seed');
        await seedDemoData();
      }
      setReady(true);
    };
    init();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <StorageContext.Provider value={adapter}>
      {children}
    </StorageContext.Provider>
  );
}

export { StorageContext };
