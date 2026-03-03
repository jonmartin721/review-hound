'use client';

import { useContext } from 'react';
import { StorageContext } from './provider';
import type { StorageAdapter } from './adapter';

export function useStorage(): StorageAdapter {
  const adapter = useContext(StorageContext);
  if (!adapter) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return adapter;
}
