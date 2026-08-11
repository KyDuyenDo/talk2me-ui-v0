import { getStoredConfig } from './gemini';
import { API_BASE_URL } from '../config';
import type { Course, WritingEvaluation, SpeakingEvaluation, Flashcard, FlashcardSet, FlashcardFolder, UserProfile } from '../../core/entities';

const API_BASE = API_BASE_URL;
const JWT_STORAGE_KEY = 'talk2me_jwt_token';
const REFRESH_STORAGE_KEY = 'talk2me_refresh_token';

interface LLMConfigPayload {
  apiKey: string;
  models: {
    defaultModel: string;
    courseGenerator: string;
    quizGenerator: string;
    writingGrader: string;
  };
  outputLanguage: string;
}

/**
 * Builds the llm_config payload sent on every generation/grading request from the
 * user's client-side Gemini settings.
 */
export function buildLlmConfig(): LLMConfigPayload {
  const config = getStoredConfig();
  const customKey = config.apiKey ? config.apiKey.trim() : '';
  return {
    apiKey: customKey,
    models: {
      defaultModel: config.models.defaultModel,
      courseGenerator: config.models.courseGenerator,
      quizGenerator: config.models.quizGenerator,
      writingGrader: config.models.writingGrader,
    },
    outputLanguage: 'vi',
  };
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(JWT_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

let refreshPromise: Promise<string | null> | null = null;

async function doRefreshTokenApi(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_STORAGE_KEY);
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.access_token && data.refresh_token) {
      localStorage.setItem(JWT_STORAGE_KEY, data.access_token);
      localStorage.setItem(REFRESH_STORAGE_KEY, data.refresh_token);
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Refreshes the access token, coalescing concurrent callers onto a single in-flight
 * request so simultaneous 401s don't race each other into a spurious logout.
 */
export function refreshTokenApi(): Promise<string | null> {
  refreshPromise ??= doRefreshTokenApi().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

function forceLogout() {
  localStorage.removeItem(JWT_STORAGE_KEY);
  localStorage.removeItem(REFRESH_STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent('talk2me_unauthorized', {
      detail: 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.',
    })
  );
}

async function apiFetch<T>(path: string, options: RequestInit = {}, isRetry: boolean = false): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    // If it's an auth endpoint (login/register/refresh) or already retried once
    if (path.startsWith('/auth/login') || path.startsWith('/auth/register') || path.startsWith('/auth/refresh') || isRetry) {
      forceLogout();
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.detail || 'Phiên đăng nhập đã hết hạn.');
    }

    // Attempt token refresh (shared across concurrent 401s), then retry once
    const newToken = await refreshTokenApi();
    if (newToken) {
      return apiFetch<T>(path, options, true);
    }

    // Refresh failed -> logout & dispatch event
    forceLogout();
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || 'Phiên đăng nhập đã hết hạn.');
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Yêu cầu thất bại (mã lỗi ${res.status})`);
  }
  return res.json();
}

export interface GenerateCourseResult {
  courseId: string;
  jobId: string;
  status: string;
}

export interface GenerationStatus {
  status: 'queued' | 'generating' | 'paused_quota' | 'completed' | 'failed';
  totalUnits: number;
  completedUnits: number;
  lastError?: string | null;
}

export interface ClientTranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

/**
 * Transcript/metadata already fetched client-side (oEmbed + the transcript extension — see
 * docs/design-chrome-extension-transcript-2026-08-08.md) so the backend can skip its own
 * yt-dlp/youtube_transcript_api attempt, which is subject to YouTube's bot-detection blocking.
 * Omit any field to let the backend fall back to fetching it server-side as before.
 */
export interface GenerateCourseClientData {
  transcriptSegments?: ClientTranscriptSegment[];
  videoTitle?: string;
  videoThumbnail?: string;
  videoChannel?: string;
}

export function generateCourse(
  youtubeUrl: string,
  category: string,
  difficulty: string,
  clientData?: GenerateCourseClientData
): Promise<GenerateCourseResult> {
  return apiFetch('/courses/generate', {
    method: 'POST',
    body: JSON.stringify({ youtubeUrl, category, difficulty, llmConfig: buildLlmConfig(), ...clientData }),
  });
}

export function getGenerationStatus(courseId: string): Promise<GenerationStatus> {
  return apiFetch(`/courses/${courseId}/generation-status`);
}

export function getCourses(category?: string, query?: string): Promise<Course[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.set('category', category);
  if (query) params.set('query', query);
  const qs = params.toString();
  const path = qs ? `/courses?${qs}` : '/courses';
  return apiFetch(path);
}

export function getCourseDetail(courseId: string): Promise<Course> {
  return apiFetch(`/courses/${courseId}`);
}

export function deleteCourse(courseId: string): Promise<{ ok: boolean; message?: string }> {
  return apiFetch(`/courses/${courseId}`, {
    method: 'DELETE',
  });
}


export function evaluateWriting(
  courseId: string,
  lessonId: string,
  userSubmission: string
): Promise<WritingEvaluation> {
  return apiFetch(`/courses/${courseId}/lessons/${lessonId}/writing/evaluate`, {
    method: 'POST',
    body: JSON.stringify({ userSubmission, llmConfig: buildLlmConfig() }),
  });
}

export function evaluateSpeaking(
  courseId: string,
  lessonId: string,
  transcriptText: string
): Promise<SpeakingEvaluation> {
  return apiFetch(`/courses/${courseId}/lessons/${lessonId}/speaking/evaluate`, {
    method: 'POST',
    body: JSON.stringify({ transcriptText, llmConfig: buildLlmConfig() }),
  });
}

export function updateProgress(
  courseId: string,
  lessonId: string,
  mode: string,
  completed = true,
  accuracy?: number
): Promise<{ ok: boolean }> {
  return apiFetch(`/courses/${courseId}/lessons/${lessonId}/progress`, {
    method: 'POST',
    body: JSON.stringify({ mode, completed, accuracy }),
  });
}

// ---- Flashcards (SRS) --------------------------------------------------------

export type FlashcardFolderSummary = Omit<FlashcardFolder, 'setIds'>;
export type FlashcardSetSummary = Omit<FlashcardSet, 'cards'>;

export function getFlashcardFolders(): Promise<FlashcardFolderSummary[]> {
  return apiFetch('/flashcards/folders');
}

export function createFlashcardFolder(data: {
  name: string;
  color?: string;
  icon?: string;
}): Promise<FlashcardFolderSummary> {
  return apiFetch('/flashcards/folders', { method: 'POST', body: JSON.stringify(data) });
}

export function deleteFlashcardFolder(folderId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/flashcards/folders/${folderId}`, { method: 'DELETE' });
}

