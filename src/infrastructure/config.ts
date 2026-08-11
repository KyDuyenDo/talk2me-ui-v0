/**
 * Centralized environment config for Talk2Me UI.
 *
 * All Vite env vars (prefixed with VITE_) are read here so that the rest of
 * the codebase imports from this single module instead of scattering
 * `import.meta.env.*` across dozens of files.
 */

/** Base URL for the Talk2Me FastAPI backend (no trailing slash). */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:8000/api/v1';

/** Base URL for ONNX Runtime WASM files (CDN for max speed & zero cold-start delay). */
export const ORT_WASM_BASE_URL: string =
  import.meta.env.VITE_ORT_WASM_BASE_URL || 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

/**
 * Chrome extension ID for the Talk2Me Transcript Helper (see talk2me-extension/README.md).
 * Chrome assigns this randomly per "Load unpacked" install, so it's environment-specific and
 * has no sensible hardcoded default — empty means the extension integration is disabled and
 * transcript fetching falls back to the backend's own (unreliable) yt-dlp attempt.
 */
export const YT_TRANSCRIPT_EXTENSION_ID: string = import.meta.env.VITE_YT_TRANSCRIPT_EXTENSION_ID || '';
