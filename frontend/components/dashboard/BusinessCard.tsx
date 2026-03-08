'use client';

import Link from 'next/link';
import type { BusinessWithStats } from '@/lib/storage/types';
import { SourceBadge } from '@/components/ui/SourceBadge';

interface BusinessCardProps {
  business: BusinessWithStats;
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
}

export function BusinessCard({ business, onEdit, onDelete }: BusinessCardProps) {
  const avgRating = business.avg_rating ?? 0;
  const filledStars = Math.round(avgRating);
  const emptyStars = Math.max(0, 5 - filledStars);

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="panel-shell rounded-none p-6">
      {/* Header: name + warning icon + edit/delete buttons */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] truncate">{business.name}</h2>
          {business.scrape_issues && (
            <span className="info-badge-subtle flex-shrink-0" title="Scrape issues detected">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0 ml-2">
          <button
            onClick={() => onEdit(business.id)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-surface-hover)] rounded-none transition"
            title="Edit business"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(business.id, business.name)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--negative)] hover:bg-(--negative)/10 rounded-none transition"
            title="Delete business"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Rating + trend */}
      <div className="flex items-center mb-1">
        <span className="rating-stars text-lg">{'★'.repeat(filledStars)}{'☆'.repeat(emptyStars)}</span>
        <span className="ml-1 text-[var(--text-secondary)] font-medium font-code">{avgRating.toFixed(1)}</span>
        {business.trend_direction === 'up' && (
          <span className="ml-2 text-[var(--positive)] text-sm font-medium flex items-center">
            <svg className="w-3.5 h-3.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-code">{Math.abs(business.trend_delta).toFixed(1)}</span>
          </span>
        )}
        {business.trend_direction === 'down' && (
          <span className="ml-2 text-[var(--negative)] text-sm font-medium flex items-center">
            <svg className="w-3.5 h-3.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-code">{Math.abs(business.trend_delta).toFixed(1)}</span>
          </span>
        )}
        {business.trend_direction === 'stable' && (
          <span className="ml-2 text-[var(--text-muted)] text-sm font-medium flex items-center">
            <svg className="w-3.5 h-3.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            stable
          </span>
        )}
      </div>

      {/* Review count */}
      <div className="text-[var(--text-muted)] text-sm mb-3 font-code">({business.total_reviews} reviews)</div>

      {/* Negative alert badge */}
      {business.recent_negative_count > 0 && (
        <Link
          href={`/business/${business.id}?sentiment=negative`}
          className="mb-3 flex items-center px-2.5 py-1.5 bg-(--negative)/10 text-[var(--negative)] rounded-none text-sm font-medium hover:bg-(--negative)/20 transition"
        >
          <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {business.recent_negative_count} negative this week
        </Link>
      )}

      {/* Scrape issue badge */}
      {business.scrape_issues && (
        <Link
          href={`/business/${business.id}#scrape-history`}
          className="info-badge mb-3 flex items-center px-2.5 py-1.5 rounded-none text-sm font-medium transition hover:opacity-90"
        >
          <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {business.scrape_issue_type === 'failed'
            ? `${business.scrape_issue_sources.join(', ')} failing`
            : `${business.scrape_issue_sources.join(', ')}: no reviews found`}
        </Link>
      )}

      {/* Activity text */}
      <div className="text-[var(--text-muted)] text-xs mb-3">
        {business.recent_count > 0 && (
          <span>{business.recent_count} new this week</span>
        )}
        {business.recent_count > 0 && business.last_review_date && (
          <span className="mx-1">•</span>
        )}
        {business.last_review_date && (
          <span>Last: {formatDate(business.last_review_date)}</span>
        )}
      </div>

      {/* Sentiment bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
          <span>Sentiment</span>
          <span>{Math.round(business.positive_pct)}% positive</span>
        </div>
        <div className="sentiment-bar bg-[var(--bg-elevated)] flex">
          <div className="bg-[var(--positive)]" style={{ width: `${business.positive_pct}%` }} />
          <div className="bg-[var(--negative)]" style={{ width: `${business.negative_pct}%` }} />
        </div>
      </div>

      {/* Source badges */}
      <div className="flex flex-wrap gap-1.5 text-xs mb-4">
        {business.trustpilot_url && <SourceBadge source="trustpilot" />}
        {business.bbb_url && <SourceBadge source="bbb" />}
        {(business.yelp_url || business.yelp_business_id) && <SourceBadge source="yelp" />}
        {business.google_place_id && <SourceBadge source="google_places" />}
      </div>

      {/* View Details button */}
      <Link
        href={`/business/${business.id}`}
        className="block text-center bg-[var(--accent)] text-[var(--accent-contrast)] py-2.5 rounded-none hover:brightness-105 transition font-medium"
      >
        View Details
      </Link>
    </div>
  );
}
