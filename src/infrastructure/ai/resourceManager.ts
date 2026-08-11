/**
 * Resource Manager — Handles offline caching, downloading, and deletion of AI models
 * using Browser CacheStorage API.
 *
 * Model: Wav2Vec2 INT8 ONNX (~90MB)
 * Storage: CacheStorage ('talk2me-ai-models-v1')
 */

import { API_BASE_URL } from '../config';
import { createDownloadStore } from './downloadStore';

export const MODEL_DOWNLOAD_URL = `${API_BASE_URL}/phonemes/download-model`;

const CACHE_NAME = 'talk2me-ai-models-v1';
const DOWNLOAD_DATE_KEY = 'talk2me_model_downloaded_at';

// Same purpose as ttsEngine.ts's ttsDownloadStore — lets any mounted component see live,
// correct download progress regardless of which component instance called downloadModel()
// or whether that instance has since unmounted (e.g. user navigated away from Settings).
export const pronunciationDownloadStore = createDownloadStore({
  status: 'idle',
  progress: 0,
});

let inFlightDownload: Promise<Uint8Array> | null = null;

export interface ModelResourceStatus {
  id: string;
  name: string;
  description: string;
  sizeMb: number;
  downloaded: boolean;
  downloadedAt: string | null;
}

/**
 * Check if the AI model is cached in browser CacheStorage.
 */
export async function isModelDownloaded(): Promise<boolean> {
  try {
    if (!('caches' in window)) return false;
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(MODEL_DOWNLOAD_URL);
    return Boolean(match);
  } catch (err) {
    console.warn('[ResourceManager] Error checking cache:', err);
    return false;
  }
}

/**
 * Get detailed status of the AI model resource.
 */
export async function getModelResourceStatus(): Promise<ModelResourceStatus> {
  const downloaded = await isModelDownloaded();
  const downloadedAt = downloaded ? localStorage.getItem(DOWNLOAD_DATE_KEY) : null;

  return {
    id: 'wav2vec2-int8',
    name: 'Model AI Chấm Điểm Phát Âm (Wav2Vec2 INT8)',
    description: 'Mô hình AI suy luận trực tiếp trên trình duyệt, dùng cho các bài tập Shadowing.',
    sizeMb: 90,
    downloaded,
    downloadedAt,
  };
}

/**
 * Get the cached model ArrayBuffer from CacheStorage (if available).
 */
export async function getStoredModelBuffer(): Promise<Uint8Array | null> {
  try {
    if (!('caches' in window)) return null;
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(MODEL_DOWNLOAD_URL);
    if (!response) return null;

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err) {
    console.warn('[ResourceManager] Failed to retrieve cached model:', err);
    return null;
  }
}

/**
 * Download the AI model with progress tracking and store it in CacheStorage.
 */
export async function downloadModel(
  onProgress?: (percent: number) => void
): Promise<Uint8Array> {
  // Dedup: a second call while one is already in flight (e.g. a remounted component after
  // the user navigated away and back) reuses the same download instead of racing a second
  // one — the caller's onProgress won't fire for this call, but pronunciationDownloadStore
  // already reflects the real live progress regardless of who's subscribed.
  if (inFlightDownload !== null) return inFlightDownload;

  inFlightDownload = (async () => {
    pronunciationDownloadStore.setState({ status: 'downloading', progress: 0 });
    const report = (percent: number) => {
      onProgress?.(percent);
      pronunciationDownloadStore.setState({ status: 'downloading', progress: percent });
    };

    try {
      report(2);

      const response = await fetch(MODEL_DOWNLOAD_URL);
      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`;
        try {
          const json = await response.json();
          if (json.detail) errorDetail = json.detail;
        } catch {
          // ignore non-json response
        }
        throw new Error(`Tải model thất bại: ${errorDetail}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 90 * 1024 * 1024;

      let loaded = 0;
      const chunks: Uint8Array[] = [];
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('Trình duyệt không hỗ trợ ReadableStream');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (total > 0) {
          report(Math.min(95, 2 + Math.round((loaded / total) * 93)));
        }
      }

      // Combine chunks into single Uint8Array
      const buffer = new Uint8Array(loaded);
      let offset = 0;
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
      }

      // Save to CacheStorage
      try {
        if ('caches' in window) {
          const cache = await caches.open(CACHE_NAME);
          // Cache the response blob
          const blobResponse = new Response(new Blob([buffer]), {
            headers: { 'Content-Type': 'application/zip' },
          });
          await cache.put(MODEL_DOWNLOAD_URL, blobResponse);
          localStorage.setItem(DOWNLOAD_DATE_KEY, new Date().toISOString());
        }
      } catch (cacheErr) {
        console.warn('[ResourceManager] CacheStorage write warning:', cacheErr);
      }

      report(100);
      pronunciationDownloadStore.setState({ status: 'downloaded', progress: 100 });
      return buffer;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tải model thất bại.';
      pronunciationDownloadStore.setState({ status: 'error', progress: 0, error: message });
      throw err;
    }
  })().finally(() => {
    inFlightDownload = null;
  });

  return inFlightDownload;
}

/**
 * Delete the cached AI model from CacheStorage to free up storage space.
 */
export async function deleteModel(): Promise<void> {
  try {
    if ('caches' in window) {
      await caches.delete(CACHE_NAME);
    }
    localStorage.removeItem(DOWNLOAD_DATE_KEY);
  } catch (err) {
    console.warn('[ResourceManager] Error deleting cached model:', err);
  }
  pronunciationDownloadStore.setState({ status: 'idle', progress: 0 });
}
