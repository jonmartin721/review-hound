'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStorage } from '@/lib/storage/hooks';
import type { BusinessWithStats } from '@/lib/storage/types';
import { BusinessGrid } from '@/components/dashboard/BusinessGrid';
import { AddBusinessModal } from '@/components/dashboard/AddBusinessModal';
import { EditBusinessModal } from '@/components/dashboard/EditBusinessModal';
import { DeleteConfirmModal } from '@/components/dashboard/DeleteConfirmModal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Plus } from 'lucide-react';
import { IS_PORTFOLIO_MODE, getWorkspaceMode } from '@/lib/portfolio';

export default function DashboardPage() {
  const router = useRouter();

  // First-time visitors in demo mode go to /welcome
  useEffect(() => {
    if (!IS_PORTFOLIO_MODE) return;
    try {
      if (!localStorage.getItem('rh_visited')) {
        localStorage.setItem('rh_visited', '1');
        router.replace('/welcome');
      }
    } catch { /* private browsing */ }
  }, [router]);
  const storage = useStorage();
  const [businesses, setBusinesses] = useState<BusinessWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [workspaceMode] = useState<'sample' | 'blank'>(() => (IS_PORTFOLIO_MODE ? getWorkspaceMode() : 'sample'));

  const loadBusinesses = useCallback(async () => {
    try {
      setError(null);
      const data = await storage.getBusinesses();
      setBusinesses(data);
    } catch (err) {
      console.error('Failed to load businesses:', err);
      setError('Unable to connect to the backend. Make sure Flask is running: reviewhound web');
    } finally {
      setLoading(false);
    }
  }, [storage]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const handleAddSuccess = useCallback(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const handleEditSuccess = useCallback(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const handleDeleteSuccess = useCallback(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-card border border-border border-t-2 border-t-negative rounded-lg p-8 max-w-md">
          <p className="text-negative font-medium mb-2">Connection Error</p>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <Button onClick={loadBusinesses}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Business Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {IS_PORTFOLIO_MODE
              ? 'Explore a browser-local sample workspace or build your own local dataset.'
              : 'Track and analyze your business reviews'}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus />
          Add Business
        </Button>
      </div>

      {IS_PORTFOLIO_MODE && (
        <div data-testid="workspace-info-banner" className="bg-muted border border-border rounded-lg mb-8 p-5">
          <p className="text-foreground font-medium">
            {workspaceMode === 'sample' ? 'Demo workspace' : 'Local workspace'} only
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Data lives in this browser only. Searches, scraping, API keys, and alert rules stay local to this browser profile. Automatic checks only run while this tab is open.
          </p>
        </div>
      )}

      <BusinessGrid
        businesses={businesses}
        onEdit={setEditId}
        onDelete={(id, name) => setDeleteTarget({ id, name })}
        onAddBusiness={() => setShowAdd(true)}
      />

      <AddBusinessModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={handleAddSuccess}
      />

      {editId !== null && (
        <EditBusinessModal
          businessId={editId}
          onClose={() => setEditId(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          id={deleteTarget.id}
          name={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </>
  );
}
