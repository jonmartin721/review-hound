'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingAlert ? 'Edit Alert' : 'Add Alert'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="alert-email">Email Address *</Label>
              <Input
                id="alert-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                readOnly={!!editingAlert}
                className={`mt-1.5 ${editingAlert ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <Label htmlFor="alert-threshold">Rating Threshold</Label>
              <select
                id="alert-threshold"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="1">1 star</option>
                <option value="2">2 stars</option>
                <option value="3">3 stars</option>
                <option value="4">4 stars</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1.5">
                Alert when rating is at or below this value
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="alertEnabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded text-primary w-4 h-4"
              />
              <label htmlFor="alertEnabled" className="text-sm text-muted-foreground">
                Enabled
              </label>
            </div>

            {error && <p className="text-sm text-negative">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
