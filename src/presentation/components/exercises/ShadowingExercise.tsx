import React, { useState, useRef, useEffect } from 'react';
import { ShadowingLine, ModeProgress, WordScore } from '../../../core/entities';
import {
  Mic, Square, Volume2, ArrowRight, RotateCcw, SkipForward, Loader2, Upload,
  PlayCircle, Video, BookmarkPlus, CheckSquare, Layers, ChevronDown
} from 'lucide-react';
import { updateProgress } from '../../../infrastructure/api/talk2meApi';
import { CompletedModeGate } from './CompletedModeGate';
import { useYoutubeSegmentPlayer } from '../../hooks/useYoutubeSegmentPlayer';
import { usePronunciationScorer } from '../../hooks/usePronunciationScorer';
import { useAiResourceGate } from '../../hooks/useAiResourceGate';
import { useSpeechToTextFallback } from '../../hooks/useSpeechToTextFallback';
import { ModelDownloadPromptModal } from './ModelDownloadPromptModal';
import { ScoreGauges } from './ScoreGauges';
import { WordScoreDisplay } from './WordScoreDisplay';
import { PhonemeBreakdown } from './PhonemeBreakdown';
import { AddToFlashcardModal } from '../flashcards/AddToFlashcardModal';

interface ShadowingExerciseProps {
  courseId: string;
  lessonId: string;
  progress?: ModeProgress;
  youtubeVideoId?: string;
  lines: ShadowingLine[];
  onFinishShadowing: () => void;
}

