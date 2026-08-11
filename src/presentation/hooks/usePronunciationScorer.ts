/**
 * usePronunciationScorer — React hook for managing pronunciation scoring lifecycle.
 *
 * Handles: model loading, audio scoring, state management, and caching.
 */

import { useState, useCallback, useRef } from 'react';
import type { ShadowingResult } from '../../core/entities';
import {
  scorePronounciation,
  preloadModel,
  type ScorerStatus,
} from '../../infrastructure/ai/pronunciationScorer';

interface UsePronunciationScorerReturn {
  /** Current status of the scorer */
  status: ScorerStatus;
  /** Model download progress (0-100) */
  loadProgress: number;
  /** Latest scoring result */
  result: ShadowingResult | null;
  /** Error message if status === 'error' */
  error: string | null;
  /** Score an audio blob against target text */
  scoreAudio: (audioBlob: Blob, targetText: string) => Promise<ShadowingResult | null>;
  /** Preload the model in background */
  preload: () => void;
  /** Reset state (clear result) */
  reset: () => void;
}

export function usePronunciationScorer(): UsePronunciationScorerReturn {
  const [status, setStatus] = useState<ScorerStatus>('idle');
  const [loadProgress, setLoadProgress] = useState(0);
  const [result, setResult] = useState<ShadowingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preloadedRef = useRef(false);

  const scoreAudio = useCallback(async (
    audioBlob: Blob,
    targetText: string
  ): Promise<ShadowingResult | null> => {
    setError(null);
    setResult(null);

    try {
      const scoringResult = await scorePronounciation(
        audioBlob,
        targetText,
        (percent) => setLoadProgress(percent),
        (newStatus) => setStatus(newStatus)
      );

      setResult(scoringResult);
      setStatus('ready');
      return scoringResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scoring failed';
      setError(message);
      setStatus('error');
      console.error('[PronunciationScorer] Error:', err);
      return null;
    }
  }, []);

  const preload = useCallback(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;

    setStatus('loading-model');
    preloadModel((percent) => setLoadProgress(percent))
      .then(() => {
        setStatus('idle');
        setLoadProgress(100);
      })
      .catch((err) => {
        console.warn('[PronunciationScorer] Preload failed:', err);
        preloadedRef.current = false;
        setStatus('idle');
      });
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setStatus('idle');
  }, []);

  return {
    status,
    loadProgress,
    result,
    error,
    scoreAudio,
    preload,
    reset,
  };
}
