'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import type { SearchResult } from '@/lib/storage/types';

interface SourceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  trustpilotResults: SearchResult[];
  bbbResults: SearchResult[];
  isLoading: boolean;
  searchError: string | null;
  saveError: string | null;
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
      <h3 className="font-semibold text-foreground mb-2 flex items-center">
        <span className={cn("w-3 h-3 rounded-full mr-2", dotColor)} />
        {label}
      </h3>
      <div className="border border-border rounded-lg p-3 bg-muted">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-4 flex items-center justify-center gap-2">
            <Spinner size="sm" />
            <span>Searching...</span>
          </div>
        ) : results.length === 0 ? (
          <p className="text-muted-foreground py-2">No results found.</p>
        ) : (
          <div className="space-y-2">
            {results.map((result, index) => {
              const filledStars = result.rating ? Math.round(result.rating) : 0;
              const emptyStars = Math.max(0, 5 - filledStars);
              return (
                <label
                  key={index}
                  className="flex items-start p-2 rounded-lg hover:bg-accent cursor-pointer transition"
                >
                  <input
                    type="radio"
                    name={`${source}Source`}
                    value={result.url}
                    checked={selectedUrl === result.url && !manualUrl}
                    onChange={() => handleRadioChange(result.url)}
                    className="mt-1 mr-3 accent-primary cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{result.name}</div>
                    {result.address && (
                      <div className="text-sm text-muted-foreground">{result.address}</div>
                    )}
                    {result.rating != null && (
                      <div className="text-sm">
                        <span className="text-primary">
                          {'★'.repeat(filledStars)}{'☆'.repeat(emptyStars)}
                        </span>
                        {' '}
                        <span className="text-muted-foreground">
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
        <div className="mt-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            className="text-primary hover:text-primary/80 transition text-sm cursor-pointer"
          >
            Enter URL manually
          </button>
          {showManual && (
            <div className="mt-2">
              <Input
                type="url"
                value={manualUrl}
                onChange={(e) => handleManualChange(e.target.value)}
                placeholder="https://..."
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
  searchError,
  saveError,
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Find Review Sources for &quot;{businessName}&quot;</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">Select the correct business listing from each platform, or enter URLs manually.</p>

        {searchError && (
          <p className="text-sm text-destructive">{searchError}</p>
        )}

        <div className="overflow-y-auto max-h-[60vh] pr-1">
          <SourceSection
            source="trustpilot"
            label="TrustPilot"
            dotColor="bg-positive"
            results={trustpilotResults}
            isLoading={isLoading}
            selectedUrl={trustpilotUrl}
            onSelect={setTrustpilotUrl}
          />
          <SourceSection
            source="bbb"
            label="BBB"
            dotColor="bg-primary"
            results={bbbResults}
            isLoading={isLoading}
            selectedUrl={bbbUrl}
            onSelect={setBbbUrl}
          />
        </div>

        {saveError && (
          <p className="text-sm text-destructive mt-2">{saveError}</p>
        )}

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button variant="outline" onClick={handleSkip} disabled={isSaving}>
            Skip for now
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Spinner size="sm" className="mr-1" />}
            {isSaving
              ? (trustpilotUrl || bbbUrl ? 'Saving & scraping reviews...' : 'Saving...')
              : 'Save Business'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
