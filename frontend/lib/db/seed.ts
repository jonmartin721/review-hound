import {
  SAMPLE_ALERT_CONFIGS,
  SAMPLE_API_CONFIGS,
  SAMPLE_BUSINESSES,
  SAMPLE_REVIEWS,
  SAMPLE_SCRAPE_LOGS,
} from '../demo/sample-mode';
import { getWorkspaceMode } from '../portfolio';
import { db } from './schema';

export async function seedDemoData(): Promise<void> {
  const count = await db.businesses.count();
  if (count > 0 || getWorkspaceMode() !== 'sample') return;

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  const hoursAgo = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000);
  const businessIds = new Map<string, number>();

  for (const business of SAMPLE_BUSINESSES) {
    const id = await db.businesses.add({
      name: business.name,
      address: business.address,
      trustpilot_url: business.trustpilot_url,
      bbb_url: business.bbb_url,
      yelp_url: business.yelp_url,
      google_place_id: business.google_place_id,
      yelp_business_id: business.yelp_business_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    businessIds.set(business.key, id as number);
  }

  for (const review of SAMPLE_REVIEWS) {
    const businessId = businessIds.get(review.businessKey);
    if (!businessId) continue;

    const reviewDate = daysAgo(review.days_ago);
    await db.reviews.add({
      business_id: businessId,
      source: review.source,
      external_id: review.external_id,
      review_url: null,
      author_name: review.author_name,
      rating: review.rating,
      text: review.text,
      review_date: reviewDate.toISOString().split('T')[0],
      sentiment_score: review.sentiment_score,
      sentiment_label: review.sentiment_label,
      scraped_at: reviewDate.toISOString(),
    });
  }

  for (const log of SAMPLE_SCRAPE_LOGS) {
    const businessId = businessIds.get(log.businessKey);
    if (!businessId) continue;

    const started = daysAgo(log.days_ago_started);
    await db.scrapeLogs.add({
      business_id: businessId,
      source: log.source,
      status: log.status,
      reviews_found: log.reviews_found,
      error_message: log.error_message ?? null,
      started_at: started.toISOString(),
      completed_at: new Date(started.getTime() + 6000).toISOString(),
    });
  }

  for (const config of SAMPLE_ALERT_CONFIGS) {
    const businessId = businessIds.get(config.businessKey);
    if (!businessId) continue;

    await db.alertConfigs.add({
      business_id: businessId,
      email: config.email,
      alert_on_negative: config.alert_on_negative,
      negative_threshold: config.negative_threshold,
      enabled: config.enabled,
    });
  }

  for (const config of SAMPLE_API_CONFIGS) {
    await db.apiConfigs.add({
      provider: config.provider,
      api_key: config.api_key,
      enabled: config.enabled,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  await db.sentimentConfig.add({
    rating_weight: 0.65,
    text_weight: 0.35,
    threshold: 0.12,
    updated_at: new Date().toISOString(),
  });

  await db.schedulerConfig.add({
    interval_hours: 6,
    last_run: hoursAgo(2).toISOString(),
  });
}
