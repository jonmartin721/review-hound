import { Card, CardContent } from '@/components/ui/card';
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
    <Card>
      <CardContent>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-foreground">
              {review.author_name || 'Anonymous'}
            </span>
            <RatingStars rating={review.rating} size="md" />
            <SentimentBadge label={review.sentiment_label} score={review.sentiment_score} size="sm" />
          </div>
          <div className="ml-3 shrink-0">
            <SourceBadge source={review.source} url={review.review_url} size="sm" />
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {review.text || 'No review text'}
        </p>
        <p className="text-sm text-muted-foreground mt-3 font-mono">
          {formatDate(review.review_date || review.scraped_at)}
        </p>
      </CardContent>
    </Card>
  );
}
