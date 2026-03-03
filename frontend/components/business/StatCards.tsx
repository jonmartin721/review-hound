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
      <div className="bg-[var(--bg-elevated)] rounded-none p-4 text-center">
        <div className="text-3xl font-bold text-[var(--accent)] font-code">
          {stats.total_reviews}
        </div>
        <div className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Total Reviews</div>
      </div>

      <div className="bg-[var(--bg-elevated)] rounded-none p-4 text-center">
        <div className="text-3xl font-bold text-[var(--accent)] font-code">
          {stats.avg_rating.toFixed(1)}★
        </div>
        <div className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Avg Rating</div>
      </div>

      <div className="bg-[var(--bg-elevated)] rounded-none p-4 text-center">
        <div className="text-3xl font-bold text-[var(--positive)] font-code">
          {Math.round(stats.positive_pct)}%
        </div>
        <div className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Positive</div>
      </div>

      <div className="bg-[var(--bg-elevated)] rounded-none p-4 text-center">
        <div className="text-3xl font-bold text-[var(--negative)] font-code">
          {Math.round(stats.negative_pct)}%
        </div>
        <div className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Negative</div>
      </div>
    </div>
  );
}
