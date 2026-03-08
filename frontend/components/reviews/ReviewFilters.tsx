'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface ReviewFiltersProps {
  source: string;
  sentiment: string;
  onFilter: (source: string, sentiment: string) => void;
  onExport: () => void;
}

export function ReviewFilters({ source, sentiment, onFilter, onExport }: ReviewFiltersProps) {
  const [localSource, setLocalSource] = useState(source);
  const [localSentiment, setLocalSentiment] = useState(sentiment);

  const handleFilter = () => {
    onFilter(localSource, localSentiment);
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-none border border-[var(--border)] p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <Select
          label="Source"
          value={localSource}
          onChange={e => setLocalSource(e.target.value)}
        >
          <option value="">All Sources</option>
          <option value="trustpilot">TrustPilot</option>
          <option value="bbb">BBB</option>
          <option value="yelp">Yelp</option>
          <option value="google_places">Google Places</option>
          <option value="yelp_api">Yelp API</option>
        </Select>

        <Select
          label="Sentiment"
          value={localSentiment}
          onChange={e => setLocalSentiment(e.target.value)}
        >
          <option value="">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </Select>

        <Button variant="primary" onClick={handleFilter}>
          Filter
        </Button>

        <Button
          variant="success"
          onClick={onExport}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </Button>
      </div>
    </div>
  );
}
