import React, { useState, useEffect, useCallback } from 'react';
import {
  Volume2, 
  Star, 
  ArrowLeft, 
  Sparkles, 
  HelpCircle,
  Zap,
  Globe,
  Lock,
  Edit3,
  Award,
  Layers,
  X,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  Lightbulb,
  Keyboard,
  Mic,
  Film
} from 'lucide-react';
import { FlashcardSet } from '../../../core/entities';
import { LearnModePlayer } from './LearnModePlayer';
import { PronunciationModePlayer } from './PronunciationModePlayer';
import { reviewFlashcard } from '../../../infrastructure/api/talk2meApi';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';

interface FlashcardPlayerProps {
  set: FlashcardSet;
  onBack: () => void;
  onEditSet: () => void;
}

export const FlashcardPlayer: React.FC<FlashcardPlayerProps> = ({
  set,
  onBack,
  onEditSet,
}) => {
  const [activeMode, setActiveMode] = useState<'flashcard' | 'quiz' | 'match' | 'pronounce'>('flashcard');

  // Flashcard Flip State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVideoClip, setShowVideoClip] = useState(false);

  // Learning Progress Counters
  const [learningIds, setLearningIds] = useState<string[]>([]);
  const [knownIds, setKnownIds] = useState<string[]>([]);
  const [trackProgress, setTrackProgress] = useState(true);

  // Quiz Mode State
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  // Match Game State
  const [matchSelected, setMatchSelected] = useState<{ id: string; text: string; type: 'front' | 'back' } | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);

  const currentCard = set.cards[currentIndex] || set.cards[0];

  const { speak: speakFront } = useTextToSpeech();

  // Collapse the video-evidence embed whenever the card changes — otherwise a previous
  // card's clip would keep silently autoplaying off-screen after moving on.
  useEffect(() => {
    setShowVideoClip(false);
  }, [currentIndex]);

  // Both faces just read English text via the browser's native voice (speakFront here is
  // the same useTextToSpeech() hook used elsewhere in the app); kept as two separate calls
  // since front/back text can theoretically differ in language in the future.
  const speakBack = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle Star
  const toggleStar = (id: string) => {
    setStarredIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Shared SM-2 review step: sends the real quality (0-5) to the backend so
  // interval/ease_factor/next_review_date are computed per-card, then advances the deck.
  // Again/Hard land in the "learning" bucket, Good/Easy in "known" — matches the SM-2
  // quality<3 vs >=3 split used server-side (app/services/srs.py).
  const submitReview = useCallback(
    (quality: number, bucket: 'learning' | 'known') => {
      if (!currentCard) return;
      const id = currentCard.id;
      reviewFlashcard(id, quality).catch((err) => console.warn('Không lưu được kết quả ôn tập:', err));

      if (bucket === 'learning') {
        setLearningIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        setKnownIds((prev) => prev.filter((i) => i !== id));
      } else {
        setKnownIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        setLearningIds((prev) => prev.filter((i) => i !== id));
      }
      setIsFlipped(false);
      setShowHint(false);
      if (currentIndex < set.cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentCard, currentIndex, set.cards.length]
  );

  // Again (< 1 phút) — quality=1: chưa nhớ, SM-2 reset interval về 1 ngày.
  const handleAgain = useCallback(() => submitReview(1, 'learning'), [submitReview]);
  // Hard (10 phút) — quality=3: nhớ được nhưng khó khăn.
  const handleHard = useCallback(() => submitReview(3, 'learning'), [submitReview]);
  // Good (1 ngày) — quality=4: nhớ tốt.
  const handleGood = useCallback(() => submitReview(4, 'known'), [submitReview]);
  // Easy (4 ngày) — quality=5: nhớ rất tốt, interval sẽ tăng nhanh hơn.
  const handleEasy = useCallback(() => submitReview(5, 'known'), [submitReview]);

  // Undo / Previous card
  const handleUndo = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeMode !== 'flashcard') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleAgain();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleGood();
      } else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      } else if (e.code === 'Escape' && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMode, handleAgain, handleGood, isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Top Navigation & Set Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-slate-800 text-[#1B1F2E] dark:text-white font-extrabold text-xs flex items-center gap-2 transition-all duration-200 border border-[#E4E8F0] dark:border-[#334155] shadow-xs active:scale-95 cursor-pointer shrink-0 group"
            title="Quay lại danh sách Flashcard"
          >
            <ArrowLeft className="w-4 h-4 text-[#2E68FF] group-hover:-translate-x-0.5 transition-transform" />
            <span>Quay lại</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                Học phần ({set.cards.length} thẻ)
              </span>
              {set.isPublic ? (
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-500" /> Công khai
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-500" /> Riêng tư
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#1B1F2E] dark:text-white">
              {set.title}
            </h1>
          </div>
        </div>

        <button
          onClick={onEditSet}
          className="px-4 py-2 rounded-2xl bg-[#EAF1FF] dark:bg-[#1A2540] text-[#2E68FF] font-extrabold text-xs flex items-center gap-2 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span>Chỉnh sửa học phần</span>
        </button>
      </div>

      {/* Mode Switcher Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xs">
        <button
          onClick={() => setActiveMode('flashcard')}
          className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
            activeMode === 'flashcard'
              ? 'bg-[#2E68FF] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Thẻ ghi nhớ (Flashcard)</span>
        </button>

        <button
          onClick={() => {
            setActiveMode('quiz');
            setQuizIndex(0);
            setQuizScore(0);
            setIsQuizFinished(false);
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
            activeMode === 'quiz'
              ? 'bg-[#2E68FF] text-white shadow-md'
              : 'text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Học & Kiểm tra (Quiz)</span>
        </button>

        <button
          onClick={() => {
            setActiveMode('match');
            setMatchSelected(null);
            setMatchedIds([]);
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
            activeMode === 'match'
              ? 'bg-[#2E68FF] text-white shadow-md'
              : 'text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Ghép thẻ (Match Game)</span>
        </button>

        <button
          onClick={() => setActiveMode('pronounce')}
          className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
            activeMode === 'pronounce'
              ? 'bg-[#12B76A] text-white shadow-md'
              : 'text-slate-600 dark:text-[#CBD5E1] hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
          }`}
        >
          <Mic className="w-4 h-4 text-emerald-400" />
          <span>Luyện phát âm AI</span>
        </button>
      </div>

      {/* MODE 1: FLASHCARD PLAYER */}
      {activeMode === 'flashcard' && (
        <div
          className={
            isFullscreen
              ? 'fixed inset-0 z-[100] bg-[var(--bg-base)] text-[var(--text-primary)] p-6 sm:p-10 lg:p-14 flex flex-col justify-between w-screen h-screen min-h-screen overflow-hidden animate-in fade-in duration-200'
              : 'space-y-6'
          }
        >
          {/* Entire Flashcard Player Cluster Container */}
          <div
            className={`w-full mx-auto transition-all duration-300 ${
              isFullscreen
                ? 'max-w-6xl h-full flex flex-col justify-between space-y-4'
                : 'max-w-4xl space-y-6'
            }`}
          >
            {/* Top Status Header Counter Bar */}
            <div className={`flex items-center justify-between gap-2 sm:gap-4 ${
              isFullscreen
                ? 'p-3 rounded-2xl bg-[var(--bg-surface-2)] border border-[var(--border)] shadow-md'
                : 'p-1'
            }`}>
              <div className="flex items-center gap-3">

                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 font-extrabold text-xs">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
                    {learningIds.length}
                  </span>
                  <span>Đang học</span>
                </div>
              </div>

              <div className="text-center font-extrabold text-xs sm:text-sm text-slate-400 flex items-center gap-1.5 sm:gap-2">
                <span className={isFullscreen ? 'text-white font-black text-sm sm:text-base' : 'text-slate-900 dark:text-white font-black'}>
                  {currentIndex + 1} / {set.cards.length}
                </span>
                <span>•</span>
                <span className={`truncate max-w-[120px] sm:max-w-[280px] ${isFullscreen ? 'text-slate-300 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                  {set.title}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-extrabold text-xs">
                <span>Đã biết</span>
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                  {knownIds.length}
                </span>
              </div>
            </div>

            {/* 3D Card Flip Outer Container */}
            <div className="[perspective:1200px] w-full flex-1 flex items-center justify-center my-auto py-2">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`relative w-full ${
                  isFullscreen
                    ? 'max-w-4xl h-[62vh] sm:h-[66vh] min-h-[380px] max-h-[640px]'
                    : 'max-w-2xl sm:max-w-3xl min-h-[340px] sm:min-h-[440px]'
                } cursor-pointer select-none transition-transform duration-500 [transform-style:preserve-3d] ${
                  isFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}
              >
                {/* FRONT FACE */}
                <div className={`absolute inset-0 [backface-visibility:hidden] rounded-3xl ${
                  isFullscreen
                    ? 'bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl p-6 sm:p-10'
                    : 'bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xl hover:shadow-2xl p-5 sm:p-8'
                } flex flex-col justify-between transition-colors hover:border-blue-500/50`}>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(!showHint);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-extrabold transition-colors ${
                        showHint
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 border-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>{showHint ? 'Ẩn gợi ý' : 'Hiển thị gợi ý'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakFront(currentCard.frontText);
                        }}
                        className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-2xs"
                        title="Phát âm tiếng Anh"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(currentCard.id);
                        }}
                        className={`w-9 h-9 rounded-full border transition-all flex items-center justify-center shadow-2xs ${
                          starredIds.includes(currentCard.id)
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 border-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent hover:text-slate-700'
                        }`}
                        title="Gắn sao từ vựng"
                      >
                        <Star className={`w-4 h-4 ${starredIds.includes(currentCard.id) ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="text-center my-auto px-2 sm:px-4 py-4 sm:py-8 space-y-3 sm:space-y-4 overflow-y-auto max-h-[300px] sm:max-h-[420px]">
                    <div className="space-y-3 sm:space-y-4">
                      <h2 className={`${isFullscreen ? 'text-4xl sm:text-6xl lg:text-7xl' : 'text-3xl sm:text-5xl'} font-black text-[#1B1F2E] dark:text-white tracking-tight leading-snug break-words`}>
                        {currentCard.frontText}
                      </h2>
                      {currentCard.phonetic && (
                        <p className={`${isFullscreen ? 'text-xl sm:text-3xl' : 'text-base sm:text-lg'} font-mono text-[#2E68FF] font-extrabold`}>{currentCard.phonetic}</p>
                      )}
                    </div>

                    {showHint && (
                      <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs font-semibold max-w-md mx-auto animate-in fade-in">
                        💡 Gợi ý: {currentCard.phonetic ? `Phiên âm: ${currentCard.phonetic} | ` : ''}{currentCard.backText.slice(0, 15)}...
                      </div>
                    )}
                  </div>

                  <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${
                    isFullscreen ? 'bg-[var(--bg-surface-2)]/60 text-[var(--text-muted)]' : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400'
                  }`}>
                    <Keyboard className="w-4 h-4 hidden sm:inline" />
                    <span>Chạm thẻ để lật <span className="hidden sm:inline">(hoặc nhấn <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 shadow-xs font-mono text-[11px]">Space</kbd>)</span></span>
                  </div>
                </div>

                {/* BACK FACE */}
                <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-3xl ${
                  isFullscreen
                    ? 'bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl p-6 sm:p-10'
                    : 'bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xl hover:shadow-2xl p-5 sm:p-8'
                } flex flex-col justify-between transition-colors hover:border-blue-500/50`}>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(!showHint);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-extrabold transition-colors ${
                        showHint
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 border-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>{showHint ? 'Ẩn gợi ý' : 'Hiển thị gợi ý'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakBack(currentCard.backText);
                        }}
                        className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-2xs"
                        title="Phát âm định nghĩa"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(currentCard.id);
                        }}
                        className={`w-9 h-9 rounded-full border transition-all flex items-center justify-center shadow-2xs ${
                          starredIds.includes(currentCard.id)
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 border-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent hover:text-slate-700'
                        }`}
                        title="Gắn sao từ vựng"
                      >
                        <Star className={`w-4 h-4 ${starredIds.includes(currentCard.id) ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="text-center my-auto px-2 sm:px-4 py-4 sm:py-8 space-y-3 sm:space-y-4 overflow-y-auto max-h-[300px] sm:max-h-[420px]">
                    <div className="space-y-3 sm:space-y-4">
                      <p className={`${isFullscreen ? 'text-3xl sm:text-5xl lg:text-6xl' : 'text-2xl sm:text-4xl'} font-extrabold text-[#1B1F2E] dark:text-white leading-relaxed break-words`}>
                        {currentCard.backText}
                      </p>

                      {currentCard.imageUrl && (
                        <div className="max-w-xs mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                          <img src={currentCard.imageUrl} alt="Card visual" className="w-full h-28 sm:h-40 object-cover" />
                        </div>
                      )}

                      {currentCard.exampleSentence && (
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic max-w-lg mx-auto">
                          "{currentCard.exampleSentence}"
                        </p>
                      )}
                    </div>

                    {showHint && (
                      <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs font-semibold max-w-md mx-auto animate-in fade-in">
                        💡 Gợi ý: {currentCard.phonetic ? `Phiên âm: ${currentCard.phonetic} | ` : ''}{currentCard.backText.slice(0, 15)}...
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center gap-2">
                    <Keyboard className="w-4 h-4 hidden sm:inline" />
                    <span>Chạm thẻ để lật <span className="hidden sm:inline">(hoặc nhấn <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 shadow-xs text-slate-700 dark:text-slate-200 font-mono text-[11px]">Space</kbd>)</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Evidence Button — hidden in fullscreen to save space */}
            {!isFullscreen && currentCard.sourceVideoId && (
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowVideoClip((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-xs font-extrabold hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-all shadow-xs active:scale-95"
                >
                  <Film className="w-4 h-4 text-rose-500" />
                  <span>{showVideoClip ? 'Ẩn video gốc' : 'Xem video gốc (dẫn chứng)'}</span>
                </button>
                {showVideoClip && (
                  <div className="w-full max-w-md aspect-video rounded-2xl overflow-hidden border border-[#E4E8F0] dark:border-[#334155] shadow-md">
                    <iframe
                      key={currentCard.id}
                      src={`https://www.youtube.com/embed/${currentCard.sourceVideoId}?start=${currentCard.clipStartSec ?? 0}&end=${currentCard.clipEndSec ?? 0}&autoplay=1`}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      title="Video gốc"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => setTrackProgress(!trackProgress)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    trackProgress ? 'bg-[#2E68FF]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      trackProgress ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="hidden sm:inline">Theo dõi tiến độ</span>
              </label>

              {trackProgress ? (
                <div className="flex items-center gap-1.5 sm:gap-3">
                  {/* AGAIN (< 1 min) */}
                  <button
                    type="button"
                    onClick={handleAgain}
                    className="px-3 sm:px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xs group"
                    title="Chưa nhớ - Ôn lại sau 1 phút"
                  >
                    <span className="text-[10px] font-extrabold opacity-80 group-hover:opacity-100">&lt; 1 phút</span>
                    <span className="text-xs font-black">Học lại</span>
                  </button>

                  {/* HARD (10 min) */}
                  <button
                    type="button"
                    onClick={handleHard}
                    className="px-3 sm:px-4 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-300 flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xs group"
                    title="Khó nhớ - Ôn lại sau 10 phút"
                  >
                    <span className="text-[10px] font-extrabold opacity-80 group-hover:opacity-100">10 phút</span>
                    <span className="text-xs font-black">Khó</span>
                  </button>

                  {/* GOOD (1 day) */}
                  <button
                    type="button"
                    onClick={handleGood}
                    className="px-3 sm:px-4 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xs group"
                    title="Nhớ tốt - Ôn lại vào ngày mai"
                  >
                    <span className="text-[10px] font-extrabold opacity-80 group-hover:opacity-100">1 ngày</span>
                    <span className="text-xs font-black">Tốt</span>
                  </button>

                  {/* EASY (4 days) */}
                  <button
                    type="button"
                    onClick={handleEasy}
                    className="px-3 sm:px-4 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xs group"
                    title="Rất thuộc - Ôn lại sau 4 ngày"
                  >
                    <span className="text-[10px] font-extrabold opacity-80 group-hover:opacity-100">4 ngày</span>
                    <span className="text-xs font-black">Dễ</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAgain}
                    className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-slate-200 dark:border-slate-700 text-amber-600 flex items-center justify-center shadow-md transition-all active:scale-90 group"
                    title="Đang học"
                  >
                    <X className="w-6 h-6 stroke-[2.5] group-hover:scale-110 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={handleGood}
                    className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 text-emerald-600 flex items-center justify-center shadow-md transition-all active:scale-90 group"
                    title="Đã biết"
                  >
                    <Check className="w-6 h-6 stroke-[2.5] group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              )}

              {/* Undo & Phóng to / Thu nhỏ Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={currentIndex === 0}
                  className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Hoàn tác (Quay lại thẻ trước)"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                {/* Phóng to / Thu nhỏ Button */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className={`p-3 rounded-2xl transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center ${
                    isFullscreen
                      ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent'
                  }`}
                  title={isFullscreen ? 'Thu nhỏ (Thoát toàn màn hình)' : 'Phóng to toàn cụm (Toàn màn hình)'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Maximize2 className="w-5 h-5 stroke-[2.5]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {!isFullscreen && (
            <div className="pt-8 space-y-4 border-t border-[#E4E8F0] dark:border-[#334155]">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Danh sách từ trong học phần này ({set.cards.length} thẻ)
              </h3>

              <div className="space-y-3">
                {set.cards.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-4 items-center"
                  >
                    <div className="sm:col-span-5 font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <button
                        onClick={() => speakFront(c.frontText)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <span>{c.frontText}</span>
                      {c.phonetic && <span className="text-xs text-blue-500 font-normal">({c.phonetic})</span>}
                    </div>

                    <div className="sm:col-span-7 text-xs text-slate-600 dark:text-slate-300 font-medium border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                      {c.backText}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: QUIZ / LEARN MODE */}
      {activeMode === 'quiz' && (
        <LearnModePlayer set={set} onFinish={() => setActiveMode('flashcard')} />
      )}

      {/* MODE 3: MATCH GAME */}
      {activeMode === 'match' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-lg space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Trò chơi ghép thẻ</h2>
            <p className="text-xs text-slate-500">Nhấn chọn một thuật ngữ và nối với định nghĩa tương ứng</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {set.cards.flatMap((c) => [
              { id: c.id, text: c.frontText, type: 'front' as const },
              { id: c.id, text: c.backText, type: 'back' as const },
            ]).map((item, idx) => {
              const isMatched = matchedIds.includes(item.id);
              const isSelected = matchSelected?.id === item.id && matchSelected?.type === item.type;

              if (isMatched) return null;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (!matchSelected) {
                      setMatchSelected(item);
                    } else {
                      if (matchSelected.type !== item.type && matchSelected.id === item.id) {
                        setMatchedIds((prev) => [...prev, item.id]);
                        setMatchSelected(null);
                      } else {
                        setMatchSelected(null);
                      }
                    }
                  }}
                  className={`p-4 rounded-2xl border text-xs font-bold text-center h-28 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-2 border-blue-600 bg-blue-100 dark:bg-blue-950 text-blue-700 shadow-md scale-105'
                      : 'bg-[#F8FAFC] dark:bg-[#0F172A] border-[#E4E8F0] dark:border-[#334155] hover:border-blue-400'
                  }`}
                >
                  {item.text}
                </button>
              );
            })}
          </div>

          {matchedIds.length === set.cards.length && (
            <div className="text-center py-6 space-y-3">
              <Sparkles className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="text-xl font-extrabold">Tuyệt vời! Bạn đã ghép đúng tất cả các thẻ!</h3>
              <button
                onClick={() => {
                  setMatchedIds([]);
                  setMatchSelected(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Chơi lại
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE 4: PRONUNCIATION PLAYER */}
      {activeMode === 'pronounce' && (
        <PronunciationModePlayer set={set} onFinish={() => setActiveMode('flashcard')} />
      )}

    </div>
  );
};
