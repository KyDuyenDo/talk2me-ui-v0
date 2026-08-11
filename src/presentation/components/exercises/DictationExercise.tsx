import React, { useState, useRef, useEffect } from 'react';
import { DictationSegment, ModeProgress } from '../../../core/entities';
import {
  Play, RotateCcw, ArrowLeft, Mic,
  Square, Layers, Repeat, FastForward,
  CheckSquare, CheckCircle2, BookmarkPlus,
  Eye, EyeOff, ChevronDown, Video
} from 'lucide-react';
import { updateProgress } from '../../../infrastructure/api/talk2meApi';
import { CompletedModeGate } from './CompletedModeGate';
import { useYoutubeSegmentPlayer } from '../../hooks/useYoutubeSegmentPlayer';
import { AddToFlashcardModal } from '../flashcards/AddToFlashcardModal';

const FALLBACK_VIDEO_ID = 'dQw4w9WgXcQ';

/** Splits on any run of whitespace and drops empty tokens */
const tokenizeWords = (text: string): string[] => text.trim().split(/\s+/).filter(Boolean);

const cleanWord = (w: string): string => w.replace(/[^\w]/g, '').toLowerCase();

type WordEvalResult = { word: string; status: 'correct' | 'incorrect' | 'missing'; typed?: string };

