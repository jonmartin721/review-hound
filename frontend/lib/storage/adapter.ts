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

export interface StorageAdapter {
  // Businesses
  getBusinesses(): Promise<BusinessWithStats[]>;
  getBusiness(id: number): Promise<Business | null>;
  createBusiness(data: CreateBusinessData): Promise<{ business: Business; initial_scrape?: ScrapeResult | null }>;
  updateBusiness(id: number, data: UpdateBusinessData): Promise<void>;
  deleteBusiness(id: number): Promise<void>;

  // Reviews
  getReviews(
    businessId: number,
    opts?: { source?: string; sentiment?: string; page?: number; per_page?: number }
  ): Promise<{ reviews: Review[]; total: number; total_pages: number }>;
  getRecentReviews(businessId: number, limit?: number): Promise<Review[]>;
  getChartData(businessId: number): Promise<ChartData>;

  // Scraping
  triggerScrape(businessId: number): Promise<ScrapeResult>;
  getScrapeHistory(businessId: number, limit?: number): Promise<ScrapeLog[]>;

  // Alerts
  getAlerts(businessId: number): Promise<AlertConfig[]>;
  createAlert(businessId: number, data: CreateAlertData): Promise<AlertConfig>;
  updateAlert(alertId: number, data: UpdateAlertData): Promise<void>;
  deleteAlert(alertId: number): Promise<void>;

  // Settings
  getApiKeys(): Promise<Record<string, ApiKeyInfo>>;
  saveApiKey(provider: string, apiKey: string): Promise<ApiKeyInfo>;
  deleteApiKey(provider: string): Promise<void>;
  toggleApiKey(provider: string): Promise<boolean>;
  getSentimentConfig(): Promise<SentimentConfig>;
  saveSentimentConfig(config: SentimentConfig): Promise<SentimentConfig>;

  // Search
  searchSources(
    query: string,
    location?: string | null
  ): Promise<{ trustpilot: SearchResult[]; bbb: SearchResult[] }>;
  searchGooglePlaces(query: string, location?: string | null): Promise<ApiSearchResult[]>;
  searchYelp(query: string, location?: string | null): Promise<ApiSearchResult[]>;

  // CSV export
  exportReviewsCsv(
    businessId: number,
    opts?: { source?: string; sentiment?: string }
  ): Promise<string>;

  // Scheduler (demo mode only, no-op in API mode)
  getSchedulerConfig(): Promise<SchedulerConfig>;
  saveSchedulerConfig(config: SchedulerConfig): Promise<void>;
}
