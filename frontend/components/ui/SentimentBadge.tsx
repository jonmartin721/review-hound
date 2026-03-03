interface SentimentBadgeProps {
  label: string | null | undefined;
  score?: number | null;
  size?: 'sm' | 'md';
}

export function SentimentBadge({ label, score, size = 'sm' }: SentimentBadgeProps) {
  const sentiment = label || 'neutral';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2 py-1 text-sm';

  const colorClasses = {
    positive: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    negative: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    neutral: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  }[sentiment] || 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';

  return (
    <span className={`${sizeClasses} rounded ${colorClasses}`}>
      {sentiment}
      {score != null && ` (${score.toFixed(2)})`}
    </span>
  );
}
