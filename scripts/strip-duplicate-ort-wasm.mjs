// Removes onnxruntime-web's own bundled .wasm files from the Vite build output.
//
// pronunciationScorer.ts explicitly redirects `ort.env.wasm.wasmPaths` to the backend's
// /ort static mount (see talk2me-api/main.py — files served cross-origin, not from this
// app's own bundle), so the onnxruntime-web package's bundled .wasm files are never
// actually fetched from the frontend's own origin. Vite/Rollup still copies them into
// dist/assets anyway because onnxruntime-web internally references them via
// `new URL(..., import.meta.url)`, which Rollup's asset scanner picks up regardless of
// the runtime wasmPaths override. Left in place, one of them
// (ort-wasm-simd-threaded.jsep.wasm, ~26.8MB) exceeds Cloudflare Workers' 25 MiB
// per-asset limit and breaks `wrangler deploy`.
//
// Only removes files matching onnxruntime-web's OWN wasm file sizes (its dist/ directory
// is the source of truth) — NOT @huggingface/transformers' separately nested, older,
// smaller onnxruntime-web copy, which kokoro-js/ttsEngine.worker.ts actually relies on
// being bundled locally (no wasmPaths override exists for that path).
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const ORT_DIR = 'node_modules/onnxruntime-web/dist';
const DIST_ASSETS = 'dist/assets';

const ortWasmSizes = new Set(
  readdirSync(ORT_DIR)
    .filter((f) => f.endsWith('.wasm'))
    .map((f) => statSync(join(ORT_DIR, f)).size)
);

let removed = 0;
for (const file of readdirSync(DIST_ASSETS)) {
  if (!file.endsWith('.wasm')) continue;
  const full = join(DIST_ASSETS, file);
  if (file.includes('ort-wasm') || ortWasmSizes.has(statSync(full).size)) {
    unlinkSync(full);
    console.log(`[strip-duplicate-ort-wasm] removed unused ${file} (served via CDN)`);
    removed++;
  }
}

if (removed === 0) {
  console.log('[strip-duplicate-ort-wasm] nothing to remove');
}
