import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusinessWithStats } from '@/lib/storage/types';

const { getWorkspaceModeMock, pushMock, useStorageMock } = vi.hoisted(() => ({
  getWorkspaceModeMock: vi.fn(() => 'sample'),
  pushMock: vi.fn(),
  useStorageMock: vi.fn(),
}));

vi.mock('@/lib/storage/hooks', () => ({
  useStorage: useStorageMock,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/lib/portfolio', () => ({
  IS_PORTFOLIO_MODE: true,
  getWorkspaceMode: getWorkspaceModeMock,
}));

import DashboardPage from './page';

function buildBusiness(): BusinessWithStats {
  return {
    id: 1,
    name: 'Acme Coffee Co.',
    address: 'Portland, OR',
    trustpilot_url: 'https://example.com/acme',
    bbb_url: null,
    yelp_url: null,
    google_place_id: null,
    yelp_business_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_reviews: 14,
    avg_rating: 4.6,
    positive_pct: 78,
    negative_pct: 8,
    trend_direction: 'up',
    trend_delta: 0.8,
    recent_count: 4,
    last_review_date: new Date().toISOString(),
    recent_negative_count: 1,
    scrape_issues: false,
    scrape_issue_sources: [],
    scrape_issue_type: null,
  };
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWorkspaceModeMock.mockReturnValue('sample');
  });

  it('loads businesses and renders portfolio workspace context', async () => {
    const getBusinesses = vi.fn().mockResolvedValue([buildBusiness()]);
    useStorageMock.mockReturnValue({ getBusinesses });

    render(<DashboardPage />);

    expect(await screen.findByText('Acme Coffee Co.')).toBeInTheDocument();
    expect(screen.getByText('Sample workspace only')).toBeInTheDocument();
    expect(getBusinesses).toHaveBeenCalledTimes(1);
  });

  it('shows a retry path when loading businesses fails', async () => {
    const getBusinesses = vi
      .fn()
      .mockRejectedValueOnce(new Error('backend offline'))
      .mockResolvedValueOnce([buildBusiness()]);
    useStorageMock.mockReturnValue({ getBusinesses });

    render(<DashboardPage />);

    expect(await screen.findByText('Connection Error')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByText('Acme Coffee Co.')).toBeInTheDocument();
    });
    expect(getBusinesses).toHaveBeenCalledTimes(2);
  });
});
