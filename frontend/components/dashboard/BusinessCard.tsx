'use client';

import Link from 'next/link';
import type { BusinessWithStats } from '@/lib/storage/types';
import { SourceBadge } from '@/components/ui/SourceBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BusinessCardProps {
  business: BusinessWithStats;
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
}

export function BusinessCard({ business, onEdit, onDelete }: BusinessCardProps) {
  const avgRating = business.avg_rating ?? 0;
  const filledStars = Math.round(avgRating);
  const emptyStars = Math.max(0, 5 - filledStars);

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card data-testid="business-card" className="gap-0 py-0 h-full">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header: name + warning icon + edit/delete buttons */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xl font-semibold text-foreground truncate">{business.name}</h2>
            {business.scrape_issues && (
              <span className="text-muted-foreground flex-shrink-0" title="Scrape issues detected">
                <AlertTriangle className="w-5 h-5" />
              </span>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0 ml-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(business.id)}
              title="Edit business"
              className="text-muted-foreground hover:text-primary"
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(business.id, business.name)}
              title="Delete business"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 />
            </Button>
          </div>
        </div>

        {/* Rating + trend */}
        <div className="flex items-center mb-1">
          <span className="text-primary text-lg">{'★'.repeat(filledStars)}{'☆'.repeat(emptyStars)}</span>
          <span className="ml-1 text-muted-foreground font-medium font-mono">{avgRating.toFixed(1)}</span>
          {business.trend_direction === 'up' && (
            <span className="ml-2 text-positive text-sm font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-mono">{Math.abs(business.trend_delta).toFixed(1)}</span>
            </span>
          )}
          {business.trend_direction === 'down' && (
            <span className="ml-2 text-negative text-sm font-medium flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" />
              <span className="font-mono">{Math.abs(business.trend_delta).toFixed(1)}</span>
            </span>
          )}
          {business.trend_direction === 'stable' && (
            <span className="ml-2 text-muted-foreground text-sm font-medium flex items-center gap-0.5">
              <Minus className="w-3.5 h-3.5" />
              stable
            </span>
          )}
        </div>

        {/* Review count */}
        <div className="text-muted-foreground text-sm mb-3 font-mono">({business.total_reviews} reviews)</div>

        {/* Negative alert badge */}
        {business.recent_negative_count > 0 && (
          <Link
            href={`/business/${business.id}?sentiment=negative`}
            className="mb-3 flex items-center px-2.5 py-1.5 bg-negative/10 text-negative rounded-lg text-sm font-medium hover:bg-negative/20 transition"
          >
            <AlertTriangle className="w-4 h-4 mr-1.5 flex-shrink-0" />
            {business.recent_negative_count} negative this week
          </Link>
        )}

        {/* Scrape issue badge */}
        {business.scrape_issues && (
          <Link
            href={`/business/${business.id}#scrape-history`}
            className="mb-3 flex items-center px-2.5 py-1.5 bg-muted text-muted-foreground border border-border rounded-lg text-sm font-medium transition hover:opacity-90"
          >
            <AlertTriangle className="w-4 h-4 mr-1.5 flex-shrink-0" />
            {business.scrape_issue_type === 'failed'
              ? `${business.scrape_issue_sources.join(', ')} failing`
              : `${business.scrape_issue_sources.join(', ')}: no reviews found`}
          </Link>
        )}

        {/* Activity text */}
        <div className="text-muted-foreground text-xs mb-3">
          {business.recent_count > 0 && (
            <span>{business.recent_count} new this week</span>
          )}
          {business.recent_count > 0 && business.last_review_date && (
            <span className="mx-1">•</span>
          )}
          {business.last_review_date && (
            <span>Last: {formatDate(business.last_review_date)}</span>
          )}
        </div>

        {/* Source badges */}
        <div className="flex flex-wrap gap-1.5 text-xs mb-4">
          {business.trustpilot_url && <SourceBadge source="trustpilot" />}
          {business.bbb_url && <SourceBadge source="bbb" />}
          {(business.yelp_url || business.yelp_business_id) && <SourceBadge source="yelp" />}
          {business.google_place_id && <SourceBadge source="google_places" />}
        </div>

        {/* Pinned bottom: sentiment + view details */}
        <div className="mt-auto pt-4">
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Sentiment</span>
              <span>{Math.round(business.positive_pct)}% positive</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
              <div className="bg-positive" style={{ width: `${business.positive_pct}%` }} />
              <div className="bg-negative" style={{ width: `${business.negative_pct}%` }} />
            </div>
          </div>
          <Button asChild className="w-full">
            <Link href={`/business/${business.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
