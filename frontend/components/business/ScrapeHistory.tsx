'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useStorage } from '@/lib/storage/hooks';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils/format';
import type { ScrapeLog } from '@/lib/storage/types';

interface ScrapeHistoryProps {
  businessId: number;
  refreshKey?: number;
}

function StatusBadge({ status }: { status: string }) {
  let classes: string;
  if (status === 'success') {
    classes = 'bg-positive/10 text-positive';
  } else if (status === 'failed') {
    classes = 'bg-negative/10 text-negative';
  } else {
    classes = 'bg-muted text-muted-foreground';
  }

  return (
    <span className={cn("px-2 py-0.5 rounded-lg text-xs", classes)}>{status}</span>
  );
}

export function ScrapeHistory({ businessId, refreshKey }: ScrapeHistoryProps) {
  const storage = useStorage();
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKey = `${businessId}-${refreshKey}`;
  const [prevFetchKey, setPrevFetchKey] = useState(fetchKey);
  if (fetchKey !== prevFetchKey) {
    setPrevFetchKey(fetchKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    storage
      .getScrapeHistory(businessId, 10)
      .then(setLogs)
      .catch(() => setError('Failed to load scrape history.'))
      .finally(() => setLoading(false));
  }, [businessId, storage, refreshKey]);

  return (
    <Card className="mt-6"><CardContent>
      <h2 className="text-lg font-semibold text-foreground mb-4">Scrape History</h2>

      {loading ? (
        <p className="text-muted-foreground text-center py-4">Loading...</p>
      ) : error ? (
        <p className="text-negative text-center py-4">{error}</p>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No scrape history yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">Source</th>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">New Reviews</th>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 10).map((log) => (
                <tr key={log.id} className="border-t border-border">
                  <td className="px-4 py-2 text-foreground font-mono">{log.source}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="px-4 py-2 text-foreground">
                    {log.reviews_found || 0}
                    {log.status === 'success' && (log.reviews_found || 0) === 0 && (
                      <span
                        className="text-muted-foreground ml-1 inline-flex items-center"
                        title="No new reviews found - check if the source URL is correct"
                      >
                        <AlertTriangle className="w-4 h-4 inline" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground font-mono">
                    {log.completed_at ? formatDateTime(log.completed_at) : 'Running...'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent></Card>
  );
}
