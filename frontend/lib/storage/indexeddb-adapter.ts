import type { StorageAdapter } from './adapter';
import type {
  Business,
  Review,
  ScrapeLog,
  AlertConfig,
  ApiKeyInfo,
  SentimentConfig,
  BusinessWithStats,
  SearchResult,
  ApiSearchResult,
  ChartData,
  CreateBusinessData,
  UpdateBusinessData,
  CreateAlertData,
  UpdateAlertData,
  ScrapeResult,
  SchedulerConfig,
} from './types';
import { db } from '../db/schema';
import { calculateReviewStats, getScrapeHealth } from '../utils/stats';
import { generateReviewsCsv } from '../utils/csv';
import { maskApiKey } from '../utils/format';
import {
  REVIEWS_PER_PAGE,
  CHART_MONTHS,
  SENTIMENT_RATING_WEIGHT,
  SENTIMENT_TEXT_WEIGHT,
  SENTIMENT_THRESHOLD,
  SCRAPE_INTERVAL_HOURS,
} from '../constants';

interface ScrapeApiReview {
  external_id: string;
  author_name?: string;
  rating?: number;
  text?: string;
  review_date?: string;
  review_url?: string;
}

interface ScrapeApiResponse {
  success?: boolean;
  reviews?: ScrapeApiReview[];
  error?: string;
}

interface SearchSourcesResponse {
  success?: boolean;
  results?: {
    trustpilot?: SearchResult[];
    bbb?: SearchResult[];
  };
  error?: string;
}

interface ApiSearchResponse {
  success?: boolean;
  results?: ApiSearchResult[];
  error?: string;
}

async function getStoredConfig(provider: string) {
  return db.apiConfigs.where('provider').equals(provider).first();
}

async function sendAlertEmail(
  email: string,
  businessName: string,
  reviews: Array<{
    author_name: string | null;
    rating: number | null;
    text: string | null;
    source: string;
    review_date: string | null;
      }>
    ): Promise<void> {
  const resendConfig = await getStoredConfig('resend');
  const fromEmailConfig = await getStoredConfig('resend_from_email');

  if (!resendConfig?.enabled || !resendConfig.api_key) {
    throw new Error('Resend API key is not configured.');
  }
  if (!fromEmailConfig?.enabled || !fromEmailConfig.api_key) {
    throw new Error('Resend sender email is not configured.');
  }

  const response = await fetch('/api/send_alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      business_name: businessName,
      reviews,
      api_key: resendConfig.api_key,
      from_email: fromEmailConfig.api_key,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `Send alert API returned ${response.status}`);
  }
}

export class IndexedDBAdapter implements StorageAdapter {
  // ─── Businesses ────────────────────────────────────────────────────────────

  async getBusinesses(): Promise<BusinessWithStats[]> {
    const businesses = await db.businesses.toArray();

    const results: BusinessWithStats[] = [];
    for (const biz of businesses) {
      const id = biz.id!;
      const reviews = (await db.reviews
        .where('business_id')
        .equals(id)
        .toArray()) as Review[];

      const scrapeLogs = (await db.scrapeLogs
        .where('business_id')
        .equals(id)
        .reverse()
        .sortBy('started_at')) as ScrapeLog[];

      const stats = calculateReviewStats(reviews);
      const health = getScrapeHealth(scrapeLogs);

      results.push({
        id,
        name: biz.name,
        address: biz.address,
        trustpilot_url: biz.trustpilot_url,
        bbb_url: biz.bbb_url,
        yelp_url: biz.yelp_url,
        google_place_id: biz.google_place_id,
        yelp_business_id: biz.yelp_business_id,
        created_at: biz.created_at,
        updated_at: biz.updated_at,
        total_reviews: stats.total,
        avg_rating: stats.avg_rating,
        positive_pct: stats.positive_pct,
        negative_pct: stats.negative_pct,
        trend_direction: stats.trend_direction,
        trend_delta: stats.trend_delta,
        recent_count: stats.recent_count,
        last_review_date: stats.last_review_date,
        recent_negative_count: stats.recent_negative_count,
        scrape_issues: health.has_issues,
        scrape_issue_sources: health.issue_sources,
        scrape_issue_type: health.issue_type,
      });
    }

    return results;
  }

