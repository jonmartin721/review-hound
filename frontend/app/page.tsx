'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStorage } from '@/lib/storage/hooks';
import type { BusinessWithStats } from '@/lib/storage/types';
import { BusinessGrid } from '@/components/dashboard/BusinessGrid';
import { AddBusinessModal } from '@/components/dashboard/AddBusinessModal';
import { EditBusinessModal } from '@/components/dashboard/EditBusinessModal';
import { DeleteConfirmModal } from '@/components/dashboard/DeleteConfirmModal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function DashboardPage() {
  const storage = useStorage();
  const [businesses, setBusinesses] = useState<BusinessWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

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
        <div className="fade-in bg-[var(--bg-surface)] border border-[var(--border)] border-t-2 border-t-[var(--negative)] rounded-none p-8 max-w-md">
          <p className="text-[var(--negative)] font-medium mb-2">Connection Error</p>
          <p className="text-[var(--text-muted)] text-sm mb-4">{error}</p>
          <Button onClick={loadBusinesses}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Business Dashboard</h1>
          <p className="text-[var(--text-muted)] mt-1">Track and analyze your business reviews</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Business
        </Button>
      </div>

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
