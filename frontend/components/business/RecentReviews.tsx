'use client';
import Link from 'next/link';
import { RatingStars } from '@/components/ui/RatingStars';
import { SentimentBadge } from '@/components/ui/SentimentBadge';
import { SourceBadge } from '@/components/ui/SourceBadge';
import { truncateText, formatDate } from '@/lib/utils/format';
import type { Review } from '@/lib/storage/types';

interface RecentReviewsProps {
  reviews: Review[];
  businessId: number;
}

export function RecentReviews({ reviews, businessId }: RecentReviewsProps) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-xl shadow-sm border border-[var(--border)] p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Reviews</h2>
        <Link
          href={`/business/${businessId}/reviews`}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
        >
          View All →
        </Link>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="border-b border-[var(--border)] pb-4 last:border-b-0">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[var(--text-primary)]">
                    {review.author_name || 'Anonymous'}
                  </span>
                  <RatingStars rating={review.rating} size="sm" />
                  <SentimentBadge label={review.sentiment_label} score={review.sentiment_score} />
                </div>
                <SourceBadge source={review.source} url={review.review_url} size="sm" />
              </div>
              <p className="text-[var(--text-secondary)] mt-2">
                {truncateText(review.text, 200)}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {formatDate(review.review_date || review.scraped_at)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[var(--text-muted)] text-center py-4">
          No reviews yet. Click &quot;Scrape Now&quot; to fetch reviews.
        </p>
      )}
    </div>
  );
}
