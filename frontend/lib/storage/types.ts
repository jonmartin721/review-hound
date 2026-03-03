export interface Business {
  id: number;
  name: string;
  address: string | null;
  trustpilot_url: string | null;
  bbb_url: string | null;
  yelp_url: string | null;
  google_place_id: string | null;
  yelp_business_id: string | null;
  created_at: string; // ISO date string
  updated_at: string;
}

export interface Review {
  id: number;
  business_id: number;
  source: string;
  external_id: string;
  review_url: string | null;
  author_name: string | null;
  rating: number | null;
  text: string | null;
  review_date: string | null; // ISO date string
  sentiment_score: number | null;
  sentiment_label: string | null;
  scraped_at: string;
}

export interface ScrapeLog {
  id: number;
  business_id: number;
  source: string;
  status: string; // 'running' | 'success' | 'failed'
  reviews_found: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface AlertConfig {
  id: number;
  business_id: number;
  email: string;
  alert_on_negative: boolean;
  negative_threshold: number;
  enabled: boolean;
}

export interface ApiKeyInfo {
  provider: string; // 'google_places' | 'yelp_fusion'
  enabled: boolean;
  key_preview: string;
}

export interface SentimentConfig {
  rating_weight: number;
  text_weight: number;
  threshold: number;
}

export interface BusinessWithStats extends Business {
  total_reviews: number;
  avg_rating: number;
  positive_pct: number;
  negative_pct: number;
  trend_direction: 'up' | 'down' | 'stable' | null;
  trend_delta: number;
  recent_count: number;
  last_review_date: string | null;
  recent_negative_count: number;
  scrape_issues: boolean;
  scrape_issue_sources: string[];
  scrape_issue_type: 'failed' | 'no_reviews' | null;
}

export interface SearchResult {
  name: string;
  url: string;
  address?: string;
  rating?: number;
  review_count?: number;
}

export interface ApiSearchResult {
  name: string;
  address?: string;
  rating?: number;
  review_count?: number;
  place_id?: string;
  business_id?: string;
}

export interface ChartData {
  labels: string[];
  data: number[];
}

export interface CreateBusinessData {
  name: string;
  address?: string | null;
  trustpilot_url?: string | null;
  bbb_url?: string | null;
  yelp_url?: string | null;
  google_place_id?: string | null;
  yelp_business_id?: string | null;
}

export interface UpdateBusinessData extends Partial<CreateBusinessData> {}

export interface CreateAlertData {
  email: string;
  negative_threshold?: number;
  enabled?: boolean;
}

export interface UpdateAlertData {
  email?: string;
  negative_threshold?: number;
  enabled?: boolean;
}

export interface ScrapeResult {
  success: boolean;
  new_reviews: number;
  failed_sources?: string[] | null;
}

export interface SchedulerConfig {
  interval_hours: number;
  last_run: string | null; // ISO date string
}
