'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useStorage } from '@/lib/storage/hooks';
import type { AlertConfig } from '@/lib/storage/types';

interface AlertsListProps {
  businessId: number;
  onAdd: () => void;
  onEdit: (alert: AlertConfig) => void;
  refreshKey?: number;
}

export function AlertsList({ businessId, onAdd, onEdit, refreshKey }: AlertsListProps) {
  const storage = useStorage();
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    storage
      .getAlerts(businessId)
      .then((data) => {
        setAlerts(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load alerts:', err);
        setError('Failed to load alerts.');
      })
      .finally(() => setLoading(false));
  }, [businessId, storage, refreshKey]);

  async function handleDelete(alertId: number) {
    if (!confirm('Delete this alert?')) return;
    try {
      await storage.deleteAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error('Failed to delete alert:', err);
      alert('Error deleting alert');
    }
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-none border-t-2 border-t-[var(--accent)] border border-[var(--border)] p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Email Alerts</h2>
        <Button variant="primary" className="text-sm px-3 py-1.5" onClick={onAdd}>
          + Add Alert
        </Button>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Get notified when negative reviews are detected.
      </p>

      {loading ? (
        <p className="text-[var(--text-muted)] text-center py-4">Loading alerts...</p>
      ) : error ? (
        <p className="text-[var(--negative)] text-center py-4">{error}</p>
      ) : alerts.length === 0 ? (
        <p className="text-[var(--text-muted)] text-center py-4">
          No alerts configured. Click &quot;+ Add Alert&quot; to get notified about negative reviews.
        </p>
      ) : (
        <div>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex justify-between items-center py-3 border-b border-[var(--border)] last:border-b-0"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-[var(--text-primary)]">{alert.email}</span>
                <span className="text-sm text-[var(--text-muted)]">
                  Alert on ≤{alert.negative_threshold}★
                </span>
                <span
                  className={`px-2 py-0.5 text-xs rounded-none ${
                    alert.enabled
                      ? 'bg-(--positive)/10 text-[var(--positive)]'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                  }`}
                >
                  {alert.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onEdit(alert)}
                  className="text-[var(--accent)] hover:brightness-110 text-sm font-medium transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(alert.id)}
                  className="text-[var(--negative)] hover:brightness-110 text-sm font-medium transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
