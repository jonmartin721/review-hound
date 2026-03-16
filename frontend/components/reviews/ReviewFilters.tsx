'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    <Card className="mb-6"><CardContent>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Source</label>
          <Select value={localSource || '__all__'} onValueChange={(v) => setLocalSource(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Sources</SelectItem>
              <SelectItem value="trustpilot">TrustPilot</SelectItem>
              <SelectItem value="bbb">BBB</SelectItem>
              <SelectItem value="yelp">Yelp</SelectItem>
              <SelectItem value="google_places">Google Places</SelectItem>
              <SelectItem value="yelp_api">Yelp API</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Sentiment</label>
          <Select value={localSentiment || '__all__'} onValueChange={(v) => setLocalSentiment(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleFilter}>
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
    </CardContent></Card>
  );
}
