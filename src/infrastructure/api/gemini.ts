import { API_BASE_URL } from '../config';

const API_BASE = API_BASE_URL;
const JWT_STORAGE_KEY = 'talk2me_jwt_token';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(JWT_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface GeminiModel {
  id: string;
  name: string;
  description: string;
}

export interface GeminiConfig {
  apiKey: string;
  useCustomKey: boolean;
  models: {
    defaultModel: string;
    courseGenerator: string;
    flashcardGenerator: string;
    writingGrader: string;
    quizGenerator: string;
  };
}

// No model id is ever hardcoded here — Gemini's model line-up evolves over time, so every
// slot starts empty and gets filled in from the LIVE catalog (via the backend's
// GET /llm/models proxy — Gemini's own ListModels endpoint requires a key on every call,
// unlike OpenRouter's old public /models, so the frontend never calls Google directly).
export const DEFAULT_CONFIG: GeminiConfig = {
  apiKey: '',
  useCustomKey: false,
  models: {
    defaultModel: '',
    courseGenerator: '',
    flashcardGenerator: '',
    writingGrader: '',
    quizGenerator: '',
  },
};

/**
 * Deterministically picks a model id from the LIVE catalog. If `preferKeywords` is given,
 * prefers the first model whose id matches one of them (e.g. `['flash-lite']` for a speed
 * preset, `['pro']` for a deep-reasoning preset) — these are Gemini's own stable tier-naming
 * conventions, not a specific model version, so this never hardcodes a rotting id. Falls back
 * to a seeded rotation through the catalog so different slots/presets land on different
 * models when no keyword matches.
 */
export function pickModelId(catalog: GeminiModel[], preferKeywords: string[] = [], seed = 0): string {
  if (catalog.length === 0) return '';
  if (preferKeywords.length > 0) {
    const match = catalog.find((m) => preferKeywords.some((kw) => m.id.toLowerCase().includes(kw)));
    if (match) return match.id;
  }
  const index = ((seed % catalog.length) + catalog.length) % catalog.length;
  return catalog[index].id;
}

/**
 * Fills in any empty or no-longer-live model slot from the live catalog. Call this whenever
 * the live catalog becomes available so a config saved before a model was retired — or one
 * that was never set — self-heals against whatever Gemini actually serves right now.
 */
export function resolveModelSlots(
  models: GeminiConfig['models'],
  catalog: GeminiModel[]
): GeminiConfig['models'] {
  if (catalog.length === 0) return models; // nothing to validate against yet

  const liveIds = new Set(catalog.map((m) => m.id));
  const keys: (keyof GeminiConfig['models'])[] = [
    'defaultModel',
    'courseGenerator',
    'flashcardGenerator',
    'writingGrader',
    'quizGenerator',
  ];

  const resolved = { ...models };
  keys.forEach((key, i) => {
    const current = resolved[key];
    if (!current || !liveIds.has(current)) {
      resolved[key] = pickModelId(catalog, [], i);
    }
  });
  return resolved;
}

/**
 * Module-level cache: populated by fetchLiveModels() on first successful call, so callers
 * that don't want to re-fetch (e.g. generateCompletion) can read the last known catalog.
 */
let cachedLiveCatalog: GeminiModel[] = [];

export function getCachedLiveCatalog(): GeminiModel[] {
  return cachedLiveCatalog;
}

/**
 * Fetches Gemini's live model catalog through the backend proxy (GET /llm/models) — never
 * calls Google directly, since ListModels requires a key on every request and the shared
 * system key must never leave the server. Pass `apiKeyHint` to preview the catalog for a
 * BYOK key the user is typing but hasn't saved yet; omit it to browse using the system key.
 */
export async function fetchLiveModels(apiKeyHint?: string): Promise<GeminiModel[]> {
  const url = new URL(`${API_BASE}/llm/models`);
  if (apiKeyHint && apiKeyHint.trim()) {
    url.searchParams.set('apiKey', apiKeyHint.trim());
  }

  const response = await fetch(url.toString(), { headers: authHeaders() });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Không lấy được danh sách model từ Gemini (mã lỗi ${response.status})`);
  }

  const models: GeminiModel[] = await response.json();
  cachedLiveCatalog = models;
  return models;
}

const STORAGE_KEY = 't2m_gemini_config';

export function getStoredConfig(): GeminiConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_CONFIG;
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      models: {
        ...DEFAULT_CONFIG.models,
        ...(parsed.models || {}),
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveStoredConfig(config: GeminiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Gemini config to localStorage', e);
  }
}

export async function testGeminiKey(apiKey: string): Promise<{
  success: boolean;
  message: string;
  data?: { modelCount: number };
}> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Vui lòng nhập API Key để kiểm tra.' };
  }

  try {
    const models = await fetchLiveModels(apiKey);
    return {
      success: true,
      message: 'Kết nối thành công! API Key hoạt động bình thường.',
      data: { modelCount: models.length },
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Không thể kết nối đến Gemini API. Vui lòng kiểm tra mạng của bạn.',
    };
  }
}

function buildLlmConfigPayload(config: GeminiConfig) {
  return {
    apiKey: config.useCustomKey && config.apiKey.trim() ? config.apiKey.trim() : '',
    models: {
      defaultModel: config.models.defaultModel,
      courseGenerator: config.models.courseGenerator,
      quizGenerator: config.models.quizGenerator,
      writingGrader: config.models.writingGrader,
    },
    outputLanguage: 'vi',
  };
}

/**
 * Generates a single completion via the backend's POST /llm/generate — brokered through
 * FastAPI (not called directly from the browser) so this works even for users who haven't
 * configured their own BYOK key (falls back to the shared system key server-side), unlike
 * the old OpenRouter integration which silently sent unauthenticated requests in that case.
 */
export async function generateCompletion(
  prompt: string,
  modelId?: string,
  systemInstruction?: string
): Promise<string> {
  const config = getStoredConfig();

  const response = await fetch(`${API_BASE}/llm/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      prompt,
      systemInstruction,
      model: modelId || undefined,
      llmConfig: buildLlmConfigPayload(config),
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Lỗi khi gọi Gemini API (mã ${response.status})`);
  }

  const data = await response.json();
  return data.text as string;
}
