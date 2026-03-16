'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/Spinner';
import { SourceSearchModal } from './SourceSearchModal';
import { useStorage } from '@/lib/storage/hooks';
import type { SearchResult } from '@/lib/storage/types';
import { IS_PORTFOLIO_MODE } from '@/lib/portfolio';

interface AddBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddBusinessModal({ isOpen, onClose, onSuccess }: AddBusinessModalProps) {
  const storage = useStorage();
  const router = useRouter();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [searching, setSearching] = useState(false);

  // Step 2 state
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [trustpilotResults, setTrustpilotResults] = useState<SearchResult[]>([]);
  const [bbbResults, setBbbResults] = useState<SearchResult[]>([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setName('');
    setLocation('');
    setSearching(false);
    setShowSourceModal(false);
    setTrustpilotResults([]);
    setBbbResults([]);
    onClose();
  }, [onClose]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSearching(true);
    setShowSourceModal(true);
    setSourceLoading(true);
    setTrustpilotResults([]);
    setBbbResults([]);
    setSearchError(null);

    try {
      const results = await storage.searchSources(name.trim(), location.trim() || null);
      setTrustpilotResults(results.trustpilot);
      setBbbResults(results.bbb);
    } catch (err) {
      console.error('Failed to search sources:', err);
      setSearchError('Could not search for existing profiles. You can enter URLs manually below.');
      setTrustpilotResults([]);
      setBbbResults([]);
    } finally {
      setSourceLoading(false);
      setSearching(false);
    }
  };

  const handleSave = async (sources: { trustpilot: string | null; bbb: string | null }) => {
    setSaving(true);
    setSaveError(null);
    try {
      const result = await storage.createBusiness({
        name: name.trim(),
        address: location.trim() || null,
        trustpilot_url: sources.trustpilot,
        bbb_url: sources.bbb,
      });
      handleClose();
      onSuccess();
      router.push(`/business/${result.business.id}`);
    } catch (err) {
      console.error('Failed to create business:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to create business. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showSourceModal} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Business</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStep1Submit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-business-name">Business Name *</Label>
                <Input
                  id="add-business-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="add-business-location">Location (optional)</Label>
                <Input
                  id="add-business-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State"
                  className="mt-1.5"
                />
                <p className="text-sm text-muted-foreground mt-1.5">
                  {IS_PORTFOLIO_MODE
                    ? 'Saved only in this browser. You can still search for sources and scrape on demand.'
                    : 'Helps find the right business on review sites'}
                </p>
              </div>
              {IS_PORTFOLIO_MODE && (
                <p className="text-sm text-muted-foreground">
                  This hosted workspace stays local in your browser, but it can still call stateless search and scraping endpoints.
                </p>
              )}
              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || searching}
              >
                {searching && <Spinner size="sm" className="mr-1" />}
                Next: Find Sources
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SourceSearchModal
        isOpen={showSourceModal}
        onClose={handleClose}
        businessName={name}
        trustpilotResults={trustpilotResults}
        bbbResults={bbbResults}
        isLoading={sourceLoading}
        searchError={searchError}
        saveError={saveError}
        onSave={handleSave}
        isSaving={saving}
      />
    </>
  );
}
