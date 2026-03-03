'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useStorage } from '@/lib/storage/hooks';
import type { Business, Review } from '@/lib/storage/types';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewFilters } from '@/components/reviews/ReviewFilters';
import { Pagination } from '@/components/reviews/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { downloadCsv } from '@/lib/utils/csv';

export default function ReviewsPage() {
  const { id } = useParams();
  const storage = useStorage();
  const businessId = Number(id);

  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [source, setSource] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const [biz, reviewData] = await Promise.all([
        storage.getBusiness(businessId),
        storage.getReviews(businessId, {
          source: source || undefined,
          sentiment: sentiment || undefined,
          page,
        }),
      ]);
      setBusiness(biz);
      setReviews(reviewData.reviews);
      setTotalPages(reviewData.total_pages);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setError('Unable to connect to the backend. Make sure Flask is running: reviewhound web');
    } finally {
      setLoading(false);
    }
  }, [storage, businessId, source, sentiment, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilter = (newSource: string, newSentiment: string) => {
    setSource(newSource);
    setSentiment(newSentiment);
    setPage(1);
  };

  const handleExport = async () => {
    const csv = await storage.exportReviewsCsv(businessId, {
      source: source || undefined,
      sentiment: sentiment || undefined,
    });
    const safeName = (business?.name || 'reviews').toLowerCase().replace(/\s+/g, '_');
    downloadCsv(csv, `${safeName}_reviews.csv`);
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/business/${businessId}`}
          className="text-[var(--accent)] hover:brightness-110"
        >
          &larr; Back to {business?.name || 'Business'}
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">
        Reviews{business ? ` for ${business.name}` : ''}
      </h1>

      <ReviewFilters
        source={source}
        sentiment={sentiment}
        onFilter={handleFilter}
        onExport={handleExport}
      />

      {error ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] border-t-2 border-t-[var(--negative)] rounded-none p-8 text-center">
          <p className="text-[var(--negative)] font-medium mb-2">Connection Error</p>
          <p className="text-[var(--text-muted)] text-sm">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-[var(--bg-surface)] rounded-none border border-[var(--border)] p-8 text-center">
          <p className="text-[var(--text-muted)]">No reviews found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
