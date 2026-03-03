import Dexie, { type EntityTable } from 'dexie';

interface DBBusiness {
  id?: number;
  name: string;
  address: string | null;
  trustpilot_url: string | null;
  bbb_url: string | null;
  yelp_url: string | null;
  google_place_id: string | null;
  yelp_business_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DBReview {
  id?: number;
  business_id: number;
  source: string;
  external_id: string;
  review_url: string | null;
  author_name: string | null;
  rating: number | null;
  text: string | null;
  review_date: string | null;
  sentiment_score: number | null;
  sentiment_label: string | null;
  scraped_at: string;
}

interface DBScrapeLog {
  id?: number;
  business_id: number;
  source: string;
  status: string;
  reviews_found: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

interface DBAlertConfig {
  id?: number;
  business_id: number;
  email: string;
  alert_on_negative: boolean;
  negative_threshold: number;
  enabled: boolean;
}

interface DBApiConfig {
  id?: number;
  provider: string;
  api_key: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface DBSentimentConfig {
  id?: number;
  rating_weight: number;
  text_weight: number;
  threshold: number;
  updated_at: string;
}

interface DBSchedulerConfig {
  id?: number;
  interval_hours: number;
  last_run: string | null;
}

class ReviewHoundDB extends Dexie {
  businesses!: EntityTable<DBBusiness, 'id'>;
  reviews!: EntityTable<DBReview, 'id'>;
  scrapeLogs!: EntityTable<DBScrapeLog, 'id'>;
  alertConfigs!: EntityTable<DBAlertConfig, 'id'>;
  apiConfigs!: EntityTable<DBApiConfig, 'id'>;
  sentimentConfig!: EntityTable<DBSentimentConfig, 'id'>;
  schedulerConfig!: EntityTable<DBSchedulerConfig, 'id'>;

  constructor() {
    super('reviewhound');
    this.version(1).stores({
      businesses: '++id, name',
      reviews: '++id, business_id, source, [source+external_id], sentiment_label, scraped_at',
      scrapeLogs: '++id, business_id, source, started_at',
      alertConfigs: '++id, business_id, email',
      apiConfigs: '++id, &provider',
      sentimentConfig: '++id',
      schedulerConfig: '++id',
    });
  }
}

export const db = new ReviewHoundDB();
export type {
  DBBusiness,
  DBReview,
  DBScrapeLog,
  DBAlertConfig,
  DBApiConfig,
  DBSentimentConfig,
  DBSchedulerConfig,
};
