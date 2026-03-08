'use client';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useStorage } from '@/lib/storage/hooks';
import type { AlertConfig } from '@/lib/storage/types';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  businessId: number;
  editingAlert: AlertConfig | null;
}

export function AlertModal({
  isOpen,
  onClose,
  onSaved,
  businessId,
  editingAlert,
}: AlertModalProps) {
  const storage = useStorage();
  const [email, setEmail] = useState('');
  const [threshold, setThreshold] = useState('3');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingAlert) {
      setEmail(editingAlert.email);
      setThreshold(String(editingAlert.negative_threshold));
      setEnabled(editingAlert.enabled);
    } else {
      setEmail('');
      setThreshold('3');
      setEnabled(true);
    }
    setError(null);
  }, [editingAlert, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const data = {
        email,
        negative_threshold: parseFloat(threshold),
        enabled,
      };

      if (editingAlert) {
        await storage.updateAlert(editingAlert.id, data);
      } else {
        await storage.createAlert(businessId, data);
      }

      onSaved();
      onClose();
    } catch {
      setError('Failed to save alert. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAlert ? 'Edit Alert' : 'Add Alert'}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input
            label="Email Address *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            readOnly={!!editingAlert}
            className={editingAlert ? 'opacity-70 cursor-not-allowed' : ''}
          />

          <div>
            <Select
              label="Rating Threshold"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full"
            >
              <option value="1">1 star</option>
              <option value="2">2 stars</option>
              <option value="3">3 stars</option>
              <option value="4">4 stars</option>
            </Select>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Alert when rating is at or below this value
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="alertEnabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded text-indigo-600 w-4 h-4"
            />
            <label htmlFor="alertEnabled" className="text-sm text-[var(--text-secondary)]">
              Enabled
            </label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
