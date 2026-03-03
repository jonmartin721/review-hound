'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStorage } from '../storage/hooks';

export function useScheduler() {
  const storage = useStorage();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const runScheduledScrape = useCallback(async () => {
    if (!isDemo) return;

    try {
      const config = await storage.getSchedulerConfig();
      const now = new Date();

      // Check if enough time has passed since last run
      if (config.last_run) {
        const lastRun = new Date(config.last_run);
        const hoursSinceRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
        if (hoursSinceRun < config.interval_hours) return;
      }

      // Scrape all businesses
      const businesses = await storage.getBusinesses();
      for (const biz of businesses) {
        try {
          await storage.triggerScrape(biz.id);
        } catch {
          // Silently continue on failure
        }
      }

      // Update last run
      await storage.saveSchedulerConfig({
        ...config,
        last_run: now.toISOString(),
      });
    } catch {
      // Scheduler errors shouldn't crash the app
    }
  }, [isDemo, storage]);

  useEffect(() => {
    if (!isDemo) return;

    // Run once on mount (with a delay to let the page load)
    const initialTimeout = setTimeout(() => {
      runScheduledScrape();
    }, 5000);

    // Then set interval (check every 5 minutes, actual scrape gated by config.interval_hours)
    intervalRef.current = setInterval(runScheduledScrape, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isDemo, runScheduledScrape]);
}
