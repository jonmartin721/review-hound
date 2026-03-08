'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useStorage } from '@/lib/storage/hooks';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  businessId: number;
  businessName: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onDeleted,
  businessId,
  businessName,
}: DeleteConfirmModalProps) {
  const storage = useStorage();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await storage.deleteBusiness(businessId);
      onDeleted();
    } catch {
      setError('Failed to delete business. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Business" maxWidth="max-w-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-(--negative)/10 rounded-none flex items-center justify-center shrink-0">
          <svg
            className="w-5 h-5 text-[var(--negative)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-[var(--text-secondary)] pt-1">
          Are you sure you want to delete &quot;{businessName}&quot;? This will also delete all
          reviews and alerts. This action cannot be undone.
        </p>
      </div>

      {error && <p className="text-sm text-[var(--negative)] mb-4">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="danger" loading={deleting} onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
