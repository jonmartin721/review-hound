import type { Review, ScrapeLog } from '../storage/types';

interface ReviewStats {
  total: number;
  avg_rating: number;
  positive: number;
  negative: number;
  neutral: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  by_source: Record<string, number>;
  trend_direction: 'up' | 'down' | 'stable' | null;
  trend_delta: number;
  recent_count: number;
  last_review_date: string | null;
  recent_negative_count: number;
}

interface ScrapeHealth {
  has_issues: boolean;
  issue_sources: string[];
  issue_type: 'failed' | 'no_reviews' | null;
}

const TREND_STABILITY_THRESHOLD = 0.1;

function normalizeReviewDate(review: Review): Date {
  if (review.review_date) {
    return new Date(review.review_date);
  }
  return new Date(review.scraped_at);
}

export function calculateReviewStats(reviews: Review[]): ReviewStats {
  const total = reviews.length;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  if (total === 0) {
    return {
      total: 0, avg_rating: 0, positive: 0, negative: 0, neutral: 0,
      positive_pct: 0, negative_pct: 0, neutral_pct: 0, by_source: {},
      trend_direction: null, trend_delta: 0, recent_count: 0,
      last_review_date: null, recent_negative_count: 0,
    };
  }

  const ratedReviews = reviews.filter(r => r.rating !== null);
  const avgRating = ratedReviews.length > 0
    ? ratedReviews.reduce((sum, r) => sum + r.rating!, 0) / ratedReviews.length
    : 0;

  const positive = reviews.filter(r => r.sentiment_label === 'positive').length;
  const negative = reviews.filter(r => r.sentiment_label === 'negative').length;
  const neutral = reviews.filter(r => r.sentiment_label === 'neutral').length;

  const bySource: Record<string, number> = {};
  for (const r of reviews) {
    bySource[r.source] = (bySource[r.source] || 0) + 1;
  }

  // Trend: compare last 30 days vs previous 30 days
  const recentRated = ratedReviews.filter(r => normalizeReviewDate(r) >= thirtyDaysAgo);
  const previousRated = ratedReviews.filter(r => {
    const d = normalizeReviewDate(r);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  });

  let trendDirection: 'up' | 'down' | 'stable' | null = null;
  let trendDelta = 0;
  if (recentRated.length > 0 && previousRated.length > 0) {
    const recentAvg = recentRated.reduce((s, r) => s + r.rating!, 0) / recentRated.length;
    const previousAvg = previousRated.reduce((s, r) => s + r.rating!, 0) / previousRated.length;
    trendDelta = recentAvg - previousAvg;
    if (trendDelta > TREND_STABILITY_THRESHOLD) trendDirection = 'up';
    else if (trendDelta < -TREND_STABILITY_THRESHOLD) trendDirection = 'down';
    else trendDirection = 'stable';
  }

  const recentReviews = reviews.filter(r => normalizeReviewDate(r) >= sevenDaysAgo);
  const recentCount = recentReviews.length;
  const lastReviewDate = reviews.length > 0
    ? reviews.reduce((latest, r) => {
        const d = normalizeReviewDate(r);
        return d > latest ? d : latest;
      }, new Date(0)).toISOString()
    : null;
  const recentNegativeCount = recentReviews.filter(r => r.sentiment_label === 'negative').length;

  return {
    total, avg_rating: avgRating, positive, negative, neutral,
    positive_pct: total > 0 ? (positive / total) * 100 : 0,
    negative_pct: total > 0 ? (negative / total) * 100 : 0,
    neutral_pct: total > 0 ? (neutral / total) * 100 : 0,
    by_source: bySource, trend_direction: trendDirection, trend_delta: trendDelta,
    recent_count: recentCount, last_review_date: lastReviewDate,
    recent_negative_count: recentNegativeCount,
  };
}

export function getScrapeHealth(logs: ScrapeLog[]): ScrapeHealth {
  if (logs.length === 0) {
    return { has_issues: false, issue_sources: [], issue_type: null };
  }

  // Group by source, ordered by started_at desc (assume already sorted)
  const bySource: Record<string, ScrapeLog[]> = {};
  for (const log of logs) {
    if (!bySource[log.source]) bySource[log.source] = [];
    bySource[log.source].push(log);
  }

  const issueSources: string[] = [];
  let issueType: 'failed' | 'no_reviews' | null = null;

  for (const [source, sourceLogs] of Object.entries(bySource)) {
    const recent = sourceLogs.slice(0, 3);
    const recentFailures = recent.filter(l => l.status === 'failed').length;
    if (recentFailures >= 2) {
      issueSources.push(source);
      issueType = 'failed';
      continue;
    }

    const successful = sourceLogs.filter(l => l.status === 'success');
    if (successful.length > 0) {
      const totalEverFound = successful.reduce((sum, l) => sum + (l.reviews_found || 0), 0);
      if (totalEverFound === 0) {
        issueSources.push(source);
        if (issueType !== 'failed') issueType = 'no_reviews';
      }
    }
  }

  return { has_issues: issueSources.length > 0, issue_sources: issueSources, issue_type: issueType };
}
