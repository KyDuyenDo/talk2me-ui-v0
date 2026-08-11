import React, { useState, useEffect } from 'react';
import { Category } from '../../../core/entities';
import { CategoryCombobox } from './CategoryCombobox';
import { X, Sparkles, Youtube, Loader2, AlertCircle } from 'lucide-react';
import { useGenerateCourseMutation } from '../../../application/queries/useCourseGenerationQuery';
import { getGenerationStatus, GenerateCourseClientData } from '../../../infrastructure/api/talk2meApi';
import { fetchYoutubeOEmbedMetadata } from '../../../infrastructure/api/youtubeOEmbed';
import { fetchTranscriptViaExtension } from '../../../infrastructure/api/youtubeTranscriptExtension';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCourseQueued: () => void;
  prefillUrl?: string;
  onCreateCategory: (name: string) => void;
}

const EARLY_FAILURE_POLL_MS = 1500;
const EARLY_FAILURE_TIMEOUT_MS = 15000;

/**
 * Generation runs as a background job — POST /courses/generate returns as soon as the job
 * is queued, before the transcript is even fetched. Fast failures (bad link, no captions)
 * happen within a few seconds, so poll briefly right after queueing to catch those and show
 * the real backend error instead of leaving the modal looking like it succeeded. Gives up
 * after EARLY_FAILURE_TIMEOUT_MS and treats it as a normal (slower) background run.
 */
async function waitForEarlyFailure(courseId: string): Promise<string | null> {
  const deadline = Date.now() + EARLY_FAILURE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, EARLY_FAILURE_POLL_MS));
    try {
      const status = await getGenerationStatus(courseId);
      if (status.status === 'failed') {
        return status.lastError || 'Tạo khoá học thất bại.';
      }
      if (status.status !== 'queued') {
        return null; // already progressing normally
      }
    } catch {
      return null; // don't block the user on a flaky status check
    }
  }
  return null;
}

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCourseQueued,
  prefillUrl = '',
  onCreateCategory,
}) => {
  const selectableCategories = categories.filter((c) => c.id !== 'all');
  const defaultCatId = selectableCategories[0]?.id || 'english';

  const [youtubeUrl, setYoutubeUrl] = useState(prefillUrl);
  const [selectedCategoryId, setSelectedCategoryId] = useState(defaultCatId);
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isFetchingClientData, setIsFetchingClientData] = useState(false);

  const generateMutation = useGenerateCourseMutation();

  useEffect(() => {
    if (prefillUrl) {
      setYoutubeUrl(prefillUrl);
    }
  }, [prefillUrl]);

  if (!isOpen) return null;

  const resetForm = () => {
    setYoutubeUrl('');
    setSelectedCategoryId(defaultCatId);
    setDifficulty('Intermediate');
    setErrorMsg('');
  };

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) {
      setErrorMsg('Vui lòng nhập đường dẫn YouTube hợp lệ.');
      return;
    }

    setErrorMsg('');

    try {
      const selectedCat = categories.find((c) => c.id === selectedCategoryId);

      // Try to fetch metadata (oEmbed) and transcript (extension) from the client first —
      // both run on the user's real browser/IP, sidestepping the backend's unreliable
      // yt-dlp/youtube_transcript_api fetch (see docs/design-chrome-extension-transcript-2026-08-08.md).
      // Either can silently come back null (extension not installed, oEmbed hiccup, etc.);
      // the backend falls back to fetching whatever's missing itself.
      setIsFetchingClientData(true);
      const [metadata, transcriptSegments] = await Promise.all([
        fetchYoutubeOEmbedMetadata(youtubeUrl),
        fetchTranscriptViaExtension(youtubeUrl),
      ]);
      setIsFetchingClientData(false);

      const clientData: GenerateCourseClientData = {
        ...(transcriptSegments ? { transcriptSegments } : {}),
        ...(metadata
          ? { videoTitle: metadata.title, videoThumbnail: metadata.thumbnail, videoChannel: metadata.channel }
          : {}),
      };

      const { courseId } = await generateMutation.mutateAsync({
        youtubeUrl,
        category: selectedCat ? selectedCat.name : 'Tiếng Anh & Ngoại Ngữ',
        difficulty,
        clientData,
      });

      setIsCheckingStatus(true);
      const earlyError = await waitForEarlyFailure(courseId);
      setIsCheckingStatus(false);

      if (earlyError) {
        setErrorMsg(earlyError);
        return;
      }

      resetForm();
      onCourseQueued();
    } catch (err: any) {
      console.error('Course creation error:', err);
      setIsFetchingClientData(false);
      setIsCheckingStatus(false);
      setErrorMsg(err.message || 'Lỗi khởi tạo khóa học. Vui lòng kiểm tra lại liên kết YouTube.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1E293B] rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-2xl p-6 sm:p-8 overflow-hidden">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#95A0B4] hover:bg-[#F1F4F9] dark:hover:bg-[#273449] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2E68FF] to-[#7C5CFC] text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#1B1F2E] dark:text-white">
              Tạo Khóa Học AI
            </h3>
            <p className="text-xs text-[#5A6478] dark:text-[#CBD5E1]">
              Chuyển đổi mọi video YouTube thành khóa học tiếng Anh tương tác
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleStartGeneration} className="space-y-5">
          {/* YouTube Link Input */}
          <div>
            <label className="block text-xs font-bold text-[#1B1F2E] dark:text-[#F1F5F9] mb-1.5 uppercase tracking-wider">
              Đường Dẫn Video YouTube
            </label>
            <div className="relative">
              <Youtube className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm rounded-2xl bg-[#F1F4F9] dark:bg-[#273449] border border-[#E4E8F0] dark:border-[#334155] text-[#1B1F2E] dark:text-white focus:ring-2 focus:ring-[#2E68FF] focus:outline-none placeholder-[#95A0B4]"
                required
                disabled={generateMutation.isPending || isCheckingStatus || isFetchingClientData}
              />
            </div>
          </div>

          {/* Category Combobox */}
          <CategoryCombobox
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(id) => setSelectedCategoryId(id)}
            onCreateNewCategory={(name) => {
              onCreateCategory(name);
            }}
          />

          {/* Difficulty Level Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1B1F2E] dark:text-[#F1F5F9] mb-1.5 uppercase tracking-wider">
              Trình Độ Mục Tiêu
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Beginner', label: 'Sơ cấp' },
                { id: 'Intermediate', label: 'Trung cấp' },
                { id: 'Advanced', label: 'Nâng cao' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setDifficulty(lvl.id as any)}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    difficulty === lvl.id
                      ? 'bg-[#2E68FF] text-white shadow-sm'
                      : 'bg-[#F1F4F9] dark:bg-[#273449] text-[#5A6478] dark:text-[#CBD5E1] hover:bg-[#EAF1FF]'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={generateMutation.isPending || isCheckingStatus || isFetchingClientData}
            className="w-full py-4 rounded-2xl bg-[#2E68FF] hover:bg-[#1E52DB] disabled:opacity-60 text-white font-extrabold text-sm tracking-wide uppercase shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all mt-4"
          >
            {generateMutation.isPending || isCheckingStatus || isFetchingClientData ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 fill-white" />
            )}
            <span>
              {isFetchingClientData
                ? 'Đang lấy phụ đề video...'
                : isCheckingStatus
                  ? 'Đang kiểm tra video...'
                  : 'Bắt Đầu Tạo Khóa Học AI'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
