'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useStorage } from '@/lib/storage/hooks';
import type { ApiSearchResult } from '@/lib/storage/types';

interface EditBusinessModalProps {
  businessId: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface SearchPanel {
  type: 'google' | 'yelp';
  results: ApiSearchResult[];
  loading: boolean;
}

export function EditBusinessModal({ businessId, onClose, onSuccess }: EditBusinessModalProps) {
  const storage = useStorage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [trustpilotUrl, setTrustpilotUrl] = useState('');
  const [bbbUrl, setBbbUrl] = useState('');
  const [yelpUrl, setYelpUrl] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [yelpBusinessId, setYelpBusinessId] = useState('');

  // Search panel state
  const [searchPanel, setSearchPanel] = useState<SearchPanel | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    storage.getBusiness(businessId).then((biz) => {
      if (cancelled) return;
      if (!biz) {
        setError('Business not found.');
        setLoading(false);
        return;
      }
      setName(biz.name);
      setAddress(biz.address ?? '');
      setTrustpilotUrl(biz.trustpilot_url ?? '');
      setBbbUrl(biz.bbb_url ?? '');
      setYelpUrl(biz.yelp_url ?? '');
      setGooglePlaceId(biz.google_place_id ?? '');
      setYelpBusinessId(biz.yelp_business_id ?? '');
      setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setError('Failed to load business data.');
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [businessId, storage]);

  const handleGoogleSearch = async () => {
    setSearchPanel({ type: 'google', results: [], loading: true });
    try {
      const results = await storage.searchGooglePlaces(name, address || null);
      setSearchPanel({ type: 'google', results, loading: false });
    } catch {
      setSearchPanel({ type: 'google', results: [], loading: false });
    }
  };

  const handleYelpSearch = async () => {
    setSearchPanel({ type: 'yelp', results: [], loading: true });
    try {
      const results = await storage.searchYelp(name, address || null);
      setSearchPanel({ type: 'yelp', results, loading: false });
    } catch {
      setSearchPanel({ type: 'yelp', results: [], loading: false });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await storage.updateBusiness(businessId, {
        name: name.trim(),
        address: address.trim() || null,
        trustpilot_url: trustpilotUrl.trim() || null,
        bbb_url: bbbUrl.trim() || null,
        yelp_url: yelpUrl.trim() || null,
        google_place_id: googlePlaceId.trim() || null,
        yelp_business_id: yelpBusinessId.trim() || null,
      });
      onSuccess();
      onClose();
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Business" maxWidth="max-w-lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Business Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Location"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="City, State"
            />

            {/* Review Sources */}
            <div className="border-t border-[var(--border)] pt-4 mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-4">Review Sources</p>
              <div className="space-y-4">
                <Input
                  label="TrustPilot URL"
                  type="url"
                  value={trustpilotUrl}
                  onChange={(e) => setTrustpilotUrl(e.target.value)}
                  placeholder="https://www.trustpilot.com/review/..."
                />
                <Input
                  label="BBB URL"
                  type="url"
                  value={bbbUrl}
                  onChange={(e) => setBbbUrl(e.target.value)}
                  placeholder="https://www.bbb.org/..."
                />
                <Input
                  label="Yelp URL"
                  type="url"
                  value={yelpUrl}
                  onChange={(e) => setYelpUrl(e.target.value)}
                  placeholder="https://www.yelp.com/biz/..."
                />
              </div>
            </div>

            {/* API Sources */}
            <div className="border-t border-[var(--border)] pt-4 mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-4">API Sources</p>
              <div className="space-y-4">
                {/* Google Place ID */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Google Place ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={googlePlaceId}
                      onChange={(e) => setGooglePlaceId(e.target.value)}
                      placeholder="ChIJ..."
                      className="flex-1 border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-none px-3 py-2.5 placeholder-[var(--text-muted)]"
                    />
                    <Button type="button" variant="secondary" onClick={handleGoogleSearch}>
                      Search
                    </Button>
                  </div>
                </div>

                {/* Yelp Business ID */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Yelp Business ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={yelpBusinessId}
                      onChange={(e) => setYelpBusinessId(e.target.value)}
                      placeholder="e.g., gary-danko-san-francisco"
                      className="flex-1 border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-none px-3 py-2.5 placeholder-[var(--text-muted)]"
                    />
                    <Button type="button" variant="secondary" onClick={handleYelpSearch}>
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Search results panel */}
            {searchPanel && (
              <div className="border border-[var(--border)] rounded-none p-3 bg-[var(--bg-elevated)]">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    {searchPanel.type === 'google' ? 'Google Places' : 'Yelp'} results
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchPanel(null)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {searchPanel.loading ? (
                  <div className="flex items-center gap-2 py-2 text-[var(--text-muted)]">
                    <Spinner size="sm" />
                    <span className="text-sm">Searching...</span>
                  </div>
                ) : searchPanel.results.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] py-2">No results found.</p>
                ) : (
                  <div className="space-y-1">
                    {searchPanel.results.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (searchPanel.type === 'google' && result.place_id) {
                            setGooglePlaceId(result.place_id);
                          } else if (searchPanel.type === 'yelp' && result.business_id) {
                            setYelpBusinessId(result.business_id);
                          }
                          setSearchPanel(null);
                        }}
                        className="w-full text-left p-2 rounded-none hover:bg-[var(--bg-surface-hover)] transition"
                      >
                        <div className="font-medium text-sm text-[var(--text-primary)]">{result.name}</div>
                        {result.address && (
                          <div className="text-xs text-[var(--text-muted)]">{result.address}</div>
                        )}
                        {result.rating != null && (
                          <div className="text-xs text-[var(--text-secondary)]">
                            {result.rating.toFixed(1)} stars
                            {result.review_count ? ` · ${result.review_count} reviews` : ''}
                          </div>
                        )}
                        <div className="text-xs text-[var(--accent)] mt-0.5">
                          ID: {searchPanel.type === 'google' ? result.place_id : result.business_id}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 mt-3">{error}</p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