  async getBusiness(id: number): Promise<Business | null> {
    const biz = await db.businesses.get(id);
    if (!biz) return null;
    return {
      id: biz.id!,
      name: biz.name,
      address: biz.address,
      trustpilot_url: biz.trustpilot_url,
      bbb_url: biz.bbb_url,
      yelp_url: biz.yelp_url,
      google_place_id: biz.google_place_id,
      yelp_business_id: biz.yelp_business_id,
      created_at: biz.created_at,
      updated_at: biz.updated_at,
    };
  }

  async createBusiness(
    data: CreateBusinessData
  ): Promise<{ business: Business; initial_scrape?: ScrapeResult | null }> {
    const now = new Date().toISOString();
    const id = await db.businesses.add({
      name: data.name,
      address: data.address ?? null,
      trustpilot_url: data.trustpilot_url ?? null,
      bbb_url: data.bbb_url ?? null,
      yelp_url: data.yelp_url ?? null,
      google_place_id: data.google_place_id ?? null,
      yelp_business_id: data.yelp_business_id ?? null,
      created_at: now,
      updated_at: now,
    });

    const business = (await this.getBusiness(id as number))!;

    const hasSources =
      data.trustpilot_url ||
      data.bbb_url ||
      data.yelp_url ||
      data.google_place_id ||
      data.yelp_business_id;

    let initial_scrape: ScrapeResult | null = null;
    if (hasSources) {
      try {
        initial_scrape = await this.triggerScrape(business.id);
      } catch {
        initial_scrape = null;
      }
    }

    return { business, initial_scrape };
  }

