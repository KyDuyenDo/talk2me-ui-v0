import type { FromWorkerMessage, ToWorkerMessage } from './ttsEngine.worker';
import { createDownloadStore } from './downloadStore';

// English only — Kokoro has no Vietnamese voice. Callers must only pass English text (see
// call sites: flashcard front/term text, Writing/Speaking prompts, pronunciation practice —
// never flashcard back/definition text, which is often Vietnamese and stays on the browser's
// native speechSynthesis).
const DOWNLOADED_AT_KEY = 'talk2me_tts_downloaded_at';

// Lets any mounted component (e.g. ResourceManagerSection, even a fresh instance after
// the one that started the download was unmounted by navigating away) see the true,
// live download progress — see downloadStore.ts.
export const ttsDownloadStore = createDownloadStore({
  status: (() => {
    try {
      return localStorage.getItem(DOWNLOADED_AT_KEY) ? 'downloaded' : 'idle';
    } catch {
      return 'idle';
    }
  })(),
  progress: 0,
});

// Actual model loading + KokoroTTS.generate() runs in ttsEngine.worker.ts, off the main
// thread — long synthesis calls no longer block UI rendering/input (previously long text
// could run WASM inference on the main thread long enough for the browser to show a
// "page unresponsive" prompt). This file is a thin RPC wrapper that preserves the exact
// same exported function signatures as before the worker move, so no caller needs to change.
let ttsWorker: Worker | null = null;
let loadingPromise: Promise<void> | null = null;
let nextRequestId = 1;
const pendingSynthesis = new Map<number, { resolve: (blob: Blob) => void; reject: (err: Error) => void }>();

function getWorker(): Worker {
  if (ttsWorker) return ttsWorker;

  const worker = new Worker(new URL('./ttsEngine.worker.ts', import.meta.url), { type: 'module' });

  worker.addEventListener('message', (event: MessageEvent<FromWorkerMessage>) => {
    const msg = event.data;
    if (msg.type === 'synthesize-done') {
      pendingSynthesis.get(msg.requestId)?.resolve(msg.blob);
      pendingSynthesis.delete(msg.requestId);
    } else if (msg.type === 'synthesize-error') {
      pendingSynthesis.get(msg.requestId)?.reject(new Error(msg.message));
      pendingSynthesis.delete(msg.requestId);
    }
    // 'progress' / 'preload-done' / 'preload-error' are handled by the one-off listener
    // registered inside preloadTtsModel() for the in-flight preload call, not here.
  });

  // The worker itself failing to load/parse is a new failure mode this file didn't have
  // before (no worker = nothing to crash) — without this, any pending preload/synthesize
  // promise would hang forever instead of rejecting into the existing browser-TTS fallback
  // path in useTextToSpeech.ts.
  worker.addEventListener('error', (event: ErrorEvent) => {
    const err = new Error(event.message || 'TTS worker crashed');
    for (const { reject } of pendingSynthesis.values()) reject(err);
    pendingSynthesis.clear();
  });

  ttsWorker = worker;
  return worker;
}

function postToWorker(message: ToWorkerMessage): void {
  getWorker().postMessage(message);
}

// Repeat plays of the same text (very common — flashcards get replayed, users flip back and
// forth) skip synthesis entirely. Small bound so a long session doesn't grow this forever.
const audioCache = new Map<string, Blob>();
const AUDIO_CACHE_MAX_ENTRIES = 50;

function cacheAudio(text: string, blob: Blob): void {
  if (audioCache.size >= AUDIO_CACHE_MAX_ENTRIES) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey !== undefined) audioCache.delete(oldestKey);
  }
  audioCache.set(text, blob);
}

export function isTtsModelDownloaded(): boolean {
  try {
    return Boolean(localStorage.getItem(DOWNLOADED_AT_KEY));
  } catch {
    return false;
  }
}

export function getTtsDownloadedAt(): string | null {
  try {
    return localStorage.getItem(DOWNLOADED_AT_KEY);
  } catch {
    return null;
  }
}

export async function preloadTtsModel(onProgress?: (percent: number) => void): Promise<void> {
  if (loadingPromise !== null) return loadingPromise;

  ttsDownloadStore.setState({ status: 'downloading', progress: 0 });

  loadingPromise = new Promise<void>((resolve, reject) => {
    const worker = getWorker();

    const onMessage = (event: MessageEvent<FromWorkerMessage>) => {
      const msg = event.data;
      if (msg.type === 'progress') {
        onProgress?.(msg.percent);
        ttsDownloadStore.setState({ status: 'downloading', progress: msg.percent });
      } else if (msg.type === 'preload-done') {
        worker.removeEventListener('message', onMessage);
        try {
          localStorage.setItem(DOWNLOADED_AT_KEY, new Date().toISOString());
        } catch {
          // localStorage unavailable (private mode etc.) — not fatal, just loses the
          // "already downloaded" UI hint; the model is still cached by the worker/browser.
        }
        ttsDownloadStore.setState({ status: 'downloaded', progress: 100 });
        resolve();
      } else if (msg.type === 'preload-error') {
        worker.removeEventListener('message', onMessage);
        ttsDownloadStore.setState({ status: 'error', progress: 0, error: msg.message });
        reject(new Error(msg.message));
      }
    };

    worker.addEventListener('message', onMessage);
    postToWorker({ type: 'preload' });
  }).finally(() => {
    loadingPromise = null;
  });

  return loadingPromise;
}

export async function synthesizeSpeech(text: string): Promise<Blob> {
  const cached = audioCache.get(text);
  if (cached) return cached;

  const blob = await new Promise<Blob>((resolve, reject) => {
    const requestId = nextRequestId++;
    pendingSynthesis.set(requestId, { resolve, reject });
    postToWorker({ type: 'synthesize', requestId, text });
  });

  cacheAudio(text, blob);
  return blob;
}

/** Best-effort — Transformers.js manages its own browser Cache Storage entry internally
 * (default cache name `transformers-cache`) with no official public API to clear just this
 * model, so this clears that cache wholesale plus our own "downloaded" flag. */
export async function deleteTtsModel(): Promise<void> {
  // Terminate the worker so its in-memory KokoroTTS instance is dropped too — otherwise
  // the next synthesize call would keep using the already-loaded model even though its
  // downloaded files were just cleared from Cache Storage below. A fresh worker is created
  // lazily on the next call.
  ttsWorker?.terminate();
  ttsWorker = null;
  for (const { reject } of pendingSynthesis.values()) reject(new Error('TTS model deleted'));
  pendingSynthesis.clear();

  audioCache.clear();
  try {
    localStorage.removeItem(DOWNLOADED_AT_KEY);
  } catch {
    // ignore
  }
  try {
    if ('caches' in window) {
      await caches.delete('transformers-cache');
    }
  } catch {
    // ignore — best-effort only
  }
  ttsDownloadStore.setState({ status: 'idle', progress: 0 });
}
