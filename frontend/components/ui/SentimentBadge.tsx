interface SentimentBadgeProps {
  label: string | null | undefined;
  score?: number | null;
  size?: 'sm' | 'md';
}

const SENTIMENT_CLASSES: Record<string, string> = {
  positive: 'border border-[var(--positive)]/30 text-[var(--positive)] bg-[var(--positive)]/10',
  negative: 'border border-[var(--negative)]/30 text-[var(--negative)] bg-[var(--negative)]/10',
  neutral: 'border border-[var(--accent)]/30 text-[var(--accent)] bg-[var(--accent-dim)]',
};

export function SentimentBadge({ label, score, size = 'sm' }: SentimentBadgeProps) {
  const sentiment = label || 'neutral';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2 py-1 text-sm';
  const colorClasses = SENTIMENT_CLASSES[sentiment] || SENTIMENT_CLASSES.neutral;

  return (
    <span className={`${sizeClasses} rounded-none uppercase tracking-wider font-medium ${colorClasses}`}>
      {sentiment}
      {score != null && ` (${score.toFixed(2)})`}
    </span>
  );
}
