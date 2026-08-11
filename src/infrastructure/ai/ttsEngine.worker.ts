import { KokoroTTS } from 'kokoro-js';
import { env, type ProgressInfo } from '@huggingface/transformers';

// Configure HuggingFace Transformers.js environment.
// Fixes CORS policy blocking on Cloudflare Workers (*.workers.dev) when fetching models from huggingface.co.
env.allowLocalModels = false;
env.remoteHost = 'https://hf-mirror.com/';

// Runs entirely off the main thread — long synthesis calls (long text) no longer block
// UI rendering / input, which is what previously made the browser show a "page
// unresponsive" prompt. See ttsEngine.ts for the main-thread side of this protocol.
//
// NOTE: localStorage is not available inside a Dedicated Worker (not part of
// WorkerGlobalScope per spec) — the "model downloaded" flag bookkeeping stays on the
// main thread, not here.

const ctx = self as unknown as Worker;

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const VOICE = 'af_heart';

export type ToWorkerMessage =
  | { type: 'preload' }
  | { type: 'synthesize'; requestId: number; text: string };

export type FromWorkerMessage =
  | { type: 'progress'; percent: number }
  | { type: 'preload-done' }
  | { type: 'preload-error'; message: string }
  | { type: 'synthesize-done'; requestId: number; blob: Blob }
  | { type: 'synthesize-error'; requestId: number; message: string };

function post(message: FromWorkerMessage): void {
  ctx.postMessage(message);
}

let cachedTts: KokoroTTS | null = null;
let loadingPromise: Promise<KokoroTTS> | null = null;

async function loadModel(onProgress?: (percent: number) => void): Promise<KokoroTTS> {
  const progress_callback = (progress: ProgressInfo) => {
    if (progress.status === 'progress' && onProgress) {
      onProgress(Math.round(progress.progress));
    }
  };

  // WASM only — same rationale as before the worker move: WebGPU produced corrupted
  // ("beeping") audio, most likely because Kokoro's vocoder ops (e.g. iSTFT) aren't
  // yet reliable on the WebGPU execution provider.
  return KokoroTTS.from_pretrained(MODEL_ID, {
    dtype: 'q8',
    device: 'wasm',
    progress_callback,
  });
}

async function getTts(onProgress?: (percent: number) => void): Promise<KokoroTTS> {
  if (cachedTts) return cachedTts;
  if (loadingPromise) return loadingPromise;

  loadingPromise = loadModel(onProgress).then(async (tts) => {
    cachedTts = tts;
    // ONNX Runtime compiles/optimizes its execution graph lazily on the FIRST
    // inference — absorb that one-time cost here (during preload) instead of on the
    // user's first real synthesize call.
    try {
      await tts.generate('Hello', { voice: VOICE });
    } catch (err) {
      console.warn('[TtsWorker] Warm-up synthesis failed (non-fatal):', err);
    }
    return tts;
  }).finally(() => {
    loadingPromise = null;
  });

  return loadingPromise;
}

ctx.addEventListener('message', async (event: MessageEvent<ToWorkerMessage>) => {
  const msg = event.data;

  if (msg.type === 'preload') {
    try {
      await getTts((percent) => post({ type: 'progress', percent }));
      post({ type: 'preload-done' });
    } catch (err) {
      post({ type: 'preload-error', message: err instanceof Error ? err.message : String(err) });
    }
    return;
  }

  if (msg.type === 'synthesize') {
    try {
      const tts = await getTts();
      const audio = await tts.generate(msg.text, { voice: VOICE });
      const blob = audio.toBlob();
      post({ type: 'synthesize-done', requestId: msg.requestId, blob });
    } catch (err) {
      post({
        type: 'synthesize-error',
        requestId: msg.requestId,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
});
