'use client';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
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
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Business</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">&quot;{businessName}&quot;</span>?
            {' '}This will also delete all reviews and alerts. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
