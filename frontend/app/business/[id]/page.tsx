'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStorage } from '@/lib/storage/hooks';
import { StatCards } from '@/components/business/StatCards';
import { RatingChart } from '@/components/business/RatingChart';
import { RecentReviews } from '@/components/business/RecentReviews';
import { ScrapeButton } from '@/components/business/ScrapeButton';
import { AlertsList } from '@/components/business/AlertsList';
import { AlertModal } from '@/components/business/AlertModal';
import { ScrapeHistory } from '@/components/business/ScrapeHistory';
import { DeleteConfirmModal } from '@/components/business/DeleteConfirmModal';
import { EditBusinessModal } from '@/components/dashboard/EditBusinessModal';
import { Spinner } from '@/components/ui/Spinner';
import { SourceBadge } from '@/components/ui/SourceBadge';
import type { BusinessWithStats, Review, AlertConfig } from '@/lib/storage/types';

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storage = useStorage();
  const businessId = Number(params.id);

  const [business, setBusiness] = useState<BusinessWithStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Refresh keys to re-trigger child data fetches after scrape
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [alertsRefreshKey, setAlertsRefreshKey] = useState(0);

  // Modal state
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertConfig | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [businesses, recentReviews] = await Promise.all([
        storage.getBusinesses(),
        storage.getRecentReviews(businessId, 5),
      ]);

      const found = businesses.find((b) => b.id === businessId);
      if (!found) {
        setNotFound(true);
        return;
      }

      setBusiness(found);
      setReviews(recentReviews);
    } catch (err) {
      console.error('Failed to load business data:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [businessId, storage]);

  useEffect(() => {
    if (!isNaN(businessId)) {
      loadData();
    } else {
      setNotFound(true);
      setLoading(false);
    }
  }, [businessId, loadData]);

  function handleScrapeComplete() {
    setHistoryRefreshKey((k) => k + 1);
    loadData();
  }

  function handleEditSuccess() {
    loadData();
  }

  function handleAlertSaved() {
    setAlertsRefreshKey((k) => k + 1);
  }

  function openAddAlert() {
    setEditingAlert(null);
    setAlertModalOpen(true);
  }

  function openEditAlert(alert: AlertConfig) {
    setEditingAlert(alert);
    setAlertModalOpen(true);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !business) {
    return (
      <div className="text-center py-32">
        <p className="text-[var(--text-muted)] text-lg mb-4">Business not found.</p>
        <Link
          href="/"
          className="accent-link font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/"
          className="muted-accent-link inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Header card */}
      <div className="panel-shell rounded-none p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{business.name}</h1>
            {business.address && (
              <p className="text-[var(--text-muted)] mt-1">{business.address}</p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => setEditOpen(true)}
              className="px-4 py-2 border border-[var(--border)] rounded-none text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="px-4 py-2 border border-(--negative)/30 bg-(--negative)/10 text-[var(--negative)] rounded-none hover:bg-(--negative)/20 transition font-medium"
            >
              Delete
            </button>
            <ScrapeButton businessId={businessId} onComplete={handleScrapeComplete} />
          </div>
        </div>

        {/* Stat tiles */}
        <StatCards
          stats={{
            total_reviews: business.total_reviews,
            avg_rating: business.avg_rating,
            positive_pct: business.positive_pct,
            negative_pct: business.negative_pct,
          }}
        />

        {/* Source links */}
        <div className="flex flex-wrap gap-2 mt-6">
          {business.trustpilot_url && (
            <SourceBadge source="trustpilot" url={business.trustpilot_url} size="md" />
          )}
          {business.bbb_url && (
            <SourceBadge source="bbb" url={business.bbb_url} size="md" />
          )}
          {business.yelp_url && (
            <SourceBadge source="yelp" url={business.yelp_url} size="md" />
          )}
          {business.google_place_id && (
            <SourceBadge source="google_places" size="md" />
          )}
          {business.yelp_business_id && (
            <SourceBadge source="yelp_api" size="md" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(22rem,1fr)] gap-6 items-start">
        {/* Rating Trend Chart */}
        <div className="panel-shell rounded-none p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Rating Trend</h2>
          <RatingChart businessId={businessId} />
        </div>

        {/* Recent Reviews */}
        <RecentReviews reviews={reviews} businessId={businessId} />
      </div>

      <AlertsList
        businessId={businessId}
        onAdd={openAddAlert}
        onEdit={openEditAlert}
        refreshKey={alertsRefreshKey}
      />

      {/* Scrape History */}
      <ScrapeHistory businessId={businessId} refreshKey={historyRefreshKey} />

      {/* Modals */}
      {editOpen && (
        <EditBusinessModal
          businessId={businessId}
          onClose={() => setEditOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => router.push('/')}
        businessId={businessId}
        businessName={business.name}
      />

      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onSaved={handleAlertSaved}
        businessId={businessId}
        editingAlert={editingAlert}
      />
    </>
  );
}
