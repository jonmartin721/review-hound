'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
      <Modal isOpen={isOpen && !showSourceModal} onClose={handleClose} title="Add Business">
        <form onSubmit={handleStep1Submit}>
          <div className="space-y-4">
            <Input
              label="Business Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State"
              helpText={
                IS_PORTFOLIO_MODE
                  ? 'Saved only in this browser. You can still search for sources and scrape on demand.'
                  : 'Helps find the right business on review sites'
              }
            />
            {IS_PORTFOLIO_MODE && (
              <p className="text-sm text-[var(--text-muted)]">
                This hosted workspace stays local in your browser, but it can still call stateless search and scraping endpoints.
              </p>
            )}
            {saveError && (
              <p className="text-sm text-[var(--negative)]">{saveError}</p>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={searching}
              disabled={!name.trim()}
            >
              Next: Find Sources
            </Button>
          </div>
        </form>
      </Modal>

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
