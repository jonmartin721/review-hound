'use client';

import Link from 'next/link';
import type { BusinessWithStats } from '@/lib/storage/types';
import { BusinessCard } from './BusinessCard';
import { GITHUB_REPO_URL, IS_PORTFOLIO_MODE } from '@/lib/portfolio';

interface BusinessGridProps {
  businesses: BusinessWithStats[];
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
  onAddBusiness?: () => void;
}

export function BusinessGrid({ businesses, onEdit, onDelete, onAddBusiness }: BusinessGridProps) {
  if (businesses.length === 0) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-none border border-[var(--border)] border-t-2 border-t-[var(--accent)] p-12 text-center">
        <div className="mx-auto w-16 h-16 bg-[var(--bg-elevated)] rounded-none flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="text-[var(--text-primary)] font-medium text-lg">No businesses tracked yet</p>
        <p className="text-[var(--text-muted)] mt-1">
          {IS_PORTFOLIO_MODE
            ? 'Start a local workspace in this browser, or clone the full app for scraping and alerts.'
            : 'Get started by adding your first business to track reviews.'}
        </p>
        {onAddBusiness && (
          <button
            onClick={onAddBusiness}
            className="mt-6 bg-[var(--accent)] text-[var(--accent-contrast)] px-5 py-2.5 rounded-none hover:brightness-110 transition font-medium inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Business
          </button>
        )}
        {IS_PORTFOLIO_MODE && (
          <Link
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm text-[var(--accent)] hover:brightness-110"
          >
            View the full project on GitHub
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {businesses.map((business) => (
        <BusinessCard
          key={business.id}
          business={business}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
