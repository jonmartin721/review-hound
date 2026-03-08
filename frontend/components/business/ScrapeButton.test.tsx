import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { useStorageMock } = vi.hoisted(() => ({
  useStorageMock: vi.fn(),
}));

vi.mock('@/lib/storage/hooks', () => ({
  useStorage: useStorageMock,
}));

import { ScrapeButton } from './ScrapeButton';

describe('ScrapeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows partial-failure feedback and calls onComplete after a successful scrape', async () => {
    const triggerScrape = vi.fn().mockResolvedValue({
      success: true,
      new_reviews: 3,
      failed_sources: ['bbb'],
    });
    const onComplete = vi.fn();

    useStorageMock.mockReturnValue({ triggerScrape });

    render(<ScrapeButton businessId={7} onComplete={onComplete} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Scrape Now' }));
    });

    expect(screen.getByRole('button', { name: 'Done!' })).toBeInTheDocument();
    expect(screen.getByText('Some sources failed: bbb')).toBeInTheDocument();
    expect(triggerScrape).toHaveBeenCalledWith(7);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Scrape Now' })).toBeEnabled();
  });

  it('shows an error message when the scrape request throws', async () => {
    const triggerScrape = vi.fn().mockRejectedValue(new Error('network down'));
    useStorageMock.mockReturnValue({ triggerScrape });

    render(<ScrapeButton businessId={3} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Scrape Now' }));
    });

    expect(screen.getByRole('button', { name: 'Failed' })).toBeInTheDocument();
    expect(screen.getByText('Error connecting to server')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('button', { name: 'Scrape Now' })).toBeEnabled();
  });
});
