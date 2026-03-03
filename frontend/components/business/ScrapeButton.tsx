'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { useStorage } from '@/lib/storage/hooks';

interface ScrapeButtonProps {
  businessId: number;
  onComplete?: () => void;
}

export function ScrapeButton({ businessId, onComplete }: ScrapeButtonProps) {
  const storage = useStorage();
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleScrape = useCallback(async () => {
    setState('loading');
    setErrorMsg(null);
    try {
      const result = await storage.triggerScrape(businessId);
      if (result.success) {
        setState('done');
        if (result.failed_sources && result.failed_sources.length > 0) {
          setErrorMsg(`Some sources failed: ${result.failed_sources.join(', ')}`);
        }
        timeoutRef.current = setTimeout(() => {
          setState('idle');
          onComplete?.();
        }, 1500);
      } else {
        setState('error');
        setErrorMsg('Scrape failed');
        timeoutRef.current = setTimeout(() => setState('idle'), 2000);
      }
    } catch {
      setState('error');
      setErrorMsg('Error connecting to server');
      timeoutRef.current = setTimeout(() => setState('idle'), 2000);
    }
  }, [storage, businessId, onComplete]);

  const label =
    state === 'loading'
      ? 'Scraping...'
      : state === 'done'
      ? 'Done!'
      : state === 'error'
      ? 'Failed'
      : 'Scrape Now';

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="primary"
        loading={state === 'loading'}
        disabled={state === 'loading' || state === 'done'}
        onClick={handleScrape}
      >
        {label}
      </Button>
      {errorMsg && (
        <p className="text-xs text-amber-600 dark:text-amber-400 max-w-48 text-right">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
