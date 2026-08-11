import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  Flag, 
  RotateCcw, 
  Award, 
  ArrowRight, 
  Sparkles,
  HelpCircle,
  PenTool,
  Headphones,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { FlashcardSet, Flashcard } from '../../../core/entities';
import { reviewFlashcard } from '../../../infrastructure/api/talk2meApi';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useAiResourceGate } from '../../hooks/useAiResourceGate';
import { ModelDownloadPromptModal } from '../exercises/ModelDownloadPromptModal';

interface LearnModePlayerProps {
  set: FlashcardSet;
  onFinish: () => void;
}

type QuestionType = 'mcq' | 'write' | 'audio';

interface GeneratedQuestion {
  card: Flashcard;
  type: QuestionType;
  options: string[]; // for MCQ or Audio questions
  correctAnswer: string;
}

export const LearnModePlayer: React.FC<LearnModePlayerProps> = ({ set, onFinish }) => {
  const cards = set.cards;
  const totalCount = cards.length;

  const [queue, setQueue] = useState<Flashcard[]>(cards);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // MCQ state
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Write state
  const [typedInput, setTypedInput] = useState('');
  
  // Common question state
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [masteredCount, setMasteredCount] = useState(0);
  const [dontKnowRevealed, setDontKnowRevealed] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const currentCard = queue[currentIdx] || cards[0];

  // Speak audio helper — all call sites in this file read English term text (frontText).
  const { speak, preload } = useTextToSpeech();
  const ttsGate = useAiResourceGate('tts', preload);

  // Shuffle array helper
  const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Generate options for MCQ or Audio question
  const prepareQuestion = useCallback((card: Flashcard, type: QuestionType) => {
    const isAudio = type === 'audio';
    const correctAnswer = isAudio ? card.backText : card.frontText;

    // Distractors from other cards in set
    const otherCards = cards.filter((c) => c.id !== card.id);
    const shuffledOthers = shuffle(otherCards);
    const distractorAnswers = shuffledOthers
      .slice(0, 3)
      .map((c) => (isAudio ? c.backText : c.frontText));

    const allOptions = shuffle([correctAnswer, ...distractorAnswers]);
    setOptions(allOptions);

    if (type === 'audio') {
      speak(card.frontText);
    }
  }, [cards, speak]);

  // Setup next card / question
  useEffect(() => {
    if (!currentCard) return;

    // Cycle through question types: MCQ -> Write -> Audio
    const types: QuestionType[] = ['mcq', 'write', 'audio'];
    const nextType = types[currentIdx % types.length];
    setQuestionType(nextType);

    setSelectedOption(null);
    setTypedInput('');
    setIsAnswered(false);
    setIsCorrect(null);
    setDontKnowRevealed(false);

    prepareQuestion(currentCard, nextType);
  }, [currentIdx, currentCard, prepareQuestion]);

  // Focus input when write mode loads
  useEffect(() => {
    if (questionType === 'write' && !isAnswered) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [questionType, isAnswered, currentIdx]);

  // Handle answer submission
  const handleCheckAnswer = (answer: string) => {
    if (isAnswered) return;

    const targetAnswer = (questionType === 'mcq' ? currentCard.frontText : currentCard.backText).trim().toLowerCase();
    const cleanAnswer = answer.trim().toLowerCase();
    const correct = cleanAnswer === targetAnswer;

    setIsAnswered(true);
    setIsCorrect(correct);
    // Correct/incorrect here is only binary, so it maps to the SM-2 "Good"/"Again" quality
    // levels (4/1) — same split FlashcardPlayer's 4-button UI uses for its own known/learning
    // buckets (app/services/srs.py treats quality<3 as a fail, >=3 as a pass).
    reviewFlashcard(currentCard.id, correct ? 4 : 1).catch((err) =>
      console.warn('Không lưu được kết quả ôn tập:', err)
    );

    if (correct) {
      setMasteredCount((prev) => Math.min(totalCount, prev + 1));
    } else {
      // Re-add missed card to the end of queue for practice
      setQueue((prev) => [...prev, currentCard]);
    }
  };

  // Handle Don't Know button
  const handleDontKnow = () => {
    if (isAnswered) return;
    setDontKnowRevealed(true);
    setIsAnswered(true);
    setIsCorrect(false);
    reviewFlashcard(currentCard.id, 1).catch((err) => console.warn('Không lưu được kết quả ôn tập:', err));
    speak(currentCard.frontText);
    // Queue for re-testing
    setQueue((prev) => [...prev, currentCard]);
  };

  // Next question
  const handleNext = () => {
    if (currentIdx < queue.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsAnswered(true);
    }
  };

  // Keyboard shortcut listener (1, 2, 3, 4 for MCQ options)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered) {
        if (e.key === 'Enter') handleNext();
        return;
      }

      if ((questionType === 'mcq' || questionType === 'audio') && ['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (options[index]) {
          setSelectedOption(options[index]);
          handleCheckAnswer(options[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [questionType, options, isAnswered]);

  const isCompleted = currentIdx >= queue.length - 1 && isAnswered;

  // Render top progress bar segments
  const numSegments = 5;
  const progressPercent = Math.min(100, Math.round((masteredCount / totalCount) * 100));

  return (
    <div className={
      isFullscreen
        ? 'fixed inset-0 z-[100] bg-[#090D16] text-white p-4 sm:p-8 overflow-y-auto flex flex-col justify-start items-center w-screen h-screen min-h-screen animate-in fade-in duration-200'
        : 'max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200'
    }>
      <div className={`w-full ${isFullscreen ? 'max-w-5xl space-y-6 pt-2 pb-8' : 'space-y-6'}`}>
      
      {/* 1. TOP SEGMENTED PROGRESS BAR */}
      <div className="flex items-center gap-3 px-2 py-1">
        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
          {masteredCount}
        </div>

        <div className="flex-1 grid grid-cols-5 gap-2 h-3.5">
          {Array.from({ length: numSegments }).map((_, i) => {
            const segThreshold = ((i + 1) / numSegments) * 100;
            const isFilled = progressPercent >= segThreshold;
            const isCurrent = progressPercent >= (i / numSegments) * 100 && !isFilled;
            return (
              <div
                key={i}
                className={`h-full rounded-full transition-all duration-300 ${
                  isFilled
                    ? 'bg-emerald-500 shadow-sm'
                    : isCurrent
                    ? 'bg-emerald-500/50 animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            );
          })}
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center">
          {totalCount}
        </div>
      </div>

      {!isCompleted ? (
        /* 2. MAIN QUESTION CARD */
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1E293B] text-[#1B1F2E] dark:text-white border border-[#E4E8F0] dark:border-[#334155] shadow-xl space-y-6 relative overflow-hidden">
          
          {/* Header prompt */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {questionType === 'mcq'
                  ? 'Định nghĩa'
                  : questionType === 'write'
                  ? 'Ghi từ vựng (Viết)'
                  : 'Nghe & Đoán'}
              </span>
              <button
                type="button"
                onClick={() => speak(currentCard.frontText)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 transition-colors"
                title="Nghe phát âm"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                Câu {currentIdx + 1} / {queue.length}
              </span>
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Question Content */}
          <div className="space-y-3 py-2">
            {questionType === 'audio' ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] text-center space-y-3">
                <button
                  type="button"
                  onClick={() => speak(currentCard.frontText)}
                  className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center mx-auto shadow-lg hover:scale-105 transition-transform"
                >
                  <Headphones className="w-8 h-8" />
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Nhấn nút để nghe lại phát âm</p>
              </div>
            ) : (
              <h2 className="text-lg sm:text-2xl font-semibold text-[#1B1F2E] dark:text-slate-100 leading-relaxed">
                {currentCard.backText}
              </h2>
            )}

            {currentCard.exampleSentence && questionType !== 'audio' && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
                Ví dụ: "{currentCard.exampleSentence}"
              </p>
            )}
          </div>

          {/* Question Body: MCQ Options or Write Input */}
          <div className="space-y-4 pt-2">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {questionType === 'write'
                ? 'Nhập từ bằng tiếng Anh:'
                : 'Chọn đáp án đúng:'}
            </p>

            {questionType === 'write' ? (
              /* WRITE INPUT MODE */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (typedInput.trim()) handleCheckAnswer(typedInput);
                }}
                className="space-y-3"
              >
                <div className="flex gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={typedInput}
                    disabled={isAnswered}
                    onChange={(e) => setTypedInput(e.target.value)}
                    placeholder="Gõ từ tiếng Anh ở đây..."
                    className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:border-blue-500 disabled:opacity-60"
                  />
                  {!isAnswered && (
                    <button
                      type="submit"
                      disabled={!typedInput.trim()}
                      className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-sm transition-colors"
                    >
                      Kiểm tra
                    </button>
                  )}
                </div>
              </form>
            ) : (
              /* MCQ / AUDIO OPTION GRID */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {options.map((opt, idx) => {
                  const numLabel = idx + 1;
                  const isSelected = selectedOption === opt;
                  const targetOpt = questionType === 'audio' ? currentCard.backText : currentCard.frontText;
                  const isCorrectOpt = opt === targetOpt;

                  let cardStyle = 'bg-[#F8FAFC] dark:bg-[#0F172A] border-[#E4E8F0] dark:border-[#334155] text-slate-800 dark:text-slate-200 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#0F172A]';

                  if (isAnswered) {
                    if (isCorrectOpt) {
                      cardStyle = 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                    } else if (isSelected) {
                      cardStyle = 'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-900 dark:text-rose-200 font-bold';
                    } else {
                      cardStyle = 'bg-slate-100 dark:bg-[#0F172A]/30 border-transparent opacity-40';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => {
                        setSelectedOption(opt);
                        handleCheckAnswer(opt);
                      }}
                      className={`p-4 rounded-2xl border text-left text-sm font-semibold flex items-center gap-3 transition-all ${cardStyle}`}
                    >
                      <span className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {numLabel}
                      </span>
                      <span className="flex-1 leading-snug break-words">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ANSWER FEEDBACK PANEL */}
          {isAnswered && (
            <div className={`p-4 sm:p-5 rounded-2xl border text-sm font-bold flex items-center justify-between animate-in fade-in duration-200 ${
              isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700/80 text-emerald-900 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700/80 text-rose-900 dark:text-rose-300'
            }`}>
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <div>
                  <p className="font-extrabold text-base">
                    {isCorrect ? 'Chính xác! Hoàn thành xuất sắc' : 'Chưa đúng rồi!'}
                  </p>
                  {!isCorrect && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-normal mt-0.5">
                      Đáp án đúng: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{currentCard.frontText}</strong> ({currentCard.backText})
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-md shrink-0"
              >
                <span>Tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* FOOTER: DON'T KNOW BUTTON */}
          {!isAnswered && (
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={handleDontKnow}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Bạn không biết?</span>
              </button>
            </div>
          )}

        </div>
      ) : (
        /* 3. COMPLETION / MASTERY SCREEN */
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white border border-[#E4E8F0] dark:border-[#334155] shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <Award className="w-20 h-20 text-emerald-500 dark:text-emerald-400 mx-auto animate-bounce" />
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Xuất sắc! Bạn đã làm chủ học phần này</h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm max-w-md mx-auto">
            Bạn đã vượt qua các câu hỏi Trắc nghiệm, Ghi từ & Nghe đoán cho <strong>{totalCount} từ vựng</strong> trong học phần!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                setQueue(cards);
                setCurrentIdx(0);
                setMasteredCount(0);
                setIsAnswered(false);
              }}
              className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Học lại từ đầu</span>
            </button>

            <button
              onClick={onFinish}
              className="px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-extrabold text-xs transition-all"
            >
              Quay lại học phần
            </button>
          </div>
        </div>
      )}

      <ModelDownloadPromptModal
        isOpen={ttsGate.isPromptOpen}
        onClose={ttsGate.closePrompt}
        onGoToSettings={ttsGate.goToSettings}
        {...ttsGate.modalProps}
      />

      </div>
    </div>
  );
};
