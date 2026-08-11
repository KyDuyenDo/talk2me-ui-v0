import React, { useState } from 'react';
import { Lesson, QuizQuestion } from '../../../core/entities';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Award } from 'lucide-react';
import { updateProgress } from '../../../infrastructure/api/talk2meApi';
import { CompletedModeGate } from './CompletedModeGate';

interface QuizPlayerProps {
  lesson: Lesson;
  courseId: string;
  lessonId: string;
  onFinishQuiz: (scorePercent: number) => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ lesson, courseId, lessonId, onFinishQuiz }) => {
  const questions = lesson.quizQuestions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const savedProgress = lesson.modeProgress?.quiz;
  if (savedProgress?.completed && !isRetrying && !showResults) {
    return (
      <CompletedModeGate
        title="Bạn đã hoàn thành Quiz này"
        scoreLabel={savedProgress.accuracy != null ? `${Math.round(savedProgress.accuracy)}%` : undefined}
        onRetry={() => setIsRetrying(true)}
        onContinue={() => onFinishQuiz(savedProgress.accuracy ?? 0)}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-8 border border-[#E4E8F0] text-center space-y-4">
        <p className="text-sm text-[#5A6478]">No quiz questions available for this lesson.</p>
        <button onClick={() => onFinishQuiz(100)} className="px-6 py-2.5 rounded-full bg-[#2E68FF] text-white text-xs font-bold">
          Continue
        </button>
      </div>
    );
  }

  const currentQ: QuizQuestion = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
    setIsSubmitted(true);

    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentIndex] = index;
    setUserAnswers(updatedAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(userAnswers[currentIndex + 1] ?? null);
      setIsSubmitted(userAnswers[currentIndex + 1] !== undefined);
    } else {
      let correctCount = 0;
      questions.forEach((q, idx) => {
        if (userAnswers[idx] === q.correctAnswer) {
          correctCount++;
        }
      });
      const percent = Math.round((correctCount / questions.length) * 100);
      setShowResults(true);
      updateProgress(courseId, lessonId, 'quiz', true, percent).catch((err) =>
        console.warn('Không lưu được tiến độ Quiz:', err)
      );
      onFinishQuiz(percent);
    }
  };

  const calculateScore = () => {
    let count = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) count++;
    });
    return { count, total: questions.length, percent: Math.round((count / questions.length) * 100) };
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-8 border border-[#E4E8F0] dark:border-[#334155] shadow-sm text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#2E68FF] flex items-center justify-center mx-auto shadow-md">
          <Award className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-extrabold text-[#1B1F2E] dark:text-white">
            Quiz Completed!
          </h3>
          <p className="text-sm text-[#5A6478] dark:text-[#CBD5E1]">
            You scored <span className="font-bold text-[#2E68FF]">{score.count} / {score.total}</span> ({score.percent}%)
          </p>
        </div>

        <div className="inline-block px-6 py-3 rounded-full bg-[#F1F4F9] dark:bg-[#273449] font-extrabold text-lg text-[#2E68FF]">
          {score.percent >= 80 ? '🎉 Excellent Understanding!' : score.percent >= 50 ? '👍 Good Effort!' : '💪 Keep Practicing!'}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setSelectedOption(null);
              setUserAnswers([]);
              setIsSubmitted(false);
              setShowResults(false);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#F1F4F9] dark:bg-[#273449] text-[#1B1F2E] dark:text-white font-bold text-xs uppercase flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Quiz</span>
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = selectedOption === currentQ.correctAnswer;

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 sm:p-8 border border-[#E4E8F0] dark:border-[#334155] shadow-sm space-y-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-3 border-b border-[#E4E8F0] dark:border-[#334155]">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#2E68FF] flex items-center justify-center font-bold text-sm">
            ✓
          </span>
          <span className="font-bold text-sm text-[#1B1F2E] dark:text-white">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="w-full sm:w-36 h-2 bg-[#F1F4F9] dark:bg-[#273449] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#2E68FF] transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-[#5A6478] dark:text-[#CBD5E1] whitespace-nowrap">Questions:</span>
        <div className="flex items-center gap-1.5">
          {questions.map((qItem, qIdx) => {
            const isCurrent = qIdx === currentIndex;
            const isAnswered = userAnswers[qIdx] !== undefined;
            const isCorrectAnswer = isAnswered && userAnswers[qIdx] === qItem.correctAnswer;

            let pillClass = 'bg-[#F1F4F9] dark:bg-[#273449] text-[#5A6478] dark:text-[#CBD5E1] border border-transparent';
            if (isAnswered) {
              pillClass = isCorrectAnswer 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 font-bold'
                : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 font-bold';
            }
            if (isCurrent) {
              pillClass = 'bg-blue-50 dark:bg-blue-950/80 text-[#2E68FF] dark:text-blue-400 border-2 border-[#2E68FF] font-extrabold shadow-xs';
            }

            return (
              <button
                key={qItem.id || qIdx}
                onClick={() => {
                  setCurrentIndex(qIdx);
                  setSelectedOption(userAnswers[qIdx] ?? null);
                  setIsSubmitted(userAnswers[qIdx] !== undefined);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all ${pillClass}`}
              >
                Q{qIdx + 1}
              </button>
            );
          })}
        </div>
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-[#1B1F2E] dark:text-white leading-snug">
        {currentQ.question}
      </h3>

      <div className="space-y-3">
        {currentQ.options.map((optionText, optIdx) => {
          const isSelected = selectedOption === optIdx;
          const isRightAnswer = optIdx === currentQ.correctAnswer;

          let optionStyle = 'bg-[#F1F4F9] dark:bg-[#273449] border-[#E4E8F0] dark:border-[#334155] hover:border-[#2E68FF] text-[#1B1F2E] dark:text-[#F1F5F9]';

          if (isSubmitted) {
            if (isRightAnswer) {
              optionStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
            } else if (isSelected && !isRightAnswer) {
              optionStyle = 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-900 dark:text-red-200';
            }
          }

          return (
            <button
              key={optIdx}
              onClick={() => handleSelectOption(optIdx)}
              disabled={isSubmitted}
              className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-between gap-3 ${optionStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  isSelected ? 'bg-[#2E68FF] text-white' : 'bg-white dark:bg-slate-800 text-[#5A6478]'
                }`}>
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <span>{optionText}</span>
              </div>

              {isSubmitted && isRightAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {isSubmitted && isSelected && !isRightAnswer && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
            </button>
          );
        })}
      </div>

      {isSubmitted && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-1.5 animate-in fade-in duration-200 ${
          isCorrect 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-2 font-bold">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Correct Answer!</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Incorrect</span>
              </>
            )}
          </div>
          <p className="leading-relaxed opacity-90">{currentQ.explanation}</p>
        </div>
      )}

      <div className="pt-4 flex justify-end border-t border-[#E4E8F0] dark:border-[#334155]">
        <button
          onClick={handleNext}
          disabled={!isSubmitted}
          className={`px-8 py-3.5 rounded-2xl font-extrabold text-xs uppercase tracking-wide flex items-center gap-2 transition-all ${
            isSubmitted
              ? 'bg-[#2E68FF] hover:bg-[#1E52DB] text-white shadow-lg shadow-blue-500/20'
              : 'bg-[#F1F4F9] dark:bg-[#273449] text-[#95A0B4] cursor-not-allowed'
          }`}
        >
          <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
