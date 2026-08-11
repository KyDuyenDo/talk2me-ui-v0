/**
 * useAiResourceGate — shared "ask before downloading a big client-side AI model" gate.
 *
 * On mount: checks whether the given resource is already downloaded.
 *   - Already downloaded  -> calls `preload()` (warms it up in the background).
 *   - Not downloaded yet  -> `isAvailable` stays false and the caller should show
 *     <ModelDownloadPromptModal {...modalProps} isOpen={isPromptOpen} .../> so the user can
 *     opt in. Accepting navigates to Settings and auto-starts that resource's download there
 *     (see ResourceManagerSection.tsx's `autoDownload` prop) — no second manual click needed.
 *
 * Callers should branch their own behavior on `isAvailable`: use the real AI resource when
 * true, fall back to a browser-native default (speechSynthesis / SpeechRecognition) when false.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isModelDownloaded } from '../../infrastructure/ai/resourceManager';
import { isTtsModelDownloaded } from '../../infrastructure/ai/ttsEngine';

export type AiResourceKind = 'pronunciation' | 'tts';

interface ModalCopy {
  title?: string;
  subtitle?: string;
  description?: React.ReactNode;
}

const TTS_MODAL_COPY: ModalCopy = {
  title: 'Cần Tải Model Đọc Giọng Nói (~86MB)',
  subtitle: 'Phục vụ đọc to nội dung tiếng Anh bằng giọng tự nhiên',
  description: (
    <>
      <p>
        Nút loa dùng mô hình học máy <strong>Kokoro TTS</strong> để đọc bằng giọng tự nhiên, chạy trực tiếp trên trình duyệt của bạn.
      </p>
      <p className="text-slate-500 dark:text-slate-400">
        Hiện tại gói tài nguyên này chưa được tải về máy. Bạn có muốn di chuyển đến trang <strong>Quản Lý Tài Nguyên</strong> để tải về không?
      </p>
    </>
  ),
};

function checkDownloaded(kind: AiResourceKind): Promise<boolean> {
  return kind === 'pronunciation' ? isModelDownloaded() : Promise.resolve(isTtsModelDownloaded());
}

// Without this, every mount of every component that calls this hook (Flashcard/Writing/
// Speaking/Shadowing players — several different screens) would re-show the "download this
// model?" prompt for as long as the user hasn't downloaded it, which gets naggy fast.
// Persisted in localStorage so it stays suppressed across page loads/sessions, not just
// this one — the user can still go to Settings manually to download later if they want.
const PROMPT_SEEN_KEY_PREFIX = 'talk2me_ai_prompt_seen_';

function hasSeenPrompt(kind: AiResourceKind): boolean {
  try {
    return localStorage.getItem(`${PROMPT_SEEN_KEY_PREFIX}${kind}`) === 'true';
  } catch {
    return false;
  }
}

function markPromptSeen(kind: AiResourceKind): void {
  try {
    localStorage.setItem(`${PROMPT_SEEN_KEY_PREFIX}${kind}`, 'true');
  } catch {
    // ignore — worst case the prompt shows again next time
  }
}

interface UseAiResourceGateResult {
  /** True once confirmed downloaded — false both while checking and when genuinely absent. */
  isAvailable: boolean;
  isPromptOpen: boolean;
  closePrompt: () => void;
  /** Closes the prompt, navigates to Settings, and auto-starts this resource's download there. */
  goToSettings: () => void;
  /** Spread onto <ModelDownloadPromptModal> — empty for 'pronunciation' (modal's own Wav2Vec2
   * defaults already apply), Kokoro-specific copy for 'tts'. */
  modalProps: ModalCopy;
}

export function useAiResourceGate(kind: AiResourceKind, preload: () => void): UseAiResourceGateResult {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    checkDownloaded(kind).then((downloaded) => {
      if (cancelled) return;
      if (downloaded) {
        setIsAvailable(true);
        preload();
      } else if (!hasSeenPrompt(kind)) {
        markPromptSeen(kind);
        setIsPromptOpen(true);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const closePrompt = () => setIsPromptOpen(false);

  const goToSettings = () => {
    setIsPromptOpen(false);
    navigate('/settings', { state: { autoDownload: kind } });
  };

  return {
    isAvailable,
    isPromptOpen,
    closePrompt,
    goToSettings,
    modalProps: kind === 'tts' ? TTS_MODAL_COPY : {},
  };
}
