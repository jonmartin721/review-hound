'use client';

import { useState, useEffect, useCallback } from 'react';
import { KeyRound, SlidersHorizontal, FolderOpen, ExternalLink } from 'lucide-react';
import { useStorage } from '@/lib/storage/hooks';
import type { ApiKeyInfo } from '@/lib/storage/types';
import { ApiKeyCard } from '@/components/settings/ApiKeyCard';
import { SentimentSliders } from '@/components/settings/SentimentSliders';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent } from '@/components/ui/card';
import { WorkspaceSelector } from '@/components/layout/WorkspaceSelector';
import { cn } from '@/lib/utils';
import { GITHUB_REPO_URL, IS_PORTFOLIO_MODE } from '@/lib/portfolio';

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

type SettingsTab = 'workspace' | 'api-keys' | 'sentiment' | 'project';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType; portfolioOnly?: boolean }[] = [
  ...(IS_PORTFOLIO_MODE ? [{ id: 'workspace' as SettingsTab, label: 'Workspace', icon: FolderOpen, portfolioOnly: true }] : []),
  { id: 'api-keys', label: 'API Keys', icon: KeyRound },
  { id: 'sentiment', label: 'Sentiment', icon: SlidersHorizontal },
  ...(IS_PORTFOLIO_MODE ? [{ id: 'project' as SettingsTab, label: 'Full Project', icon: ExternalLink, portfolioOnly: true }] : []),
];

export default function SettingsPage() {
  const storage = useStorage();
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKeyInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>(TABS[0].id);

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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          {IS_PORTFOLIO_MODE
            ? 'Manage your workspace, API keys, and analysis settings.'
            : 'Configure API keys and sentiment analysis'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card className="border-t-2 border-t-negative">
          <CardContent className="text-center">
            <p className="text-negative font-medium mb-2">Connection Error</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-8">
          {/* Sidebar */}
          <nav className="w-48 shrink-0">
            <ul className="space-y-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <button
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      "w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-colors cursor-pointer text-left",
                      activeTab === id
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'workspace' && IS_PORTFOLIO_MODE && (
              <WorkspaceSelector />
            )}

            {activeTab === 'api-keys' && (
              <Card>
                <CardContent>
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    API Keys
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    {IS_PORTFOLIO_MODE
                      ? 'Optional. Values are stored only in this browser profile. Google and Yelp keys are used for lookups, and Resend credentials are used only when sending alert emails from your own account.'
                      : 'Add API keys to fetch reviews from official APIs instead of web scraping. This is more reliable and provides access to more reviews.'}
                  </p>

                  {PROVIDERS.map((p, idx) => (
                    <div key={p.provider}>
                      <div className={idx < PROVIDERS.length - 1 ? 'mb-6 pb-6 border-b border-border' : 'mb-2'}>
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
                </CardContent>
              </Card>
            )}

            {activeTab === 'sentiment' && (
              <Card>
                <CardContent>
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Sentiment Analysis
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Configure how sentiment scores are calculated. The final score combines the star rating and text analysis based on the weights below.
                  </p>
                  <SentimentSliders />
                </CardContent>
              </Card>
            )}

            {activeTab === 'project' && IS_PORTFOLIO_MODE && (
              <Card>
                <CardContent>
                  <h2 className="text-lg font-semibold text-foreground mb-3">
                    Full Project
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    This hosted mode keeps all workspace data in your browser and can scrape or send alerts while you are actively using it. Always-on background monitoring and the full self-hosted workflow still live in the cloned project.
                  </p>
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:text-primary/80 transition inline-flex items-center gap-2 font-medium"
                  >
                    View or clone the GitHub repo
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
