'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
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
    } catch (err) {
      console.error('Failed to save alert:', err);
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
          <DialogDescription>
            Configure an email notification when new reviews fall at or below a rating threshold.
          </DialogDescription>
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
                className={cn("mt-1.5", editingAlert && "opacity-70 cursor-not-allowed")}
              />
            </div>

            <div>
              <Label>Rating Threshold</Label>
              <Select value={threshold} onValueChange={setThreshold}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 star</SelectItem>
                  <SelectItem value="2">2 stars</SelectItem>
                  <SelectItem value="3">3 stars</SelectItem>
                  <SelectItem value="4">4 stars</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5">
                Alert when rating is at or below this value
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="alertEnabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
              <Label htmlFor="alertEnabled" className="text-sm text-muted-foreground font-normal">
                Enabled
              </Label>
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
