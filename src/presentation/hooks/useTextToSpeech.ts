/**
 * useTextToSpeech — React hook for reading English text aloud with Kokoro TTS.
 *
 * Handles: model loading/caching, synthesis, playback, and a silent fallback to the
 * browser's built-in speechSynthesis if Kokoro fails to load or generate (WASM unsupported,
 * first-time download blocked, etc.) — this is a supporting/UX feature, not a scored one, so
 * degrading quietly to the old robotic voice beats surfacing an error for a "listen" button.
 */

import { useCallback, useRef, useState } from 'react';
import { isTtsModelDownloaded, preloadTtsModel, synthesizeSpeech } from '../../infrastructure/ai/ttsEngine';

export type TtsStatus = 'idle' | 'loading-model' | 'synthesizing' | 'ready' | 'error';

interface UseTextToSpeechReturn {
  status: TtsStatus;
  loadProgress: number;
  error: string | null;
  /** Reads `text` aloud. `text` must be English — Kokoro has no Vietnamese voice. */
  speak: (text: string) => Promise<void>;
  /** Warms up the model in the background (call on mount of a screen that will use speak()). */
  preload: () => void;
  stop: () => void;
}

function speakWithBrowserTts(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [status, setStatus] = useState<TtsStatus>('idle');
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const preloadedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    window.speechSynthesis?.cancel();
  }, []);

  const speak = useCallback(async (text: string) => {
    stop();
    setError(null);

    // Not downloaded yet — go straight to the browser voice. Don't even attempt Kokoro:
    // synthesizeSpeech() would otherwise silently kick off an ~86MB download on first call,
    // including right after the user dismissed the "download?" prompt with "Later".
    if (!isTtsModelDownloaded()) {
      speakWithBrowserTts(text);
      return;
    }

    setStatus('synthesizing');

    try {
      const blob = await synthesizeSpeech(text);
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (objectUrlRef.current === url) objectUrlRef.current = null;
      };
      await audio.play();
      setStatus('ready');
    } catch (err) {
      console.warn('[TextToSpeech] Kokoro failed, falling back to browser voice:', err);
      setError(err instanceof Error ? err.message : 'TTS failed');
      setStatus('error');
      speakWithBrowserTts(text);
    }
  }, [stop]);

  const preload = useCallback(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;

    setStatus('loading-model');
    preloadTtsModel((percent) => setLoadProgress(percent))
      .then(() => {
        setStatus('idle');
        setLoadProgress(100);
      })
      .catch((err) => {
        console.warn('[TextToSpeech] Preload failed:', err);
        preloadedRef.current = false;
        setStatus('idle');
      });
  }, []);

  return { status, loadProgress, error, speak, preload, stop };
}