export const ShadowingExercise: React.FC<ShadowingExerciseProps> = ({
  courseId,
  lessonId,
  progress,
  youtubeVideoId,
  lines,
  onFinishShadowing,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [completedLines, setCompletedLines] = useState<Set<number>>(new Set());
  const [isRetrying, setIsRetrying] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isAddingToFlashcard, setIsAddingToFlashcard] = useState(false);

  // Dynamic Scroll Fade Mask States for Captions
  const captionsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollTop, setCanScrollTop] = useState(false);
  const [canScrollBottom, setCanScrollBottom] = useState(true);
  const [isCaptionsSectionOpen, setIsCaptionsSectionOpen] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);
  const { iframeRef, embedUrl, playSegment } = useYoutubeSegmentPlayer(youtubeVideoId);

  const handleCaptionsScroll = () => {
    if (!captionsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = captionsContainerRef.current;
    setCanScrollTop(scrollTop > 5);
    setCanScrollBottom(scrollTop + clientHeight < scrollHeight - 5);
  };

  useEffect(() => {
    handleCaptionsScroll();
  }, [lines, currentIndex]);

  useEffect(() => {
    if (!recordedBlob) {
      setRecordedAudioUrl(null);
      return;
    }
    const url = URL.createObjectURL(recordedBlob);
    setRecordedAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recordedBlob]);

  const playRecordedAudio = () => {
    if (!recordedAudioUrl) return;
    recordedAudioRef.current?.pause();
    const audio = new Audio(recordedAudioUrl);
    recordedAudioRef.current = audio;
    audio.play().catch((err) => console.warn('Không phát lại được bản ghi âm:', err));
  };

  // Pronunciation scorer
  const { status: scorerStatus, loadProgress, result: scoringResult, error: scorerError, scoreAudio, preload, reset: resetScorer } = usePronunciationScorer();
  const gate = useAiResourceGate('pronunciation', preload);

  // Default mode when the AI model hasn't been downloaded: browser-native speech-to-text
  // shows what the user said next to the target sentence for manual comparison — no
  // automatic scoring.
  const fallbackStt = useSpeechToTextFallback();

  if (progress?.completed && !isRetrying) {
    return (
      <CompletedModeGate
        title="Bạn đã hoàn thành Shadowing này"
        scoreLabel={progress.accuracy != null ? `${Math.round(progress.accuracy)}%` : undefined}
        onRetry={() => setIsRetrying(true)}
        onContinue={onFinishShadowing}
      />
    );
  }

  if (!lines || lines.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-8 border border-[#E4E8F0] dark:border-[#334155] text-center">
        <p className="text-sm text-[#5A6478]">No shadowing lines generated for this lesson.</p>
        <button onClick={onFinishShadowing} className="mt-4 px-6 py-2.5 rounded-full bg-[#EC4899] text-white text-xs font-bold">
          Continue
        </button>
      </div>
    );
  }

  const currentLine = lines[currentIndex];
  const progressPercent = Math.round((completedLines.size / lines.length) * 100);

  const playSample = () => playSegment(currentLine.startTime, currentLine.endTime);

  const runScoring = async (blob: Blob) => {
    setRecordedBlob(blob);
    setCompletedLines((prev) => new Set(prev).add(currentIndex));
    await scoreAudio(blob, currentLine.sampleText);
    setHasEvaluated(true);
  };

  const startRecording = async () => {
    // Default mode (AI model not downloaded): browser STT only, no MediaRecorder/blob needed.
    if (!gate.isAvailable) {
      fallbackStt.start();
      setIsRecording(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await runScoring(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Microphone permission denied, falling back to simulation mode', err);
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setHasEvaluated(true);
        setCompletedLines((prev) => new Set(prev).add(currentIndex));
      }, 3000);
    }
  };

  const stopRecording = () => {
    if (!gate.isAvailable) {
      fallbackStt.stop();
      setIsRecording(false);
      setHasEvaluated(true);
      setCompletedLines((prev) => new Set(prev).add(currentIndex));
      return;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
    }
  };

  const handleNextLine = () => {
    setRecordedBlob(null);
    setHasEvaluated(false);
    setIsRecording(false);
    setSelectedWord(null);
    resetScorer();
    fallbackStt.reset();

    if (currentIndex < lines.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      updateProgress(courseId, lessonId, 'shadowing', true, 85).catch((err) =>
        console.warn('Không lưu được tiến độ Shadowing:', err)
      );
      onFinishShadowing();
    }
  };

  const handleRetryLine = () => {
    setRecordedBlob(null);
    setHasEvaluated(false);
    setIsRecording(false);
    setSelectedWord(null);
    resetScorer();
    fallbackStt.reset();
  };

  const handleWordClick = (wordId: string) => {
    setSelectedWord(selectedWord === wordId ? null : wordId);
  };

  const selectedWordScore: WordScore | null = (() => {
    if (!selectedWord || !scoringResult) return null;
    const idx = parseInt(selectedWord.split('-').pop() || '0', 10);
    return scoringResult.wordAnalysis[idx] ?? null;
  })();

  const waveformBars = Array.from({ length: 24 }, (_, i) => {
    const heights = [14, 22, 10, 28, 16, 32, 12, 26, 18, 30, 8, 24, 20, 34, 14, 28, 10, 22, 16, 36, 12, 26, 20, 30];
    return heights[i % heights.length];
  });

  const isScoring = scorerStatus === 'scoring' || scorerStatus === 'loading-model';

  // Dynamic Responsive Grid Column Classes
  const captionsColClass = !isCaptionsSectionOpen
    ? 'order-2 lg:order-1 lg:col-span-1'
    : showVideo
    ? 'order-2 lg:order-1 lg:col-span-3'
    : 'order-2 lg:order-1 lg:col-span-4';

  const videoColClass = !showVideo
    ? 'order-1 lg:order-2 lg:col-span-1'
    : !isCaptionsSectionOpen
    ? 'order-1 lg:order-2 lg:col-span-6'
    : 'order-1 lg:order-2 lg:col-span-5';

  const practiceColClass = (!isCaptionsSectionOpen && !showVideo)
    ? 'order-3 lg:order-3 lg:col-span-10'
    : !isCaptionsSectionOpen
    ? 'order-3 lg:order-3 lg:col-span-5'
    : !showVideo
    ? 'order-3 lg:order-3 lg:col-span-7'
    : 'order-3 lg:order-3 lg:col-span-4';

  return (
    <div className="w-full space-y-4">

      {/* Model loading banner */}
      {scorerStatus === 'loading-model' && loadProgress < 100 && !isRecording && (
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
              Loading AI model... {loadProgress}%
            </p>
            <div className="mt-1 h-1.5 rounded-full bg-blue-200 dark:bg-blue-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC RESPONSIVE GRID WITH SMOOTH TRANSITIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start transition-all duration-300 ease-in-out">

        {/* 1. CAPTIONS LIST (Web/Tablet: Leftmost | Mobile: 2nd Order) */}
        {!isCaptionsSectionOpen ? (
          <div className={`${captionsColClass} transition-all duration-300 ease-in-out bg-white dark:bg-[#1E293B] p-3 rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-xs lg:sticky lg:top-20 flex lg:flex-col items-center justify-between animate-in fade-in zoom-in-95 duration-200`}>
            <button
              onClick={() => setIsCaptionsSectionOpen(true)}
              className="w-full flex lg:flex-col items-center justify-center gap-2 p-2 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2E68FF] dark:text-blue-400 font-extrabold text-xs hover:bg-blue-100 transition-colors"
              title="Mở rộng danh sách Captions"
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="lg:[writing-mode:vertical-lr] lg:rotate-180 uppercase tracking-wider text-[10px] py-1 whitespace-nowrap">
                CAPTIONS ({completedLines.size}/{lines.length})
              </span>
              <ChevronDown className="w-4 h-4 -rotate-90 lg:rotate-0 shrink-0" />
            </button>
          </div>
        ) : (
          <div className={`${captionsColClass} transition-all duration-300 ease-in-out bg-white dark:bg-[#1E293B] p-3.5 sm:p-4 rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-xs space-y-2 lg:sticky lg:top-20 animate-in fade-in zoom-in-95 duration-200`}>
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E8F0] dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs tracking-wider uppercase text-[#1B1F2E] dark:text-white">
                  CAPTIONS ({completedLines.size}/{lines.length})
                </span>
                <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-300 font-extrabold text-[10px]">
                  {progressPercent}%
                </span>
              </div>

              <button
                onClick={() => setIsCaptionsSectionOpen(false)}
                className="flex items-center gap-1 text-xs font-bold text-[#2E68FF] bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 px-2.5 py-1 rounded-xl transition-colors border border-blue-200/60 dark:border-blue-800/60"
              >
                <span>Ẩn</span>
                <ChevronDown className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

            <div className="relative animate-in fade-in duration-150">
              {canScrollTop && (
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white dark:from-[#1E293B] to-transparent z-10 animate-in fade-in duration-150" />
              )}

              <div
                ref={captionsContainerRef}
                onScroll={handleCaptionsScroll}
                className="space-y-1.5 max-h-40 lg:max-h-[480px] overflow-y-auto py-1 px-0.5 scrollbar-thin"
                style={{
                  maskImage: canScrollTop && canScrollBottom
                    ? 'linear-gradient(to bottom, transparent 0%, black 16px, black calc(100% - 16px), transparent 100%)'
                    : canScrollTop
                    ? 'linear-gradient(to bottom, transparent 0%, black 16px, black 100%)'
                    : canScrollBottom
                    ? 'linear-gradient(to bottom, black 0%, black calc(100% - 16px), transparent 100%)'
                    : 'none',
                  WebkitMaskImage: canScrollTop && canScrollBottom
                    ? 'linear-gradient(to bottom, transparent 0%, black 16px, black calc(100% - 16px), transparent 100%)'
                    : canScrollTop
                    ? 'linear-gradient(to bottom, transparent 0%, black 16px, black 100%)'
                    : canScrollBottom
                    ? 'linear-gradient(to bottom, black 0%, black calc(100% - 16px), transparent 100%)'
                    : 'none'
                }}
              >
                {lines.map((line, idx) => {
                  const isActive = currentIndex === idx;
                  const isDone = completedLines.has(idx);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setCurrentIndex(idx);
                        handleRetryLine();
                        playSegment(line.startTime, line.endTime);
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 text-xs ${
                        isActive
                          ? 'border-2 border-pink-500 bg-pink-50/80 dark:bg-pink-950/40 shadow-xs'
                          : 'border border-[#E4E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] hover:border-pink-300'
                      }`}
                    >
                      <div className="flex items-start gap-2 flex-1">
                        {isDone ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed break-words block">
                            #{idx + 1} - {line.sampleText}
                          </span>
                          {line.phoneticText && (
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                              {line.phoneticText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {canScrollBottom && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white dark:from-[#1E293B] to-transparent z-10 animate-in fade-in duration-150" />
              )}
            </div>
          </div>
        )}

        {/* 2. VIDEO PLAYER SECTION (Web/Tablet: Middle | Mobile: 1st Order) */}
        {!showVideo ? (
          <div className={`${videoColClass} transition-all duration-300 ease-in-out bg-white dark:bg-[#1E293B] p-3 rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-xs lg:sticky lg:top-20 flex lg:flex-col items-center justify-between animate-in fade-in zoom-in-95 duration-200`}>
            <button
              onClick={() => setShowVideo(true)}
              className="w-full flex lg:flex-col items-center justify-center gap-2 p-2 rounded-2xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 font-extrabold text-xs hover:bg-pink-100 transition-colors"
              title="Mở lại Video bài học"
            >
              <Video className="w-4 h-4 shrink-0" />
              <span className="lg:[writing-mode:vertical-lr] lg:rotate-180 uppercase tracking-wider text-[10px] py-1 whitespace-nowrap">
                VIDEO BÀI HỌC
              </span>
              <ChevronDown className="w-4 h-4 -rotate-90 lg:rotate-0 shrink-0" />
            </button>
            {embedUrl && (
              <iframe
                ref={iframeRef}
                src={embedUrl}
                title="YouTube Video Player"
                className="hidden"
              />
            )}
          </div>
        ) : (
          <div className={`${videoColClass} transition-all duration-300 ease-in-out bg-white dark:bg-[#1E293B] rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-xs overflow-hidden p-3.5 sm:p-4 space-y-3 lg:sticky lg:top-20 animate-in fade-in zoom-in-95 duration-200`}>
            <div className="flex items-center justify-between px-1">
              <span className="px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-extrabold text-xs">
                🔁 Shadowing Studio
              </span>
              <button
                onClick={() => setShowVideo(false)}
                className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60 hover:bg-pink-100 transition-colors border border-pink-200/60 dark:border-pink-800/60"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Ẩn Video</span>
              </button>
            </div>

            {embedUrl && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-md border border-slate-800 relative animate-in fade-in duration-150">
                <iframe
                  ref={iframeRef}
                  src={embedUrl}
                  title="YouTube Video Player"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        )}

        {/* 3. PRACTICE & SCORING AREA (Web/Tablet: Rightmost | Mobile: 3rd Order) */}
        <div className={`${practiceColClass} transition-all duration-300 ease-in-out space-y-4`}>
          {/* HERO: Recording area */}
          <div className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 ${
            isRecording
              ? 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-pink-300 dark:border-pink-700 shadow-lg shadow-pink-500/10'
              : isScoring
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-300 dark:border-blue-700'
              : hasEvaluated
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-white dark:bg-[#1E293B] border-[#E4E8F0] dark:border-[#334155]'
          }`}>

            {/* Current sentence */}
            <div className="text-center mb-5">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest">
                    Line {currentIndex + 1} / {lines.length}
                  </span>
                </div>
                {!gate.isAvailable && (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                    title="Chưa tải AI chấm điểm phát âm — đang dùng chế độ so sánh transcript cơ bản"
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">
                      Chế độ cơ bản
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsAddingToFlashcard(true)}
                  title="Thêm câu này vào Flashcard"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2E68FF] dark:text-blue-300 text-[10px] font-extrabold hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                >
                  <BookmarkPlus className="w-3 h-3" />
                  <span>Thêm vào Flashcard</span>
                </button>
              </div>

              {/* Word-level color display (when scored) or plain text */}
              {scoringResult && hasEvaluated ? (
                <div className="mt-2 mb-2">
                  <WordScoreDisplay
                    wordAnalysis={scoringResult.wordAnalysis}
                    selectedWord={selectedWord}
                    onWordClick={handleWordClick}
                  />
                </div>
              ) : (
                <h3 className="text-base sm:text-lg font-bold text-[#1B1F2E] dark:text-white leading-relaxed px-2">
                  "{currentLine.sampleText}"
                </h3>
              )}

              {currentLine.phoneticText && (
                <p className="text-xs font-mono text-[#5A6478] dark:text-[#CBD5E1] tracking-wide mt-1.5">
                  {currentLine.phoneticText}
                </p>
              )}
            </div>

            {/* Waveform visualizer */}
            <div className="flex items-end justify-center gap-[3px] h-9 mb-4">
              {waveformBars.map((h, i) => (
                <div
                  key={i}
                  className={`w-[3px] rounded-full transition-all duration-200 ${
                    isRecording
                      ? 'bg-pink-400 dark:bg-pink-500'
                      : isScoring
                      ? 'bg-blue-400 dark:bg-blue-500'
                      : hasEvaluated
                      ? 'bg-emerald-300 dark:bg-emerald-700'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  style={{
                    height: isRecording ? `${h + Math.random() * 8}px`
                      : isScoring ? `${h * 0.6 + Math.sin(Date.now() / 200 + i) * 4}px`
                      : `${h * 0.4}px`,
                    opacity: isRecording ? 0.6 + Math.random() * 0.4 : isScoring ? 0.5 : 0.4,
                    animationDelay: `${i * 50}ms`,
                    ...(isRecording ? { animation: `pulse 0.6s ease-in-out ${i * 50}ms infinite alternate` } : {}),
                  }}
                />
              ))}
            </div>

            <p className="text-center text-xs font-bold uppercase tracking-wider mb-4 text-[#5A6478] dark:text-[#94A3B8]">
              {!gate.isAvailable && isRecording
                ? '🎙 Đang nghe... Hãy nói to câu trên!'
                : !gate.isAvailable && hasEvaluated
                ? '📝 Đã ghi nhận — tự so sánh với câu gốc bên dưới'
                : isRecording
                ? '🎙 Recording... Speak out loud!'
                : isScoring
                ? '🧠 Analyzing pronunciation...'
                : hasEvaluated && scoringResult
                ? '✅ Analysis complete — tap a word for details'
                : hasEvaluated && scorerError
                ? '⚠️ Chấm điểm phát âm thất bại — thử ghi âm lại'
                : 'Tap the microphone to start recording'}
            </p>

            {!gate.isAvailable && fallbackStt.unsupported && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-300 text-center">
                Trình duyệt này không hỗ trợ nhận diện giọng nói. Hãy thử Google Chrome, hoặc tải Model AI ở trang Quản Lý Tài Nguyên để chấm điểm chính xác.
              </div>
            )}

            {gate.isAvailable && hasEvaluated && !scoringResult && scorerError && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-300 text-center">
                Không thể phân tích phát âm lần này ({scorerError}). Bạn vẫn có thể tiếp tục — điểm phần này sẽ không được ghi nhận chi tiết.
              </div>
            )}

            {!gate.isAvailable && hasEvaluated && (
              <div className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div>
                  <span className="font-extrabold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">Bạn đã nói:</span>
                  <p className="text-slate-800 dark:text-slate-100 font-semibold mt-0.5">
                    {fallbackStt.transcript || '(không nhận diện được)'}
                  </p>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">Câu gốc:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">{currentLine.sampleText}</p>
                </div>
              </div>
            )}

            {/* Mic button + actions */}
            <div className="flex items-center justify-center gap-3">
              {hasEvaluated ? (
                <>
                  <button
                    onClick={handleRetryLine}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-[#E4E8F0] dark:border-[#334155] text-xs font-bold text-[#5A6478] dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-record</span>
                  </button>
                  {recordedAudioUrl && (
                    <button
                      onClick={playRecordedAudio}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-[#E4E8F0] dark:border-[#334155] text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Nghe lại</span>
                    </button>
                  )}
                  <button
                    onClick={playSample}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-[#E4E8F0] dark:border-[#334155] text-xs font-bold text-pink-600 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Compare</span>
                  </button>
                </>
              ) : isRecording ? (
                <button
                  onClick={stopRecording}
                  className="rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-xl shadow-red-500/30 animate-pulse hover:scale-105 transition-transform cursor-pointer"
                  style={{ width: 64, height: 64 }}
                >
                  <Square className="w-6 h-6 fill-white" />
                </button>
              ) : isScoring ? (
                <div className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30"
                  style={{ width: 64, height: 64 }}
                >
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={playSample}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800/60 text-pink-600 dark:text-pink-300 text-xs font-bold hover:bg-pink-100 dark:hover:bg-pink-950/60 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen</span>
                  </button>
                  <button
                    onClick={startRecording}
                    className="rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-xl shadow-pink-500/30 hover:scale-105 hover:shadow-2xl transition-all cursor-pointer"
                    style={{ width: 64, height: 64 }}
                  >
                    <Mic className="w-7 h-7" />
                  </button>
                  {gate.isAvailable && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        title="Tải file .wav lên để test chấm điểm (thay vì ghi âm)"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800 border border-[#E4E8F0] dark:border-[#334155] text-slate-500 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>WAV</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await runScoring(file);
                          }
                        }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Evaluation details (Gauges + Phoneme breakdown) */}
          {hasEvaluated && scoringResult && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <ScoreGauges
                overallScore={scoringResult.overallScore}
                pronunciationScore={scoringResult.pronunciationScore}
                fluencyScore={scoringResult.fluencyScore}
              />

              {selectedWordScore && (
                <PhonemeBreakdown wordScore={selectedWordScore} onClose={() => setSelectedWord(null)} />
              )}
            </div>
          )}

          {/* Bottom control bar */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex((prev) => prev - 1);
                  handleRetryLine();
                }
              }}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] text-xs font-bold text-[#5A6478] dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Previous Line</span>
            </button>

            <button
              onClick={handleNextLine}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-extrabold text-xs shadow-lg shadow-pink-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>{currentIndex < lines.length - 1 ? 'Next Line' : 'Finish Shadowing 🎉'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Model download prompt modal */}
      <ModelDownloadPromptModal
        isOpen={gate.isPromptOpen}
        onClose={gate.closePrompt}
        onGoToSettings={gate.goToSettings}
        {...gate.modalProps}
      />

      {/* Add to flashcard modal */}
      <AddToFlashcardModal
        isOpen={isAddingToFlashcard}
        onClose={() => setIsAddingToFlashcard(false)}
        initialFrontText={currentLine.sampleText}
        initialBackText={currentLine.phoneticText || ''}
        videoClip={
          youtubeVideoId
            ? { videoId: youtubeVideoId, startTime: currentLine.startTime, endTime: currentLine.endTime }
            : undefined
        }
      />
    </div>
  );
};
