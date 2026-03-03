interface SourceBadgeProps {
  source: string;
  url?: string | null;
  size?: 'sm' | 'md';
}

const SOURCE_LABELS: Record<string, string> = {
  trustpilot: 'TrustPilot',
  bbb: 'BBB',
  yelp: 'Yelp',
  yelp_api: 'Yelp (API)',
  google_places: 'Google',
};

const unifiedClasses = 'border border-[var(--border-bright)] text-[var(--text-secondary)] bg-[var(--bg-elevated)]';

export function SourceBadge({ source, url, size = 'sm' }: SourceBadgeProps) {
  const label = SOURCE_LABELS[source] || source;
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';
  const baseClasses = `${sizeClasses} ${unifiedClasses} rounded-none font-[family-name:var(--font-mono)] uppercase tracking-wider`;

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
         className={`${baseClasses} inline-flex items-center gap-1 hover:opacity-80 transition`}>
        {label}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    );
  }

  return (
    <span className={baseClasses}>{label}</span>
  );
}