  async updateBusiness(id: number, data: UpdateBusinessData): Promise<void> {
    await db.businesses.update(id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  }

  async deleteBusiness(id: number): Promise<void> {
    await db.transaction(
      'rw',
      db.businesses,
      db.reviews,
      db.scrapeLogs,
      db.alertConfigs,
      async () => {
        await db.businesses.delete(id);
        await db.reviews.where('business_id').equals(id).delete();
        await db.scrapeLogs.where('business_id').equals(id).delete();
        await db.alertConfigs.where('business_id').equals(id).delete();
      }
    );
  }

  // ─── Reviews ───────────────────────────────────────────────────────────────

  async getReviews(
    businessId: number,
    opts?: { source?: string; sentiment?: string; page?: number; per_page?: number }
  ): Promise<{ reviews: Review[]; total: number; total_pages: number }> {
    const perPage = opts?.per_page ?? REVIEWS_PER_PAGE;
    const page = opts?.page ?? 1;

    const collection = db.reviews.where('business_id').equals(businessId);
    let all = (await collection.toArray()) as Review[];

    if (opts?.source) {
      all = all.filter((r) => r.source === opts.source);
    }
    if (opts?.sentiment) {
      all = all.filter((r) => r.sentiment_label === opts.sentiment);
    }

    // Sort by scraped_at descending
    all.sort(
      (a, b) =>
        new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime()
    );

    const total = all.length;
    const total_pages = Math.max(1, Math.ceil(total / perPage));
    const offset = (page - 1) * perPage;
    const reviews = all.slice(offset, offset + perPage);

    return { reviews, total, total_pages };
  }

  async getRecentReviews(businessId: number, limit = 5): Promise<Review[]> {
    const all = (await db.reviews
      .where('business_id')
      .equals(businessId)
      .toArray()) as Review[];

    all.sort(
      (a, b) =>
        new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime()
    );

    return all.slice(0, limit);
  }

  async getChartData(businessId: number): Promise<ChartData> {
    const all = (await db.reviews
      .where('business_id')
      .equals(businessId)
      .toArray()) as Review[];

    const now = new Date();
    const labels: string[] = [];
    const dataMap: Record<string, { sum: number; count: number }> = {};

    // Build last CHART_MONTHS month labels
    for (let i = CHART_MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      labels.push(key);
      dataMap[key] = { sum: 0, count: 0 };
    }

    for (const review of all) {
      if (review.rating === null) continue;
      const dateStr = review.review_date ?? review.scraped_at;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (dataMap[key]) {
        dataMap[key].sum += review.rating;
        dataMap[key].count += 1;
      }
    }

    const data = labels.map((label) => {
      const { sum, count } = dataMap[label];
      return count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
    });

    return { labels, data };
  }

  // ─── Scraping ──────────────────────────────────────────────────────────────

  async triggerScrape(businessId: number): Promise<ScrapeResult> {
    const biz = await this.getBusiness(businessId);
    if (!biz) {
      return { success: false, new_reviews: 0, failed_sources: [] };
    }

    // Gather configured sources
    const sources: Array<{ source: string; url: string; api_key?: string }> = [];

    if (biz.trustpilot_url) {
      sources.push({ source: 'trustpilot', url: biz.trustpilot_url });
    }
    if (biz.bbb_url) {
      sources.push({ source: 'bbb', url: biz.bbb_url });
    }
    if (biz.yelp_url) {
      sources.push({ source: 'yelp', url: biz.yelp_url });
    }
    if (biz.google_place_id) {
      const googleConfig = await getStoredConfig('google_places');
      const apiKey = googleConfig?.enabled ? googleConfig.api_key : undefined;
      sources.push({ source: 'google_places', url: biz.google_place_id, api_key: apiKey });
    }
    if (biz.yelp_business_id) {
      const yelpConfig = await getStoredConfig('yelp_fusion');
      const apiKey = yelpConfig?.enabled ? yelpConfig.api_key : undefined;
      sources.push({ source: 'yelp_api', url: biz.yelp_business_id, api_key: apiKey });
    }

    let totalNew = 0;
    const failedSources: string[] = [];
    const alertConfigs = (await this.getAlerts(businessId)).filter((config) => config.enabled);
    const pendingAlerts = new Map<
      string,
      Array<{
        author_name: string | null;
        rating: number | null;
        text: string | null;
        source: string;
        review_date: string | null;
      }>
    >();

    for (const s of sources) {
      const startedAt = new Date().toISOString();
      let status = 'success';
      let reviewsFound = 0;
      let errorMessage: string | null = null;

      try {
        const requestBody: Record<string, string> = { source: s.source, url: s.url };
        if (s.api_key) requestBody.api_key = s.api_key;

        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          throw new Error(`Scrape API returned ${res.status}`);
        }

        const scrapePayload = (await res.json()) as ScrapeApiResponse | ScrapeApiReview[];
        const scraped = Array.isArray(scrapePayload) ? scrapePayload : scrapePayload.reviews ?? [];

        for (const raw of scraped) {
          // Deduplicate via compound index [source+external_id]
          const existing = await db.reviews
            .where('[source+external_id]')
            .equals([s.source, raw.external_id])
            .first();

          if (existing) continue;

          // Get sentiment
          let sentimentScore: number | null = null;
          let sentimentLabel: string | null = null;

          try {
            const sentRes = await fetch('/api/sentiment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: raw.text ?? '',
                rating: raw.rating ?? null,
              }),
            });
            if (sentRes.ok) {
              const sentData: { score: number; label: string } = await sentRes.json();
              sentimentScore = sentData.score;
              sentimentLabel = sentData.label;
            }
          } catch {
            // Leave sentiment null if the call fails
          }

          await db.reviews.add({
            business_id: businessId,
            source: s.source,
            external_id: raw.external_id,
            review_url: raw.review_url ?? null,
            author_name: raw.author_name ?? null,
            rating: raw.rating ?? null,
            text: raw.text ?? null,
            review_date: raw.review_date ?? null,
            sentiment_score: sentimentScore,
            sentiment_label: sentimentLabel,
            scraped_at: new Date().toISOString(),
          });

          totalNew += 1;
          reviewsFound += 1;

          for (const config of alertConfigs) {
            const matchesThreshold =
              raw.rating != null && raw.rating <= config.negative_threshold;
            const matchesSentiment = sentimentLabel === 'negative';
            if (!matchesThreshold && !matchesSentiment) continue;

            const bucket = pendingAlerts.get(config.email) ?? [];
            bucket.push({
              author_name: raw.author_name ?? null,
              rating: raw.rating ?? null,
              text: raw.text ?? null,
              source: s.source,
              review_date: raw.review_date ?? null,
            });
            pendingAlerts.set(config.email, bucket);
          }
        }
      } catch (err) {
        status = 'failed';
        failedSources.push(s.source);
        errorMessage = err instanceof Error ? err.message : String(err);
      }

      await db.scrapeLogs.add({
        business_id: businessId,
        source: s.source,
        status,
        reviews_found: reviewsFound,
        error_message: errorMessage,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
      });
    }

    for (const [email, reviews] of pendingAlerts.entries()) {
      try {
        await sendAlertEmail(email, biz.name, reviews);
      } catch (err) {
        console.error('Failed to send alert email:', err);
      }
    }

    return {
      success: failedSources.length < sources.length,
      new_reviews: totalNew,
      failed_sources: failedSources.length > 0 ? failedSources : null,
    };
  }

  async getScrapeHistory(businessId: number, limit = 20): Promise<ScrapeLog[]> {
    const logs = (await db.scrapeLogs
      .where('business_id')
      .equals(businessId)
      .reverse()
      .sortBy('started_at')) as ScrapeLog[];

    return logs.slice(0, limit);
  }

  // ─── Alerts ────────────────────────────────────────────────────────────────

  async getAlerts(businessId: number): Promise<AlertConfig[]> {
    const rows = await db.alertConfigs
      .where('business_id')
      .equals(businessId)
      .toArray();

    return rows.map((r) => ({
      id: r.id!,
      business_id: r.business_id,
      email: r.email,
      alert_on_negative: r.alert_on_negative,
      negative_threshold: r.negative_threshold,
      enabled: r.enabled,
    }));
  }

  async createAlert(businessId: number, data: CreateAlertData): Promise<AlertConfig> {
    // Check for duplicate email per business
    const existing = await db.alertConfigs
      .where('business_id')
      .equals(businessId)
      .filter((a) => a.email === data.email)
      .first();

    if (existing) {
      throw new Error(`An alert for ${data.email} already exists for this business.`);
    }

    const id = await db.alertConfigs.add({
      business_id: businessId,
      email: data.email,
      alert_on_negative: true,
      negative_threshold: data.negative_threshold ?? 0.3,
      enabled: data.enabled ?? true,
    });

    return (await this.getAlerts(businessId)).find((a) => a.id === (id as number))!;
  }

  async updateAlert(alertId: number, data: UpdateAlertData): Promise<void> {
    await db.alertConfigs.update(alertId, data);
  }

  async deleteAlert(alertId: number): Promise<void> {
    await db.alertConfigs.delete(alertId);
  }

  // ─── Settings ──────────────────────────────────────────────────────────────

  async getApiKeys(): Promise<Record<string, ApiKeyInfo>> {
    const configs = await db.apiConfigs.toArray();
    const result: Record<string, ApiKeyInfo> = {};

    for (const config of configs) {
      result[config.provider] = {
        provider: config.provider,
        enabled: config.enabled,
        key_preview:
          config.provider === 'resend_from_email' ? config.api_key : maskApiKey(config.api_key),
      };
    }

    return result;
  }

  async saveApiKey(provider: string, apiKey: string): Promise<ApiKeyInfo> {
    const now = new Date().toISOString();
    const existing = await db.apiConfigs
      .where('provider')
      .equals(provider)
      .first();

    if (existing) {
      await db.apiConfigs.update(existing.id!, {
        api_key: apiKey,
        enabled: true,
        updated_at: now,
      });
    } else {
      await db.apiConfigs.add({
        provider,
        api_key: apiKey,
        enabled: true,
        created_at: now,
        updated_at: now,
      });
    }

    return {
      provider,
      enabled: true,
      key_preview: maskApiKey(apiKey),
    };
  }

  async deleteApiKey(provider: string): Promise<void> {
    const existing = await db.apiConfigs
      .where('provider')
      .equals(provider)
      .first();

    if (existing) {
      await db.apiConfigs.delete(existing.id!);
    }
  }

  async toggleApiKey(provider: string): Promise<boolean> {
    const existing = await db.apiConfigs
      .where('provider')
      .equals(provider)
      .first();

    if (!existing) {
      throw new Error(`No API key found for provider: ${provider}`);
    }

    const newEnabled = !existing.enabled;
    await db.apiConfigs.update(existing.id!, {
      enabled: newEnabled,
      updated_at: new Date().toISOString(),
    });

    return newEnabled;
  }

  async getSentimentConfig(): Promise<SentimentConfig> {
    const config = await db.sentimentConfig.toCollection().first();
    if (config) {
      return {
        rating_weight: config.rating_weight,
        text_weight: config.text_weight,
        threshold: config.threshold,
      };
    }
    return {
      rating_weight: SENTIMENT_RATING_WEIGHT,
      text_weight: SENTIMENT_TEXT_WEIGHT,
      threshold: SENTIMENT_THRESHOLD,
    };
  }

  async saveSentimentConfig(config: SentimentConfig): Promise<SentimentConfig> {
    const existing = await db.sentimentConfig.toCollection().first();
    const now = new Date().toISOString();

    if (existing) {
      await db.sentimentConfig.update(existing.id!, {
        rating_weight: config.rating_weight,
        text_weight: config.text_weight,
        threshold: config.threshold,
        updated_at: now,
      });
    } else {
      await db.sentimentConfig.add({
        rating_weight: config.rating_weight,
        text_weight: config.text_weight,
        threshold: config.threshold,
        updated_at: now,
      });
    }

    return config;
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  async searchSources(
    query: string,
    location?: string | null
  ): Promise<{ trustpilot: SearchResult[]; bbb: SearchResult[] }> {
    const res = await fetch('/api/search_sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, location: location ?? null }),
    });

    if (!res.ok) {
      throw new Error(`Search sources API returned ${res.status}`);
    }

    const payload = (await res.json()) as SearchSourcesResponse;
    return {
      trustpilot: payload.results?.trustpilot ?? [],
      bbb: payload.results?.bbb ?? [],
    };
  }

  async searchGooglePlaces(
    query: string,
    location?: string | null
  ): Promise<ApiSearchResult[]> {
    const googleConfig = await getStoredConfig('google_places');

    const apiKey = googleConfig?.enabled ? googleConfig.api_key : undefined;

    const res = await fetch('/api/search_google_places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, location: location ?? null, api_key: apiKey }),
    });

    if (!res.ok) {
      throw new Error(`Google Places search API returned ${res.status}`);
    }

    const payload = (await res.json()) as ApiSearchResponse;
    return payload.results ?? [];
  }

  async searchYelp(
    query: string,
    location?: string | null
  ): Promise<ApiSearchResult[]> {
    const yelpConfig = await getStoredConfig('yelp_fusion');

    const apiKey = yelpConfig?.enabled ? yelpConfig.api_key : undefined;

    const res = await fetch('/api/search_yelp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, location: location ?? null, api_key: apiKey }),
    });

    if (!res.ok) {
      throw new Error(`Yelp search API returned ${res.status}`);
    }

    const payload = (await res.json()) as ApiSearchResponse;
    return payload.results ?? [];
  }

  // ─── CSV export ────────────────────────────────────────────────────────────

  async exportReviewsCsv(
    businessId: number,
    opts?: { source?: string; sentiment?: string }
  ): Promise<string> {
    const { reviews } = await this.getReviews(businessId, {
      source: opts?.source,
      sentiment: opts?.sentiment,
      page: 1,
      per_page: 100000,
    });

    return generateReviewsCsv(reviews);
  }

  // ─── Scheduler ─────────────────────────────────────────────────────────────

  async getSchedulerConfig(): Promise<SchedulerConfig> {
    const config = await db.schedulerConfig.toCollection().first();
    if (config) {
      return {
        interval_hours: config.interval_hours,
        last_run: config.last_run,
      };
    }
    return {
      interval_hours: SCRAPE_INTERVAL_HOURS,
      last_run: null,
    };
  }

  async saveSchedulerConfig(config: SchedulerConfig): Promise<void> {
    const existing = await db.schedulerConfig.toCollection().first();

    if (existing) {
      await db.schedulerConfig.update(existing.id!, {
        interval_hours: config.interval_hours,
        last_run: config.last_run,
      });
    } else {
      await db.schedulerConfig.add({
        interval_hours: config.interval_hours,
        last_run: config.last_run,
      });
    }
  }
}
