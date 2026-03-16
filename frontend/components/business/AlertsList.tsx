'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

  const fetchKey = `${businessId}-${refreshKey}`;
  const [prevFetchKey, setPrevFetchKey] = useState(fetchKey);
  if (fetchKey !== prevFetchKey) {
    setPrevFetchKey(fetchKey);
    setLoading(true);
  }

  useEffect(() => {
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
    <Card className="mt-6"><CardContent>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">Email Alerts</h2>
        <Button variant="default" size="sm" onClick={onAdd}>
          + Add Alert
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Get notified when negative reviews are detected.
      </p>

      {loading ? (
        <p className="text-muted-foreground text-center py-4">Loading alerts...</p>
      ) : error ? (
        <p className="text-negative text-center py-4">{error}</p>
      ) : alerts.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          No alerts configured. Click &quot;+ Add Alert&quot; to get notified about negative reviews.
        </p>
      ) : (
        <div>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex justify-between items-center py-3 border-b border-border last:border-b-0"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground">{alert.email}</span>
                <span className="text-sm text-muted-foreground">
                  Alert on ≤{alert.negative_threshold}★
                </span>
                <span
                  className={`px-2 py-0.5 text-xs rounded-lg ${
                    alert.enabled
                      ? 'bg-positive/10 text-positive'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {alert.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onEdit(alert)}
                  className="text-primary hover:text-primary/80 transition text-sm font-medium cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(alert.id)}
                  className="text-negative hover:opacity-80 transition-opacity text-sm font-medium cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent></Card>
  );
}