export function getAuthUser(): Promise<UserProfile> {
  return apiFetch('/auth/me');
}

export function getFlashcardSets(): Promise<FlashcardSetSummary[]> {
  return apiFetch('/flashcards/sets');
}

export function createFlashcardSet(data: {
  title: string;
  description?: string;
  folderId?: string;
  isPublic?: boolean;
}): Promise<FlashcardSetSummary> {
  return apiFetch('/flashcards/sets', { method: 'POST', body: JSON.stringify(data) });
}

export function deleteFlashcardSet(setId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/flashcards/sets/${setId}`, { method: 'DELETE' });
}

export function getFlashcardsInSet(setId: string): Promise<Flashcard[]> {
  return apiFetch(`/flashcards/sets/${setId}/cards`);
}

export function createFlashcard(data: {
  setId?: string;
  frontText: string;
  backText: string;
  phonetic?: string;
  exampleSentence?: string;
  imageUrl?: string;
  sourceVideoId?: string;
  clipStartSec?: number;
  clipEndSec?: number;
}): Promise<Flashcard> {
  return apiFetch('/flashcards/cards', { method: 'POST', body: JSON.stringify(data) });
}

export function deleteFlashcard(cardId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/flashcards/cards/${cardId}`, { method: 'DELETE' });
}

export function getDueFlashcards(setId?: string): Promise<Flashcard[]> {
  const qs = setId ? `?setId=${encodeURIComponent(setId)}` : '';
  return apiFetch(`/flashcards/due${qs}`);
}

export function getDueFlashcardCount(): Promise<{ count: number }> {
  return apiFetch('/flashcards/due-count');
}

export function reviewFlashcard(cardId: string, quality: number): Promise<Flashcard> {
  return apiFetch(`/flashcards/cards/${cardId}/review`, {
    method: 'POST',
    body: JSON.stringify({ quality }),
  });
}

// ---- Course categories (per-user) ---------------------------------------------------

/** Raw wire shape from the backend — lacks the display-only badgeBg/badgeText fields that
 * the full `Category` entity carries (those are derived client-side, see CourseContext.tsx). */
export interface ApiCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export function getCategories(): Promise<ApiCategory[]> {
  return apiFetch('/categories');
}

export function createCategory(data: { name: string; color?: string }): Promise<ApiCategory> {
  return apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) });
}

export function deleteCategory(categoryId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/categories/${categoryId}`, { method: 'DELETE' });
}
