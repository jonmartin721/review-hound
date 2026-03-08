'use client';
import { useEffect, useState } from 'react';
import { useStorage } from '@/lib/storage/hooks';
import { formatDateTime } from '@/lib/utils/format';
import type { ScrapeLog } from '@/lib/storage/types';

interface ScrapeHistoryProps {
  businessId: number;
  refreshKey?: number;
}

function StatusBadge({ status }: { status: string }) {
  let classes: string;
  if (status === 'success') {
    classes = 'bg-(--positive)/10 text-[var(--positive)]';
  } else if (status === 'failed') {
    classes = 'bg-(--negative)/10 text-[var(--negative)]';
  } else {
    classes = 'info-badge';
  }

  return (
    <span className={`px-2 py-0.5 rounded-none text-xs ${classes}`}>{status}</span>
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
    <div className="panel-shell rounded-none p-6 mt-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Scrape History</h2>

      {loading ? (
        <p className="text-[var(--text-muted)] text-center py-4">Loading...</p>
      ) : error ? (
        <p className="text-[var(--negative)] text-center py-4">{error}</p>
      ) : logs.length === 0 ? (
        <p className="text-[var(--text-muted)] text-center py-4">No scrape history yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-elevated)]">
              <tr>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-[var(--text-secondary)]">Source</th>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-[var(--text-secondary)]">Status</th>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-[var(--text-secondary)]">New Reviews</th>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-[var(--text-secondary)]">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 10).map((log) => (
                <tr key={log.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2 text-[var(--text-primary)] font-code">{log.source}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="px-4 py-2 text-[var(--text-primary)]">
                    {log.reviews_found || 0}
                    {log.status === 'success' && (log.reviews_found || 0) === 0 && (
                      <span
                        className="info-badge-subtle ml-1 inline-flex items-center"
                        title="No new reviews found - check if the source URL is correct"
                      >
                        <svg
                          className="w-4 h-4 inline"
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
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[var(--text-muted)] font-code">
                    {log.completed_at ? formatDateTime(log.completed_at) : 'Running...'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
