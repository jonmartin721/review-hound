'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useStorage } from '@/lib/storage/hooks';

interface DeleteConfirmModalProps {
  id: number;
  name: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteConfirmModal({ id, name, onClose, onSuccess }: DeleteConfirmModalProps) {
  const storage = useStorage();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await storage.deleteBusiness(id);
      onSuccess();
      onClose();
    } catch {
      setError('Failed to delete business. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="">
      <div className="flex items-center mb-4 -mt-5">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Delete Business</h2>
      </div>

      <p className="text-[var(--text-secondary)] mb-6">
        Are you sure you want to delete{' '}
        <span className="font-medium text-[var(--text-primary)]">&quot;{name}&quot;</span>?
        {' '}This will also delete all associated reviews and alerts. This action cannot be undone.
      </p>

      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={deleting}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
