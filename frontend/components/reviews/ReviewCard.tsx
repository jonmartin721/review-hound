import { RatingStars } from '@/components/ui/RatingStars';
import { SentimentBadge } from '@/components/ui/SentimentBadge';
import { SourceBadge } from '@/components/ui/SourceBadge';
import { formatDate } from '@/lib/utils/format';
import type { Review } from '@/lib/storage/types';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-none border border-[var(--border)] p-6">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-[var(--text-primary)]">
            {review.author_name || 'Anonymous'}
          </span>
          <RatingStars rating={review.rating} size="md" />
          <SentimentBadge label={review.sentiment_label} score={review.sentiment_score} size="sm" />
        </div>
        <div className="ml-3 shrink-0">
          <SourceBadge source={review.source} url={review.review_url} size="sm" />
        </div>
      </div>
      <p className="text-[var(--text-secondary)] leading-relaxed">
        {review.text || 'No review text'}
      </p>
      <p className="text-sm text-[var(--text-muted)] mt-3 font-code">
        {formatDate(review.review_date || review.scraped_at)}
      </p>
    </div>
  );
}
