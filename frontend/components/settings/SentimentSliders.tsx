'use client';

import { useState, useEffect, useRef } from 'react';
import { useStorage } from '@/lib/storage/hooks';
import { Button } from '@/components/ui/Button';
import {
  SENTIMENT_RATING_WEIGHT,
  SENTIMENT_TEXT_WEIGHT,
  SENTIMENT_THRESHOLD,
} from '@/lib/constants';
import type { SentimentConfig } from '@/lib/storage/types';

const DEFAULTS: SentimentConfig = {
  rating_weight: SENTIMENT_RATING_WEIGHT,
  text_weight: SENTIMENT_TEXT_WEIGHT,
  threshold: SENTIMENT_THRESHOLD,
};

export function SentimentSliders() {
  const storage = useStorage();
  const savedMsgTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sliders store values as raw numbers:
  // ratingWeight: 0–100 (int percent)
  // textWeight:   0–100 (int percent)
  // thresholdInt: 0–50  (int, represents 0.00–0.50)
  const [ratingWeight, setRatingWeight] = useState(
    Math.round(DEFAULTS.rating_weight * 100)
  );
  const [textWeight, setTextWeight] = useState(
    Math.round(DEFAULTS.text_weight * 100)
  );
  const [thresholdInt, setThresholdInt] = useState(
    Math.round(DEFAULTS.threshold * 100)
  );
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    storage.getSentimentConfig()
      .then((cfg) => {
        setRatingWeight(Math.round(cfg.rating_weight * 100));
        setTextWeight(Math.round(cfg.text_weight * 100));
        setThresholdInt(Math.round(cfg.threshold * 100));
      })
      .catch(() => setError('Failed to load sentiment config.'));
  }, [storage]);

  useEffect(() => {
    return () => {
      if (savedMsgTimeoutRef.current) clearTimeout(savedMsgTimeoutRef.current);
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await storage.saveSentimentConfig({
        rating_weight: ratingWeight / 100,
        text_weight: textWeight / 100,
        threshold: thresholdInt / 100,
      });
      setSavedMsg(true);
      savedMsgTimeoutRef.current = setTimeout(() => setSavedMsg(false), 2500);
    } catch {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (
      !confirm('Reset sentiment settings to defaults (70% rating, 30% text)?')
    ) {
      return;
    }
    const prevRating = ratingWeight;
    const prevText = textWeight;
    const prevThreshold = thresholdInt;

    setRatingWeight(Math.round(DEFAULTS.rating_weight * 100));
    setTextWeight(Math.round(DEFAULTS.text_weight * 100));
    setThresholdInt(Math.round(DEFAULTS.threshold * 100));

    setSaving(true);
    setError(null);
    try {
      await storage.saveSentimentConfig(DEFAULTS);
      setSavedMsg(true);
      savedMsgTimeoutRef.current = setTimeout(() => setSavedMsg(false), 2500);
    } catch {
      setRatingWeight(prevRating);
      setTextWeight(prevText);
      setThresholdInt(prevThreshold);
      setError('Failed to reset settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Rating Weight */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Star Rating Weight
          </label>
          <span className="text-sm font-code text-[var(--text-secondary)]">
            {ratingWeight}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={ratingWeight}
          onChange={(e) => setRatingWeight(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-[var(--text-muted)] mt-1">
          How much the star rating (1–5) influences the sentiment score
        </p>
      </div>

      {/* Text Weight */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Text Analysis Weight
          </label>
          <span className="text-sm font-code text-[var(--text-secondary)]">
            {textWeight}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={textWeight}
          onChange={(e) => setTextWeight(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-[var(--text-muted)] mt-1">
          How much the review text analysis influences the sentiment score
        </p>
      </div>

      {/* Classification Threshold */}
      <div className="pt-4 border-t border-[var(--border)]">
        <div className="flex justify-between mb-2">
          <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Classification Threshold
          </label>
          <span className="text-sm font-code text-[var(--text-secondary)]">
            {(thresholdInt / 100).toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={50}
          value={thresholdInt}
          onChange={(e) => setThresholdInt(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Score must be above this value to be classified as positive/negative
          (0 = any non-zero score, 0.5 = strong signal needed)
        </p>
      </div>

      {/* Actions */}
      {error && <p className="text-sm text-[var(--negative)]">{error}</p>}
      <div className="flex items-center justify-between pt-4">
        <Button onClick={handleSave} loading={saving}>
          {savedMsg ? 'Saved!' : 'Save Settings'}
        </Button>
        <Button variant="secondary" onClick={handleReset} disabled={saving}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
