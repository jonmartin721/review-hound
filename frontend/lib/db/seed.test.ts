import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  alertAddMock,
  apiConfigAddMock,
  businessAddMock,
  businessCountMock,
  getWorkspaceModeMock,
  reviewAddMock,
  schedulerAddMock,
  scrapeLogAddMock,
  sentimentAddMock,
} = vi.hoisted(() => {
  let nextBusinessId = 1;

  return {
    alertAddMock: vi.fn(() => Promise.resolve()),
    apiConfigAddMock: vi.fn(() => Promise.resolve()),
    businessAddMock: vi.fn(() => Promise.resolve(nextBusinessId++)),
    businessCountMock: vi.fn(() => Promise.resolve(0)),
    getWorkspaceModeMock: vi.fn(() => 'sample'),
    reviewAddMock: vi.fn(() => Promise.resolve()),
    schedulerAddMock: vi.fn(() => Promise.resolve()),
    scrapeLogAddMock: vi.fn(() => Promise.resolve()),
    sentimentAddMock: vi.fn(() => Promise.resolve()),
  };
});

vi.mock('../portfolio', () => ({
  getWorkspaceMode: getWorkspaceModeMock,
}));

vi.mock('./schema', () => ({
  db: {
    businesses: {
      count: businessCountMock,
      add: businessAddMock,
    },
    reviews: {
      add: reviewAddMock,
    },
    scrapeLogs: {
      add: scrapeLogAddMock,
    },
    alertConfigs: {
      add: alertAddMock,
    },
    apiConfigs: {
      add: apiConfigAddMock,
    },
    sentimentConfig: {
      add: sentimentAddMock,
    },
    schedulerConfig: {
      add: schedulerAddMock,
    },
  },
}));

import {
  SAMPLE_API_CONFIGS,
  SAMPLE_BUSINESSES,
  SAMPLE_REVIEWS,
  SAMPLE_SCRAPE_LOGS,
} from '../demo/sample-mode';
import { seedDemoData } from './seed';

describe('seedDemoData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    businessCountMock.mockResolvedValue(0);
    getWorkspaceModeMock.mockReturnValue('sample');
  });

  it('seeds the expanded sample workspace, including demo API configs', async () => {
    await seedDemoData();

    expect(businessAddMock).toHaveBeenCalledTimes(SAMPLE_BUSINESSES.length);
    expect(reviewAddMock).toHaveBeenCalledTimes(SAMPLE_REVIEWS.length);
    expect(scrapeLogAddMock).toHaveBeenCalledTimes(SAMPLE_SCRAPE_LOGS.length);
    expect(apiConfigAddMock).toHaveBeenCalledTimes(SAMPLE_API_CONFIGS.length);

    const providers = apiConfigAddMock.mock.calls.map(([arg]) => arg.provider);
    expect(providers).toEqual(SAMPLE_API_CONFIGS.map((config) => config.provider));
    expect(apiConfigAddMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google_places',
        api_key: 'demo-google-places-key',
        enabled: true,
      })
    );
    expect(apiConfigAddMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'resend_from_email',
        api_key: 'alerts@sample.reviewhound.local',
        enabled: true,
      })
    );
    expect(sentimentAddMock).toHaveBeenCalledTimes(1);
    expect(schedulerAddMock).toHaveBeenCalledTimes(1);
  });

  it('skips seeding when the workspace is not sample mode', async () => {
    getWorkspaceModeMock.mockReturnValue('blank');

    await seedDemoData();

    expect(businessAddMock).not.toHaveBeenCalled();
    expect(reviewAddMock).not.toHaveBeenCalled();
    expect(apiConfigAddMock).not.toHaveBeenCalled();
  });

  it('skips seeding when data already exists', async () => {
    businessCountMock.mockResolvedValue(2);

    await seedDemoData();

    expect(businessAddMock).not.toHaveBeenCalled();
    expect(reviewAddMock).not.toHaveBeenCalled();
    expect(apiConfigAddMock).not.toHaveBeenCalled();
  });
});
