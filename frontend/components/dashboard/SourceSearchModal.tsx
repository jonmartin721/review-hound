'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { SearchResult } from '@/lib/storage/types';

interface SourceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  trustpilotResults: SearchResult[];
  bbbResults: SearchResult[];
  isLoading: boolean;
  onSave: (sources: { trustpilot: string | null; bbb: string | null }) => Promise<void>;
  isSaving: boolean;
}

interface SourceSectionProps {
  source: 'trustpilot' | 'bbb';
  label: string;
  dotColor: string;
  results: SearchResult[];
  isLoading: boolean;
  selectedUrl: string | null;
  onSelect: (url: string | null) => void;
}

function SourceSection({ source, label, dotColor, results, isLoading, selectedUrl, onSelect }: SourceSectionProps) {
  const [showManual, setShowManual] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const handleRadioChange = (url: string) => {
    setManualUrl('');
    onSelect(url);
  };

  const handleManualChange = (val: string) => {
    setManualUrl(val);
    onSelect(val || null);
  };

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center">
        <span className={`w-3 h-3 ${dotColor} rounded-full mr-2`} />
        {label}
      </h3>
      <div className="border border-[var(--border)] rounded-none p-3 bg-[var(--bg-elevated)]">
        {isLoading ? (
          <div className="text-center text-[var(--text-muted)] py-4 flex items-center justify-center gap-2">
            <Spinner size="sm" />
            <span>Searching...</span>
          </div>
        ) : results.length === 0 ? (
          <p className="text-[var(--text-muted)] py-2">No results found.</p>
        ) : (
          <div className="space-y-2">
            {results.map((result, index) => {
              const filledStars = result.rating ? Math.round(result.rating) : 0;
              const emptyStars = Math.max(0, 5 - filledStars);
              return (
                <label
                  key={index}
                  className="flex items-start p-2 rounded-none hover:bg-[var(--bg-surface-hover)] cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`${source}Source`}
                    value={result.url}
                    checked={selectedUrl === result.url && !manualUrl}
                    onChange={() => handleRadioChange(result.url)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-[var(--text-primary)]">{result.name}</div>
                    {result.address && (
                      <div className="text-sm text-[var(--text-muted)]">{result.address}</div>
                    )}
                    {result.rating != null && (
                      <div className="text-sm">
                        <span className="rating-stars">
                          {'★'.repeat(filledStars)}{'☆'.repeat(emptyStars)}
                        </span>
                        {' '}
                        <span className="text-[var(--text-secondary)]">
                          {result.rating.toFixed(1)}
                          {result.review_count ? ` (${result.review_count} reviews)` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* Manual URL entry */}
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            className="text-[var(--accent)] hover:brightness-110 text-sm"
          >
            Enter URL manually
          </button>
          {showManual && (
            <div className="mt-2">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => handleManualChange(e.target.value)}
                placeholder="https://..."
                className="w-full border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-none px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SourceSearchModal({
  isOpen,
  onClose,
  businessName,
  trustpilotResults,
  bbbResults,
  isLoading,
  onSave,
  isSaving,
}: SourceSearchModalProps) {
  const [trustpilotUrl, setTrustpilotUrl] = useState<string | null>(null);
  const [bbbUrl, setBbbUrl] = useState<string | null>(null);

  const handleSave = () => {
    onSave({ trustpilot: trustpilotUrl, bbb: bbbUrl });
  };

  const handleSkip = () => {
    onSave({ trustpilot: null, bbb: null });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Find Review Sources for "${businessName}"`}
      maxWidth="max-w-2xl"
    >
      <p className="text-[var(--text-muted)] mb-4">Select the correct business listing from each platform, or enter URLs manually.</p>

      <div className="overflow-y-auto max-h-[60vh] pr-1">
        <SourceSection
          source="trustpilot"
          label="TrustPilot"
          dotColor="bg-[var(--positive)]"
          results={trustpilotResults}
          isLoading={isLoading}
          selectedUrl={trustpilotUrl}
          onSelect={setTrustpilotUrl}
        />
        <SourceSection
          source="bbb"
          label="BBB"
          dotColor="bg-[var(--accent)]"
          results={bbbResults}
          isLoading={isLoading}
          selectedUrl={bbbUrl}
          onSelect={setBbbUrl}
        />
      </div>

      <div className="flex justify-end gap-3 mt-6 border-t border-[var(--border)] pt-4">
        <Button variant="secondary" onClick={handleSkip} disabled={isSaving}>
          Skip for now
        </Button>
        <Button onClick={handleSave} loading={isSaving}>
          {isSaving
            ? (trustpilotUrl || bbbUrl ? 'Saving & scraping reviews...' : 'Saving...')
            : 'Save Business'}
        </Button>
      </div>
    </Modal>
  );
}
