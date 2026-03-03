'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStorage } from '@/lib/storage/hooks';
import type { ApiKeyInfo } from '@/lib/storage/types';
import { ApiKeyCard } from '@/components/settings/ApiKeyCard';
import { SentimentSliders } from '@/components/settings/SentimentSliders';
import { Spinner } from '@/components/ui/Spinner';

const PROVIDERS = [
  {
    provider: 'google_places',
    label: 'Google Places API',
    description: 'Fetch Google reviews for your businesses',
    helpUrl:
      'https://developers.google.com/maps/documentation/places/web-service/get-api-key',
    helpLinkText: 'Get a Google Places API key',
  },
  {
    provider: 'yelp_fusion',
    label: 'Yelp Fusion API',
    description: 'Fetch Yelp reviews for your businesses',
    helpUrl: 'https://www.yelp.com/developers/v3/manage_app',
    helpLinkText: 'Get a Yelp Fusion API key',
  },
] as const;

export default function SettingsPage() {
  const storage = useStorage();
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKeyInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const keys = await storage.getApiKeys();
      setApiKeys(keys);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Unable to connect to the backend. Make sure Flask is running: reviewhound web');
    } finally {
      setLoading(false);
    }
  }, [storage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSave(provider: string, key: string) {
    await storage.saveApiKey(provider, key);
    await loadData();
  }

  async function handleDelete(provider: string) {
    await storage.deleteApiKey(provider);
    await loadData();
  }

  async function handleToggle(provider: string) {
    await storage.toggleApiKey(provider);
    await loadData();
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Settings
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          Configure API keys and sentiment analysis
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center max-w-2xl">
          <p className="text-red-700 dark:text-red-400 font-medium mb-2">Connection Error</p>
          <p className="text-[var(--text-muted)] text-sm">{error}</p>
        </div>
      ) : (
        <>
          {/* API Keys card */}
          <div className="bg-[var(--bg-surface)] rounded-xl shadow-sm border border-[var(--border)] p-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              API Keys
            </h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Add API keys to fetch reviews from official APIs instead of web
              scraping. This is more reliable and provides access to more
              reviews.
            </p>

            {PROVIDERS.map((p, idx) => (
              <div key={p.provider}>
                <div className={idx < PROVIDERS.length - 1 ? 'mb-6 pb-6 border-b border-[var(--border)]' : 'mb-2'}>
                  <ApiKeyCard
                    provider={p.provider}
                    label={p.label}
                    description={p.description}
                    helpUrl={p.helpUrl}
                    helpLinkText={p.helpLinkText}
                    keyInfo={apiKeys[p.provider] ?? null}
                    onSave={(key) => handleSave(p.provider, key)}
                    onDelete={() => handleDelete(p.provider)}
                    onToggle={() => handleToggle(p.provider)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Sentiment Analysis card */}
          <div className="bg-[var(--bg-surface)] rounded-xl shadow-sm border border-[var(--border)] p-6 max-w-2xl mt-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Sentiment Analysis
            </h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Configure how sentiment scores are calculated. The final score
              combines the star rating and text analysis based on the weights
              below.
            </p>
            <SentimentSliders />
          </div>
        </>
      )}
    </div>
  );
}
