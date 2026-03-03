interface SourceBadgeProps {
  source: string;
  url?: string | null;
  size?: 'sm' | 'md';
}

const SOURCE_COLORS: Record<string, string> = {
  trustpilot: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  bbb: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  yelp: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  yelp_api: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  google_places: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
};

const SOURCE_LABELS: Record<string, string> = {
  trustpilot: 'TrustPilot',
  bbb: 'BBB',
  yelp: 'Yelp',
  yelp_api: 'Yelp (API)',
  google_places: 'Google',
};

export function SourceBadge({ source, url, size = 'sm' }: SourceBadgeProps) {
  const colors = SOURCE_COLORS[source] || 'bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
  const label = SOURCE_LABELS[source] || source;
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
         className={`${sizeClasses} ${colors} rounded-md inline-flex items-center gap-1 hover:opacity-80 transition`}>
        {label}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    );
  }

  return (
    <span className={`${sizeClasses} ${colors} rounded-md`}>{label}</span>
  );
}
