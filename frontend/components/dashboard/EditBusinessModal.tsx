'use client';

import { useState, useEffect } from 'react';
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
import { X } from 'lucide-react';
import { useStorage } from '@/lib/storage/hooks';
import type { ApiSearchResult } from '@/lib/storage/types';
import { IS_PORTFOLIO_MODE } from '@/lib/portfolio';

interface EditBusinessModalProps {
  businessId: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface SearchPanel {
  type: 'google' | 'yelp';
  results: ApiSearchResult[];
  loading: boolean;
  searchError?: boolean;
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
      setSearchPanel({ type: 'google', results: [], loading: false, searchError: true });
    }
  };

  const handleYelpSearch = async () => {
    setSearchPanel({ type: 'yelp', results: [], loading: true });
    try {
      const results = await storage.searchYelp(name, address || null);
      setSearchPanel({ type: 'yelp', results, loading: false });
    } catch {
      setSearchPanel({ type: 'yelp', results: [], loading: false, searchError: true });
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
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Business</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-business-name">Business Name *</Label>
                <Input
                  id="edit-business-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="edit-business-address">Location</Label>
                <Input
                  id="edit-business-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="City, State"
                  className="mt-1.5"
                />
              </div>

              {/* Review Sources */}
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Review Sources</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-trustpilot-url">TrustPilot URL</Label>
                    <Input
                      id="edit-trustpilot-url"
                      type="url"
                      value={trustpilotUrl}
                      onChange={(e) => setTrustpilotUrl(e.target.value)}
                      placeholder="https://www.trustpilot.com/review/..."
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-bbb-url">BBB URL</Label>
                    <Input
                      id="edit-bbb-url"
                      type="url"
                      value={bbbUrl}
                      onChange={(e) => setBbbUrl(e.target.value)}
                      placeholder="https://www.bbb.org/..."
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-yelp-url">Yelp URL</Label>
                    <Input
                      id="edit-yelp-url"
                      type="url"
                      value={yelpUrl}
                      onChange={(e) => setYelpUrl(e.target.value)}
                      placeholder="https://www.yelp.com/biz/..."
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* API Sources */}
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">API Sources</p>
                <div className="space-y-4">
                  {/* Google Place ID */}
                  <div>
                    <Label htmlFor="edit-google-place-id">Google Place ID</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        id="edit-google-place-id"
                        type="text"
                        value={googlePlaceId}
                        onChange={(e) => setGooglePlaceId(e.target.value)}
                        placeholder="ChIJ..."
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" onClick={handleGoogleSearch}>
                        Search
                      </Button>
                    </div>
                  </div>

                  {/* Yelp Business ID */}
                  <div>
                    <Label htmlFor="edit-yelp-business-id">Yelp Business ID</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        id="edit-yelp-business-id"
                        type="text"
                        value={yelpBusinessId}
                        onChange={(e) => setYelpBusinessId(e.target.value)}
                        placeholder="e.g., gary-danko-san-francisco"
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" onClick={handleYelpSearch}>
                        Search
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {IS_PORTFOLIO_MODE && (
                <p className="text-sm text-muted-foreground">
                  Source URLs, IDs, and API keys stay local to this browser profile in hosted mode.
                </p>
              )}

              {/* Search results panel */}
              {searchPanel && (
                <div className="border border-border rounded-lg p-3 bg-muted">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {searchPanel.type === 'google' ? 'Google Places' : 'Yelp'} results
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearchPanel(null)}
                      className="text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {searchPanel.loading ? (
                    <div className="flex items-center gap-2 py-2 text-muted-foreground">
                      <Spinner size="sm" />
                      <span className="text-sm">Searching...</span>
                    </div>
                  ) : searchPanel.searchError ? (
                    <p className="text-sm text-destructive py-2">Search failed. Try again or enter an ID manually.</p>
                  ) : searchPanel.results.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No results found.</p>
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
                          className="w-full text-left p-2 rounded-lg hover:bg-accent transition cursor-pointer"
                        >
                          <div className="font-medium text-sm text-foreground">{result.name}</div>
                          {result.address && (
                            <div className="text-xs text-muted-foreground">{result.address}</div>
                          )}
                          {result.rating != null && (
                            <div className="text-xs text-muted-foreground">
                              {result.rating.toFixed(1)} stars
                              {result.review_count ? ` · ${result.review_count} reviews` : ''}
                            </div>
                          )}
                          <div className="text-xs text-primary mt-0.5">
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
              <p className="text-sm text-destructive mt-3">{error}</p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Spinner size="sm" className="mr-1" />}
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
