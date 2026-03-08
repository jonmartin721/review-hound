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
import { SCRAPE_INTERVAL_HOURS } from '../constants';

export class APIAdapter implements StorageAdapter {
  // ─── Businesses ────────────────────────────────────────────────────────────

  async getBusinesses(): Promise<BusinessWithStats[]> {
    const res = await fetch('/api/businesses');
    if (!res.ok) {
      throw new Error(`GET /api/businesses returned ${res.status}`);
    }
    const data: { success: boolean; businesses: BusinessWithStats[] } = await res.json();
    return data.businesses;
  }

  async getBusiness(id: number): Promise<Business | null> {
    const res = await fetch(`/api/business/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`GET /api/business/${id} returned ${res.status}`);
    }
    const data: { success: boolean; business: Business } = await res.json();
    return data.business;
  }

  async createBusiness(
    data: CreateBusinessData
  ): Promise<{ business: Business; initial_scrape?: ScrapeResult | null }> {
    const res = await fetch('/api/business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `POST /api/business returned ${res.status}`);
    }
    const result: { success: boolean; business: { id: number; name: string }; initial_scrape?: ScrapeResult | null } =
      await res.json();

    // Fetch the full business object
    const business = await this.getBusiness(result.business.id);
    if (!business) {
      throw new Error('Business was created but could not be retrieved');
    }

    return { business, initial_scrape: result.initial_scrape ?? null };
  }

  async updateBusiness(id: number, data: UpdateBusinessData): Promise<void> {
    const res = await fetch(`/api/business/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `PUT /api/business/${id} returned ${res.status}`);
    }
  }

  async deleteBusiness(id: number): Promise<void> {
    const res = await fetch(`/api/business/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `DELETE /api/business/${id} returned ${res.status}`);
    }
  }

  // ─── Reviews ───────────────────────────────────────────────────────────────

  async getReviews(
    businessId: number,
    opts?: { source?: string; sentiment?: string; page?: number; per_page?: number }
  ): Promise<{ reviews: Review[]; total: number; total_pages: number }> {
    const params = new URLSearchParams();
    if (opts?.page) params.set('page', String(opts.page));
    if (opts?.per_page) params.set('per_page', String(opts.per_page));
    if (opts?.source) params.set('source', opts.source);
    if (opts?.sentiment) params.set('sentiment', opts.sentiment);

    const qs = params.toString();
    const url = `/api/business/${businessId}/reviews${qs ? `?${qs}` : ''}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`GET ${url} returned ${res.status}`);
    }
    const data: { success: boolean; reviews: Review[]; total: number; total_pages: number } = await res.json();
    return { reviews: data.reviews, total: data.total, total_pages: data.total_pages };
  }

  async getRecentReviews(businessId: number, limit = 5): Promise<Review[]> {
    const { reviews } = await this.getReviews(businessId, { page: 1, per_page: limit });
    return reviews;
  }

  async getChartData(businessId: number): Promise<ChartData> {
    const res = await fetch(`/api/business/${businessId}/stats`);
    if (!res.ok) {
      throw new Error(`GET /api/business/${businessId}/stats returned ${res.status}`);
    }
    const data: { labels: string[]; data: number[] } = await res.json();
    return data;
  }

  // ─── Scraping ──────────────────────────────────────────────────────────────

  async triggerScrape(businessId: number): Promise<ScrapeResult> {
    const res = await fetch(`/business/${businessId}/scrape`, { method: 'POST' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string }).error ?? `/business/${businessId}/scrape returned ${res.status}`
      );
    }
    const data: { success: boolean; new_reviews: number; failed_sources?: string[] | null } = await res.json();
    return {
      success: data.success,
      new_reviews: data.new_reviews,
      failed_sources: data.failed_sources ?? null,
    };
  }

  async getScrapeHistory(businessId: number, limit = 10): Promise<ScrapeLog[]> {
    const res = await fetch(`/api/business/${businessId}/scrape-logs?limit=${limit}`);
    if (!res.ok) {
      throw new Error(`GET /api/business/${businessId}/scrape-logs returned ${res.status}`);
    }
    const data: { success: boolean; logs: ScrapeLog[] } = await res.json();
    return data.logs;
  }

  // ─── Alerts ────────────────────────────────────────────────────────────────

  async getAlerts(businessId: number): Promise<AlertConfig[]> {
    const res = await fetch(`/api/business/${businessId}/alerts`);
    if (!res.ok) {
      throw new Error(`GET /api/business/${businessId}/alerts returned ${res.status}`);
    }
    const data: { success: boolean; alerts: AlertConfig[] } = await res.json();
    return data.alerts;
  }

  async createAlert(businessId: number, data: CreateAlertData): Promise<AlertConfig> {
    const res = await fetch(`/api/business/${businessId}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string }).error ?? `POST /api/business/${businessId}/alerts returned ${res.status}`
      );
    }
    const result: { success: boolean; alert: AlertConfig } = await res.json();
    return result.alert;
  }

  async updateAlert(alertId: number, data: UpdateAlertData): Promise<void> {
    const res = await fetch(`/api/alerts/${alertId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `PUT /api/alerts/${alertId} returned ${res.status}`);
    }
  }

  async deleteAlert(alertId: number): Promise<void> {
    const res = await fetch(`/api/alerts/${alertId}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `DELETE /api/alerts/${alertId} returned ${res.status}`);
    }
  }

  // ─── Settings ──────────────────────────────────────────────────────────────

  async getApiKeys(): Promise<Record<string, ApiKeyInfo>> {
    const res = await fetch('/api/settings/api-keys');
    if (!res.ok) {
      throw new Error(`GET /api/settings/api-keys returned ${res.status}`);
    }
    const data: { success: boolean; api_keys: Record<string, ApiKeyInfo> } = await res.json();
    return data.api_keys;
  }

  async saveApiKey(provider: string, apiKey: string): Promise<ApiKeyInfo> {
    const res = await fetch('/api/settings/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, api_key: apiKey }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `POST /api/settings/api-keys returned ${res.status}`);
    }
    const data: { success: boolean; api_key: ApiKeyInfo } = await res.json();
    return data.api_key;
  }

  async deleteApiKey(provider: string): Promise<void> {
    const res = await fetch(`/api/settings/api-keys/${provider}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string }).error ?? `DELETE /api/settings/api-keys/${provider} returned ${res.status}`
      );
    }
  }

  async toggleApiKey(provider: string): Promise<boolean> {
    const res = await fetch(`/api/settings/api-keys/${provider}/toggle`, { method: 'POST' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string }).error ??
          `POST /api/settings/api-keys/${provider}/toggle returned ${res.status}`
      );
    }
    const data: { success: boolean; enabled: boolean } = await res.json();
    return data.enabled;
  }

  async getSentimentConfig(): Promise<SentimentConfig> {
    const res = await fetch('/api/settings/sentiment');
    if (!res.ok) {
      throw new Error(`GET /api/settings/sentiment returned ${res.status}`);
    }
    const data: { success: boolean; sentiment: SentimentConfig } = await res.json();
    return data.sentiment;
  }

  async saveSentimentConfig(config: SentimentConfig): Promise<SentimentConfig> {
    const res = await fetch('/api/settings/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `POST /api/settings/sentiment returned ${res.status}`);
    }
    const data: { success: boolean; sentiment: SentimentConfig } = await res.json();
    return data.sentiment;
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  async searchSources(
    query: string,
    location?: string | null
  ): Promise<{ trustpilot: SearchResult[]; bbb: SearchResult[] }> {
    const res = await fetch('/api/search-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, location: location ?? null }),
    });
    if (!res.ok) {
      throw new Error(`POST /api/search-sources returned ${res.status}`);
    }
    const data: { success: boolean; results: { trustpilot: SearchResult[]; bbb: SearchResult[] } } =
      await res.json();
    return data.results;
  }

  async searchGooglePlaces(query: string, location?: string | null): Promise<ApiSearchResult[]> {
    const res = await fetch('/api/search-google-places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, location: location ?? null }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string }).error ?? `POST /api/search-google-places returned ${res.status}`
      );
    }
    const data: { success: boolean; results: ApiSearchResult[] } = await res.json();
    return data.results;
  }

  async searchYelp(query: string, location?: string | null): Promise<ApiSearchResult[]> {
    const res = await fetch('/api/search-yelp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, location: location ?? null }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `POST /api/search-yelp returned ${res.status}`);
    }
    const data: { success: boolean; results: ApiSearchResult[] } = await res.json();
    return data.results;
  }

  // ─── CSV export ────────────────────────────────────────────────────────────

  async exportReviewsCsv(
    businessId: number,
    opts?: { source?: string; sentiment?: string }
  ): Promise<string> {
    const params = new URLSearchParams();
    if (opts?.source) params.set('source', opts.source);
    if (opts?.sentiment) params.set('sentiment', opts.sentiment);

    const qs = params.toString();
    const url = `/business/${businessId}/export${qs ? `?${qs}` : ''}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`GET ${url} returned ${res.status}`);
    }
    return res.text();
  }

  // ─── Scheduler (no-op in API mode) ─────────────────────────────────────────

  async getSchedulerConfig(): Promise<SchedulerConfig> {
    return {
      interval_hours: SCRAPE_INTERVAL_HOURS,
      last_run: null,
    };
  }

  async saveSchedulerConfig(config: SchedulerConfig): Promise<void> {
    void config;
    // No-op: scheduling is handled server-side in API mode
  }
}
