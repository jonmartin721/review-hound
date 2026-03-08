import { describe, expect, it } from 'vitest';
import type { Review, ScrapeLog } from '../storage/types';
import { calculateReviewStats, getScrapeHealth } from './stats';

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function buildReview(overrides: Partial<Review>): Review {
  return {
    id: overrides.id ?? 1,
    business_id: overrides.business_id ?? 1,
    source: overrides.source ?? 'trustpilot',
    external_id: overrides.external_id ?? `review-${overrides.id ?? 1}`,
    review_url: overrides.review_url ?? null,
    author_name: overrides.author_name ?? 'Reviewer',
    rating: overrides.rating ?? 5,
    text: overrides.text ?? 'Great service',
    review_date: overrides.review_date ?? null,
    sentiment_score: overrides.sentiment_score ?? 0.9,
    sentiment_label: overrides.sentiment_label ?? 'positive',
    scraped_at: overrides.scraped_at ?? daysAgo(1),
  };
}

function buildLog(overrides: Partial<ScrapeLog>): ScrapeLog {
  return {
    id: overrides.id ?? 1,
    business_id: overrides.business_id ?? 1,
    source: overrides.source ?? 'trustpilot',
    status: overrides.status ?? 'success',
    reviews_found: overrides.reviews_found ?? 0,
    error_message: overrides.error_message ?? null,
    started_at: overrides.started_at ?? daysAgo(1),
    completed_at: overrides.completed_at ?? daysAgo(1),
  };
}

describe('calculateReviewStats', () => {
  it('calculates percentages, recent activity, and an upward trend', () => {
    const reviews = [
      buildReview({ id: 1, rating: 5, sentiment_label: 'positive', review_date: daysAgo(2).split('T')[0] }),
      buildReview({ id: 2, source: 'bbb', rating: 4, sentiment_label: 'positive', review_date: daysAgo(10).split('T')[0] }),
      buildReview({ id: 3, source: 'yelp', rating: 2, sentiment_label: 'negative', review_date: daysAgo(45).split('T')[0], sentiment_score: -0.8 }),
      buildReview({ id: 4, source: 'yelp', rating: 3, sentiment_label: 'neutral', review_date: daysAgo(50).split('T')[0], sentiment_score: 0 }),
    ];

    const stats = calculateReviewStats(reviews);

    expect(stats.total).toBe(4);
    expect(stats.avg_rating).toBe(3.5);
    expect(stats.positive_pct).toBe(50);
    expect(stats.negative_pct).toBe(25);
    expect(stats.neutral_pct).toBe(25);
    expect(stats.by_source).toEqual({ trustpilot: 1, bbb: 1, yelp: 2 });
    expect(stats.recent_count).toBe(1);
    expect(stats.recent_negative_count).toBe(0);
    expect(stats.trend_direction).toBe('up');
    expect(stats.trend_delta).toBeGreaterThan(1);
    expect(stats.last_review_date).toBeTruthy();
  });

  it('returns an empty stats object for no reviews', () => {
    expect(calculateReviewStats([])).toEqual({
      total: 0,
      avg_rating: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      positive_pct: 0,
      negative_pct: 0,
      neutral_pct: 0,
      by_source: {},
      trend_direction: null,
      trend_delta: 0,
      recent_count: 0,
      last_review_date: null,
      recent_negative_count: 0,
    });
  });
});

describe('getScrapeHealth', () => {
  it('flags repeated source failures ahead of no-review warnings', () => {
    const logs = [
      buildLog({ id: 1, source: 'bbb', status: 'failed' }),
      buildLog({ id: 2, source: 'bbb', status: 'failed', started_at: daysAgo(3) }),
      buildLog({ id: 3, source: 'trustpilot', status: 'success', reviews_found: 0, started_at: daysAgo(1) }),
      buildLog({ id: 4, source: 'trustpilot', status: 'success', reviews_found: 0, started_at: daysAgo(6) }),
    ];

    expect(getScrapeHealth(logs)).toEqual({
      has_issues: true,
      issue_sources: ['bbb', 'trustpilot'],
      issue_type: 'failed',
    });
  });
});
