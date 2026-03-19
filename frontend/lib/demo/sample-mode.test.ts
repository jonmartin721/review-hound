import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getWorkspaceModeMock, isPortfolioModeState } = vi.hoisted(() => ({
  getWorkspaceModeMock: vi.fn(() => 'sample'),
  isPortfolioModeState: { value: true },
}));

vi.mock('../portfolio', () => ({
  getWorkspaceMode: getWorkspaceModeMock,
  get IS_PORTFOLIO_MODE() {
    return isPortfolioModeState.value;
  },
}));

import {
  SAMPLE_ALERT_CONFIGS,
  getSampleGooglePlacesResults,
  getSampleScrapeReviews,
  getSampleSourceSearchResults,
  getSampleSentiment,
  getSampleYelpResults,
  isSampleModeWorkspace,
} from './sample-mode';

describe('sample-mode helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWorkspaceModeMock.mockReturnValue('sample');
    isPortfolioModeState.value = true;
  });

  it('detects when the sample workspace is active', () => {
    expect(isSampleModeWorkspace()).toBe(true);

    getWorkspaceModeMock.mockReturnValue('blank');
    expect(isSampleModeWorkspace()).toBe(false);

    getWorkspaceModeMock.mockReturnValue('sample');
    isPortfolioModeState.value = false;
    expect(isSampleModeWorkspace()).toBe(false);
  });

  it('returns seeded API search results for known businesses', () => {
    const googleResults = getSampleGooglePlacesResults('Lakeside Dental Group', 'Austin, TX');
    const yelpResults = getSampleYelpResults('Harbor Fresh Market', 'Seattle, WA');

    expect(googleResults[0]).toMatchObject({
      name: 'Lakeside Dental Group',
      place_id: 'ChIJlakesidedental',
    });
    expect(yelpResults[0]).toMatchObject({
      name: 'Harbor Fresh Market',
      business_id: 'harbor-fresh-market-seattle',
    });
  });

  it('returns seeded web-source search results for matching businesses', () => {
    const results = getSampleSourceSearchResults('Riverstone Home Services', 'Phoenix, AZ');

    expect(results.trustpilot[0]).toMatchObject({
      name: 'Riverstone Home Services',
      url: 'https://www.trustpilot.com/review/riverstonehome.com',
    });
    expect(results.bbb[0]).toMatchObject({
      name: 'Riverstone Home Services',
      url: 'https://www.bbb.org/us/az/phoenix/profile/home-services/riverstone-home-services',
    });
  });

  it('falls back to deterministic sample search results for unknown queries', () => {
    const results = getSampleGooglePlacesResults('Qzrmxpl');

    expect(results).toHaveLength(3);
    expect(results[0]).toMatchObject({
      name: 'Qzrmxpl',
      address: 'Sample City, USA',
      place_id: 'sample-qzrmxpl-1',
    });
  });

  it('falls back to deterministic sample web-source search results for unknown queries', () => {
    const results = getSampleSourceSearchResults('Qzrmxpl Bikes', 'Boise, ID');

    expect(results.trustpilot[0]).toMatchObject({
      name: 'Qzrmxpl Bikes',
      url: 'https://www.trustpilot.com/review/qzrmxpl-bikes.example',
    });
    expect(results.bbb[0]).toMatchObject({
      name: 'Qzrmxpl Bikes',
      url: 'https://www.bbb.org/us/sample/profile/qzrmxpl-bikes',
    });
  });

  it('returns only unseen queued scrape reviews for API-backed sample sources', () => {
    const reviews = getSampleScrapeReviews('yelp_api', 'acme-coffee-portland', ['acme-yapi-q1']);

    expect(reviews.map((review) => review.external_id)).toEqual([
      'acme-yapi-q2',
      'acme-yapi-q3',
    ]);
  });

  it('returns queued reviews for web-scraped sample sources too', () => {
    const reviews = getSampleScrapeReviews(
      'trustpilot',
      'https://www.trustpilot.com/review/acmecoffee.com',
      ['acme-tp-q1']
    );

    expect(reviews.map((review) => review.external_id)).toEqual([
      'acme-tp-q2',
      'acme-tp-q3',
    ]);
  });

  it('derives stable local sentiment for mocked scrape reviews', () => {
    expect(getSampleSentiment('Friendly staff and fast service.', 5)).toEqual({
      score: 0.72,
      label: 'positive',
    });
    expect(getSampleSentiment('Late pickup and rude follow-up.', 2)).toEqual({
      score: -0.62,
      label: 'negative',
    });
    expect(getSampleSentiment('Perfectly adequate visit.', 3)).toEqual({
      score: 0.04,
      label: 'neutral',
    });
  });

  it('keeps seeded alert thresholds within the UI-supported star range', () => {
    expect(SAMPLE_ALERT_CONFIGS.every((config) => config.negative_threshold >= 1 && config.negative_threshold <= 5)).toBe(true);
  });
});
