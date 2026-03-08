import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useContext } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  apiCtorMock,
  getWorkspaceModeMock,
  indexedCtorMock,
  seedDemoDataMock,
} = vi.hoisted(() => ({
  apiCtorMock: vi.fn(() => ({ kind: 'api' })),
  getWorkspaceModeMock: vi.fn(() => 'sample'),
  indexedCtorMock: vi.fn(() => ({ kind: 'indexeddb' })),
  seedDemoDataMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/storage/api-adapter', () => ({
  APIAdapter: function MockAPIAdapter() {
    return apiCtorMock();
  },
}));

vi.mock('@/lib/storage/indexeddb-adapter', () => ({
  IndexedDBAdapter: function MockIndexedDBAdapter() {
    return indexedCtorMock();
  },
}));

vi.mock('@/lib/db/seed', () => ({
  seedDemoData: seedDemoDataMock,
}));

vi.mock('@/lib/portfolio', () => ({
  getWorkspaceMode: getWorkspaceModeMock,
}));

import { StorageContext, StorageProvider } from './provider';

function AdapterProbe({ children }: { children?: ReactNode }) {
  const adapter = useContext(StorageContext);
  return (
    <div>
      <span>{adapter ? (adapter as { kind: string }).kind : 'missing'}</span>
      {children}
    </div>
  );
}

describe('StorageProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
    getWorkspaceModeMock.mockReturnValue('sample');
  });

  it('seeds demo data in sample mode and provides the IndexedDB adapter', async () => {
    render(
      <StorageProvider>
        <AdapterProbe />
      </StorageProvider>
    );

    await waitFor(() => {
      expect(seedDemoDataMock).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('indexeddb')).toBeInTheDocument();
    expect(indexedCtorMock).toHaveBeenCalledTimes(1);
    expect(apiCtorMock).not.toHaveBeenCalled();
  });

  it('uses the API adapter outside demo mode without seeding', async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'false';

    render(
      <StorageProvider>
        <AdapterProbe />
      </StorageProvider>
    );

    expect(await screen.findByText('api')).toBeInTheDocument();
    expect(seedDemoDataMock).not.toHaveBeenCalled();
    expect(apiCtorMock).toHaveBeenCalledTimes(1);
    expect(indexedCtorMock).not.toHaveBeenCalled();
  });
});