const alignWords = (targetWords: string[], typedWords: string[]): WordEvalResult[] => {
  const n = targetWords.length;
  const m = typedWords.length;
  const cleanTarget = targetWords.map(cleanWord);
  const cleanTyped = typedWords.map(cleanWord);

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (cleanTarget[i - 1] === cleanTyped[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const ops: WordEvalResult[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && cleanTarget[i - 1] === cleanTyped[j - 1] && dp[i][j] === dp[i - 1][j - 1]) {
      ops.push({ word: targetWords[i - 1], status: 'correct' });
      i--; j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push({ word: targetWords[i - 1], status: 'incorrect', typed: typedWords[j - 1] });
      i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push({ word: targetWords[i - 1], status: 'missing' });
      i--;
    } else {
      j--;
    }
  }
  ops.reverse();
  return ops;
};

interface DictationExerciseProps {
  courseId: string;
  lessonId: string;
  progress?: ModeProgress;
  youtubeVideoId?: string;
  videoTitle?: string;
  segments: DictationSegment[];
  onComplete?: () => void;
  onFinishDictation?: () => void;
}

export const DictationExercise: React.FC<DictationExerciseProps> = ({
  courseId,
  lessonId,
  progress,
  youtubeVideoId,
  videoTitle = 'A Digital Marketing Method With Communication',
  segments = [],
  onComplete,
  onFinishDictation,
}) => {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [typedTexts, setTypedTexts] = useState<Record<number, string>>({});
  const [hintsRevealed, setHintsRevealed] = useState<Record<number, number>>({});
  const [submittedStatuses, setSubmittedStatuses] = useState<Record<number, boolean>>({});
  const [playbackSpeed] = useState<0.5 | 0.75 | 1>(1);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isCaptionsSectionOpen, setIsCaptionsSectionOpen] = useState(true);
  const [showVideo, setShowVideo] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [addingSegment, setAddingSegment] = useState<DictationSegment | null>(null);

  // Dynamic Scroll Fade Mask States
  const captionsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollTop, setCanScrollTop] = useState(false);
  const [canScrollBottom, setCanScrollBottom] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { iframeRef, embedUrl, playSegment } = useYoutubeSegmentPlayer(youtubeVideoId || FALLBACK_VIDEO_ID);

  const currentSegment = segments[activeSegmentIndex] || {
    id: '1',
    targetText: 'A Digital Marketing Method With Communication',
    startTime: 0,
    endTime: 10,
  };

  const handleCaptionsScroll = () => {
    if (!captionsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = captionsContainerRef.current;
    setCanScrollTop(scrollTop > 5);
    setCanScrollBottom(scrollTop + clientHeight < scrollHeight - 5);
  };

  useEffect(() => {
    handleCaptionsScroll();
  }, [segments, activeSegmentIndex]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeSegmentIndex]);

  const playCurrentSegment = () => playSegment(currentSegment.startTime, currentSegment.endTime);

  const getMaskedSentence = (text: string, revealedCount: number) => {
    const words = tokenizeWords(text);
    return words
      .map((w, idx) => {
        if (idx < revealedCount) return w;
        return '*'.repeat(Math.max(w.length, 3));
      })
      .join(' ');
  };

  const handleRevealWordHint = () => {
    const currentHints = hintsRevealed[activeSegmentIndex] || 0;
    const totalWords = tokenizeWords(currentSegment.targetText).length;
    if (currentHints < totalWords) {
      setHintsRevealed((prev) => ({
        ...prev,
        [activeSegmentIndex]: currentHints + 1,
      }));
    }
  };

  const evaluateWords = (): WordEvalResult[] => {
    const targetWords = tokenizeWords(currentSegment.targetText);
    const typedWords = tokenizeWords(typedTexts[activeSegmentIndex] || '');
    return alignWords(targetWords, typedWords);
  };

  const computeOverallAccuracy = (): number | undefined => {
    let totalWords = 0;
    let correctWords = 0;
    segments.forEach((seg, idx) => {
      const targetWords = tokenizeWords(seg.targetText);
      const typedWords = tokenizeWords(typedTexts[idx] || '');
      const results = alignWords(targetWords, typedWords);
      totalWords += targetWords.length;
      correctWords += results.filter((r) => r.status === 'correct').length;
    });
    return totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : undefined;
  };

  const handleNextSegment = () => {
    if (activeSegmentIndex < segments.length - 1) {
      setActiveSegmentIndex((prev) => prev + 1);
    } else {
      updateProgress(courseId, lessonId, 'dictation', true, computeOverallAccuracy()).catch((err) =>
        console.warn('Không lưu được tiến độ Dictation:', err)
      );
      if (onComplete) onComplete();
      if (onFinishDictation) onFinishDictation();
    }
  };

  const handlePrevSegment = () => {
    if (activeSegmentIndex > 0) {
      setActiveSegmentIndex((prev) => prev - 1);
    }
  };

  const evalResult = submittedStatuses[activeSegmentIndex] ? evaluateWords() : [];
  const isAllCorrect = submittedStatuses[activeSegmentIndex] && evalResult.length > 0 && evalResult.every((r) => r.status === 'correct');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        playCurrentSegment();
      } else if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        handleNextSegment();
      } else if (e.key === 'Enter' && !e.shiftKey && e.target === textareaRef.current) {
        e.preventDefault();
        if (isAllCorrect) {
          handleNextSegment();
        } else if (typedTexts[activeSegmentIndex]?.trim()) {
          setSubmittedStatuses((prev) => ({ ...prev, [activeSegmentIndex]: true }));
        }
      } else if (e.key === '~' || e.key === '`') {
        e.preventDefault();
        playCurrentSegment();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleRevealWordHint();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setShowCaptions((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSegmentIndex, currentSegment, typedTexts, isAllCorrect]);

  const completedCount = Object.keys(submittedStatuses).filter(k => {
    const idx = Number(k);
    if (!submittedStatuses[idx]) return false;
    const typed = (typedTexts[idx] || '').trim().toLowerCase();
    const seg = segments[idx];
    if (!seg) return false;
    const cleanTarget = seg.targetText.replace(/[^\w]/g, '').toLowerCase();
    const cleanTyped = typed.replace(/[^\w]/g, '').toLowerCase();
    return cleanTyped === cleanTarget;
  }).length;
  const progressPercent = segments.length > 0 ? Math.round((completedCount / segments.length) * 100) : 0;

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

  if (progress?.completed && !isRetrying) {
    return (
      <CompletedModeGate
        title="Bạn đã hoàn thành Dictation này"
        scoreLabel={progress.accuracy != null ? `${Math.round(progress.accuracy)}%` : undefined}
        onRetry={() => setIsRetrying(true)}
        onContinue={() => (onComplete ? onComplete() : onFinishDictation?.())}
      />
    );
  }

  return (
    <div className="w-full space-y-4">
      
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
                CAPTIONS ({completedCount}/{segments.length})
              </span>
              <ChevronDown className="w-4 h-4 -rotate-90 lg:rotate-0 shrink-0" />
            </button>
          </div>
        ) : (
          <div className={`${captionsColClass} transition-all duration-300 ease-in-out bg-white dark:bg-[#1E293B] p-3.5 sm:p-4 rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-xs space-y-2 lg:sticky lg:top-20 animate-in fade-in zoom-in-95 duration-200`}>
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E8F0] dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs tracking-wider uppercase text-[#1B1F2E] dark:text-white">
                  CAPTIONS ({completedCount}/{segments.length})
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px]">
                  {progressPercent}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCaptions(!showCaptions)}
                  className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors"
                  title="Hiện/Ẩn văn bản caption đầy đủ"
                >
                  {showCaptions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => setIsCaptionsSectionOpen(false)}
                  className="flex items-center gap-1 text-xs font-bold text-[#2E68FF] bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 px-2.5 py-1 rounded-xl transition-colors border border-blue-200/60 dark:border-blue-800/60"
                >
                  <span>Ẩn</span>
                  <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>
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
                {segments.map((seg, idx) => {
                  const isActive = activeSegmentIndex === idx;
                  const isSub = !!submittedStatuses[idx];
                  const maskedText = getMaskedSentence(seg.targetText, hintsRevealed[idx] || 0);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveSegmentIndex(idx);
                        playSegment(seg.startTime, seg.endTime);
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 text-xs ${
                        isActive
                          ? 'border-2 border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-xs'
                          : 'border border-[#E4E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start gap-2 flex-1">
                        {isSub ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                        )}
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed break-words">
                          #{idx + 1} - {showCaptions && isSub ? seg.targetText : maskedText}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingSegment(seg);
                        }}
                        title="Thêm vào Flashcard"
                        className="p-1 rounded-md text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-colors shrink-0"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                      </button>
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
              <span className="font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Video Bài Học
              </span>
              <button
                onClick={() => setShowVideo(false)}
                className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60 hover:bg-pink-100 transition-colors border border-pink-200/60 dark:border-pink-800/60"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Ẩn Video</span>
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-md border border-slate-800 relative">
              <iframe
                ref={iframeRef}
                src={embedUrl}
                title="YouTube Video Player"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
              <h2 className="font-extrabold text-xs sm:text-sm text-[#1B1F2E] dark:text-white truncate max-w-md">
                {videoTitle}
              </h2>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold text-[11px]">
                <button onClick={playCurrentSegment} className="flex items-center gap-1 hover:text-emerald-500 transition-colors">
                  <Repeat className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Loop</span>
                </button>
                <button onClick={handleNextSegment} className="flex items-center gap-1 hover:text-emerald-500 transition-colors">
                  <FastForward className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{playbackSpeed}x</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. DICTATION INPUT & EVALUATION AREA (Web/Tablet: Rightmost | Mobile: 3rd Order) */}
        <div className={`${practiceColClass} transition-all duration-300 ease-in-out bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-xs space-y-3.5`}>
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevSegment}
                disabled={activeSegmentIndex === 0}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40"
                title="Bài trước"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={playCurrentSegment}
                className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                title="Phát lại âm thanh"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={playCurrentSegment}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs"
                title="Phát / Dừng"
              >
                <Play className="w-4 h-4 fill-white" />
              </button>
            </div>

            <button
              onClick={handleNextSegment}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
            >
              Skip →
            </button>
          </div>

          <div className="p-3.5 rounded-2xl border border-[#E4E8F0] dark:border-[#334155] bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
            <textarea
              ref={textareaRef}
              rows={2}
              value={typedTexts[activeSegmentIndex] || ''}
              onChange={(e) => {
                setTypedTexts((prev) => ({ ...prev, [activeSegmentIndex]: e.target.value }));
                if (submittedStatuses[activeSegmentIndex]) {
                  setSubmittedStatuses((prev) => ({ ...prev, [activeSegmentIndex]: false }));
                }
              }}
              placeholder="Enter the sentence you hear..."
              className="w-full bg-transparent text-sm font-medium text-[#1B1F2E] dark:text-white focus:outline-none placeholder-slate-400 resize-none"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                onClick={handleRevealWordHint}
                className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-200 transition-colors"
              >
                Gợi ý từ ({hintsRevealed[activeSegmentIndex] || 0})
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              if (isAllCorrect) {
                handleNextSegment();
              } else if (typedTexts[activeSegmentIndex]?.trim()) {
                setSubmittedStatuses((prev) => ({ ...prev, [activeSegmentIndex]: true }));
              }
            }}
            className={`w-full py-3.5 rounded-2xl font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer ${
              isAllCorrect
                ? 'bg-[#12B76A] hover:bg-[#0e9f5a] text-white shadow-emerald-500/20'
                : 'bg-[#2E68FF] hover:bg-[#1E52DB] text-white shadow-blue-500/20'
            }`}
          >
            <span>
              {isAllCorrect
                ? 'Next Segment →'
                : submittedStatuses[activeSegmentIndex]
                ? 'Kiểm tra lại ↺'
                : 'Check Sentence'}
            </span>
          </button>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-[#E4E8F0] dark:border-[#334155] text-center font-mono font-bold text-xs text-slate-600 dark:text-slate-300">
            {getMaskedSentence(currentSegment.targetText, hintsRevealed[activeSegmentIndex] || 0)}
          </div>

          {submittedStatuses[activeSegmentIndex] && (
            <div className={`p-4 rounded-2xl border space-y-2 animate-in fade-in duration-200 ${
              isAllCorrect
                ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-white dark:bg-[#1E293B] border-[#E4E8F0] dark:border-[#334155]'
            }`}>
              {isAllCorrect ? (
                <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>🎉 Đúng hoàn toàn! Bạn đã chép chính xác câu này.</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600 dark:text-[#CBD5E1]">
                      Kết quả kiểm tra từ (Gõ tiếp để sửa lỗi):
                    </p>
                    <span className="text-[11px] font-bold text-red-500">
                      {evalResult.filter(r => r.status === 'correct').length}/{evalResult.length} từ đúng
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs font-semibold pt-1">
                    {evalResult.map((res, wIdx) => (
                      <span
                        key={wIdx}
                        className={`px-2 py-0.5 rounded-md ${
                          res.status === 'correct'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : res.status === 'incorrect'
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 line-through'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                        title={res.status === 'incorrect' ? `Từ đúng: ${res.word}` : undefined}
                      >
                        {res.word}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        </div>

      </div>

      <AddToFlashcardModal
        isOpen={!!addingSegment}
        onClose={() => setAddingSegment(null)}
        initialFrontText={addingSegment?.targetText || ''}
        initialBackText={addingSegment?.translationText || ''}
        videoClip={
          addingSegment && youtubeVideoId
            ? { videoId: youtubeVideoId, startTime: addingSegment.startTime, endTime: addingSegment.endTime }
            : undefined
        }
      />

    </div>
  );
};
