'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStorage } from '@/lib/storage/hooks';
import type { ApiKeyInfo } from '@/lib/storage/types';
import { ApiKeyCard } from '@/components/settings/ApiKeyCard';
import { SentimentSliders } from '@/components/settings/SentimentSliders';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { clearLocalWorkspace, getWorkspaceMode, GITHUB_REPO_URL, IS_PORTFOLIO_MODE, setWorkspaceMode, type WorkspaceMode } from '@/lib/portfolio';
import { seedDemoData } from '@/lib/db/seed';

interface ProviderConfig {
  provider: string;
  label: string;
  description: string;
  helpUrl: string;
  helpLinkText: string;
  placeholder: string;
  inputType?: 'text' | 'email' | 'password';
}

const PROVIDERS: ProviderConfig[] = [
  {
    provider: 'google_places',
    label: 'Google Places API',
    description: 'Fetch Google reviews for your businesses',
    helpUrl:
      'https://developers.google.com/maps/documentation/places/web-service/get-api-key',
    helpLinkText: 'Get a Google Places API key',
    placeholder: 'Enter Google Places API key',
  },
  {
    provider: 'yelp_fusion',
    label: 'Yelp Fusion API',
    description: 'Fetch Yelp reviews for your businesses',
    helpUrl: 'https://www.yelp.com/developers/v3/manage_app',
    helpLinkText: 'Get a Yelp Fusion API key',
    placeholder: 'Enter Yelp Fusion API key',
  },
  {
    provider: 'resend',
    label: 'Resend API Key',
    description: 'Send alert emails with your own Resend account',
    helpUrl: 'https://resend.com/api-keys',
    helpLinkText: 'Create a Resend API key',
    placeholder: 'Enter Resend API key',
  },
  {
    provider: 'resend_from_email',
    label: 'Resend Sender Email',
    description: 'Must be an address on a domain verified in your Resend account',
    helpUrl: 'https://resend.com/docs/knowledge-base/how-do-I-create-an-email-address-or-sender-in-resend',
    helpLinkText: 'Learn about sender addresses',
    inputType: 'email',
    placeholder: 'alerts@yourdomain.com',
  },
];

export default function SettingsPage() {
  const storage = useStorage();
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKeyInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceMode] = useState<WorkspaceMode>(() => (IS_PORTFOLIO_MODE ? getWorkspaceMode() : 'sample'));

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

  async function handleStartEmptyWorkspace() {
    await clearLocalWorkspace();
    setWorkspaceMode('blank');
    window.location.reload();
  }

  async function handleReloadSample() {
    await clearLocalWorkspace();
    setWorkspaceMode('sample');
    await seedDemoData();
    window.location.reload();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Settings
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          {IS_PORTFOLIO_MODE
            ? 'Manage this browser-local workspace, optional API keys, and alert-related settings.'
            : 'Configure API keys and sentiment analysis'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] border-t-2 border-t-[var(--negative)] rounded-none p-8 text-center max-w-2xl">
          <p className="text-[var(--negative)] font-medium mb-2">Connection Error</p>
          <p className="text-[var(--text-muted)] text-sm">{error}</p>
        </div>
      ) : (
        <>
          {IS_PORTFOLIO_MODE && (
            <div className="panel-shell-info rounded-none p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                Workspace Storage
              </h2>
              <p className="text-sm text-[var(--text-muted)] mb-5">
                {workspaceMode === 'sample'
                  ? 'Sample data is currently loaded in this browser.'
                  : 'You are using a blank local workspace in this browser.'}{' '}
                Resetting here only affects this device and browser profile.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={workspaceMode === 'sample' ? handleStartEmptyWorkspace : handleReloadSample}
                >
                  {workspaceMode === 'sample' ? 'Start Empty Workspace' : 'Reload Sample Data'}
                </Button>
              </div>
            </div>
          )}

          <div className="panel-shell rounded-none p-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              API Keys
            </h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              {IS_PORTFOLIO_MODE
                ? 'Optional. Values are stored only in this browser profile. Google and Yelp keys are used for lookups, and Resend credentials are used only when sending alert emails from your own account.'
                : 'Add API keys to fetch reviews from official APIs instead of web scraping. This is more reliable and provides access to more reviews.'}
            </p>

            {PROVIDERS.map((p, idx) => (
              <div key={p.provider}>
                <div className={idx < PROVIDERS.length - 1 ? 'mb-6 pb-6 border-b border-[var(--border)]' : 'mb-2'}>
                  <ApiKeyCard
                    label={p.label}
                    description={p.description}
                    helpUrl={p.helpUrl}
                    helpLinkText={p.helpLinkText}
                    keyInfo={apiKeys[p.provider] ?? null}
                    onSave={(key) => handleSave(p.provider, key)}
                    onDelete={() => handleDelete(p.provider)}
                    onToggle={() => handleToggle(p.provider)}
                    inputType={p.inputType}
                    placeholder={p.placeholder}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="panel-shell rounded-none p-6 max-w-2xl mt-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Sentiment Analysis
            </h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Configure how sentiment scores are calculated. The final score combines the star rating and text analysis based on the weights below.
            </p>
            <SentimentSliders />
          </div>

          {IS_PORTFOLIO_MODE && (
            <div className="panel-shell rounded-none p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                Full Project
              </h2>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                This hosted mode keeps all workspace data in your browser and can scrape or send alerts while you are actively using it. Always-on background monitoring and the full self-hosted workflow still live in the cloned project.
              </p>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="accent-link inline-flex items-center gap-2 font-medium"
              >
                View or clone the GitHub repo
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
