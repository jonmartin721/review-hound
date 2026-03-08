interface StatCardsProps {
  stats: {
    total_reviews: number;
    avg_rating: number;
    positive_pct: number;
    negative_pct: number;
  };
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <div className="bg-[var(--bg-muted)] rounded-lg p-4 text-center">
        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
          {stats.total_reviews}
        </div>
        <div className="text-sm text-[var(--text-muted)]">Total Reviews</div>
      </div>

      <div className="bg-[var(--bg-muted)] rounded-lg p-4 text-center">
        <div className="text-3xl font-bold text-yellow-500">
          {stats.avg_rating.toFixed(1)}★
        </div>
        <div className="text-sm text-[var(--text-muted)]">Avg Rating</div>
      </div>

      <div className="bg-[var(--bg-muted)] rounded-lg p-4 text-center">
        <div className="text-3xl font-bold text-green-500">
          {Math.round(stats.positive_pct)}%
        </div>
        <div className="text-sm text-[var(--text-muted)]">Positive</div>
      </div>

      <div className="bg-[var(--bg-muted)] rounded-lg p-4 text-center">
        <div className="text-3xl font-bold text-red-500">
          {Math.round(stats.negative_pct)}%
        </div>
        <div className="text-sm text-[var(--text-muted)]">Negative</div>
      </div>
    </div>
  );
}
