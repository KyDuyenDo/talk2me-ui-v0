import React, { useState } from 'react';
import { WritingPrompt, WritingEvaluation, ModeProgress } from '../../../core/entities';
import { evaluateWriting } from '../../../infrastructure/api/talk2meApi';
import { Sparkles, AlertTriangle, ArrowRight, Loader2, BookOpen, RotateCcw, Award, FileText, Lightbulb, Volume2 } from 'lucide-react';
import { CompletedModeGate } from './CompletedModeGate';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useAiResourceGate } from '../../hooks/useAiResourceGate';
import { ModelDownloadPromptModal } from './ModelDownloadPromptModal';

interface WritingExerciseProps {
  courseId: string;
  lessonId: string;
  prompt?: WritingPrompt;
  progress?: ModeProgress;
  onFinishWriting: () => void;
}

export const WritingExercise: React.FC<WritingExerciseProps> = ({
  courseId,
  lessonId,
  prompt,
  progress,
  onFinishWriting,
}) => {
  const [submissionText, setSubmissionText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<WritingEvaluation | null>(null);
  const [evalError, setEvalError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const { speak, preload } = useTextToSpeech();
  const ttsGate = useAiResourceGate('tts', preload);

  if (progress?.completed && !isRetrying && !evaluation) {
    return (
      <CompletedModeGate
        title="Bạn đã hoàn thành Writing này"
        scoreLabel={progress.accuracy != null ? `Band ${progress.accuracy}` : undefined}
        onRetry={() => setIsRetrying(true)}
        onContinue={onFinishWriting}
      />
    );
  }

  const wordCount = submissionText.trim() ? submissionText.trim().split(/\s+/).length : 0;

  const promptText = prompt?.promptText || 'Summarize the core takeaways from this lesson in 100-150 words using your own vocabulary.';

  const sampleText = prompt?.sampleAnswer ||
    "Semantic HTML and structured layout architectures are vital for modern web application performance and accessibility. By utilizing clear semantic tags like article and nav, search engines accurately parse page hierarchy while screen readers offer effortless navigation for visually impaired users.";

  const handleFillSample = () => {
    setSubmissionText(sampleText);
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSubmit = submissionText.trim() || sampleText;
    setIsEvaluating(true);
    setEvalError('');

    try {
      const result = await evaluateWriting(courseId, lessonId, textToSubmit);
      setEvaluation(result);
    } catch (err: any) {
      console.error('Writing evaluation failed:', err);
      setEvalError(err.message || 'Không thể chấm điểm bài viết. Vui lòng thử lại.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 sm:p-8 border border-[#E4E8F0] dark:border-[#334155] shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E4E8F0] dark:border-[#334155]">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-[#F79009] flex items-center justify-center font-bold text-sm">
            ✎
          </span>
          <span className="font-bold text-sm text-[#1B1F2E] dark:text-white">
            Writing Exercise & AI Feedback
          </span>
        </div>

        {!evaluation && (
          <button
            type="button"
            onClick={handleFillSample}
            className="text-xs font-bold text-[#F79009] hover:underline flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Use Sample Answer</span>
          </button>
        )}
      </div>

      {/* Prompt Card */}
      <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-[#F79009] uppercase">Writing Prompt:</p>
          <button
            type="button"
            onClick={() => speak(promptText)}
            title="Đọc to câu hỏi"
            className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-[#F79009] hover:scale-110 transition-transform shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-sm sm:text-base font-bold text-[#1B1F2E] dark:text-white leading-snug">
          {promptText}
        </p>
        <p className="text-xs text-[#5A6478] dark:text-[#CBD5E1]">
          Suggested target: <span className="font-bold text-[#F79009]">{prompt?.suggestedWordCount || 120} words</span>
        </p>

        {prompt?.hintText && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F79009] hover:underline"
            >
              <Lightbulb className="w-3 h-3" />
              <span>{showHint ? 'Ẩn gợi ý' : 'Xem gợi ý'}</span>
            </button>
            {showHint && (
              <p className="text-[11px] text-[#5A6478] dark:text-[#94A3B8] mt-1">{prompt.hintText}</p>
            )}
          </div>
        )}
      </div>

      {/* Essay Editor Form */}
      <form onSubmit={handleEvaluate} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[#1B1F2E] dark:text-[#F1F5F9] uppercase">
              Your Written Response
            </label>
            <span className="text-xs text-[#5A6478] font-bold">
              {wordCount} words
            </span>
          </div>

          <textarea
            rows={6}
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            disabled={isEvaluating}
            placeholder="Type your response here or click 'Use Sample Answer' to test..."
            className="w-full p-4 rounded-2xl bg-[#F1F4F9] dark:bg-[#273449] border border-[#E4E8F0] dark:border-[#334155] text-sm text-[#1B1F2E] dark:text-white focus:ring-2 focus:ring-[#F79009] focus:outline-none placeholder-[#95A0B4]"
          />
        </div>

        {evalError && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{evalError}</span>
          </div>
        )}

        {!evaluation && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={isEvaluating}
              className="w-full py-3.5 rounded-2xl bg-[#F79009] hover:bg-[#d97d02] text-white font-extrabold text-xs uppercase tracking-wide shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Analyzing Rubric & Grammar...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Evaluate Response with AI</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* AI Assessment Results View */}
      {evaluation && (
        <div className="space-y-6 pt-4 border-t border-[#E4E8F0] dark:border-[#334155] animate-in fade-in duration-200">
          
          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#F79009] uppercase tracking-wider">AI Writing Band Assessment</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#1B1F2E] dark:text-white">
                  Band {evaluation.overallScore}
                </span>
                <span className="text-xs text-[#5A6478] dark:text-[#CBD5E1] font-semibold">/ 9.0 CEFR C1 Standard</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F79009] text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Award className="w-7 h-7" />
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#1B1F2E] dark:text-[#CBD5E1] font-medium leading-relaxed bg-[#F1F4F9] dark:bg-[#273449] p-4 rounded-xl">
            💡 <span className="font-bold">AI Feedback Summary:</span> {evaluation.summary}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-white dark:bg-[#273449] border border-[#E4E8F0] dark:border-[#334155] space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1B1F2E] dark:text-white">Task Response</span>
                <span className="text-[#F79009] font-extrabold text-sm">{evaluation.criteria?.taskResponse?.score || 7.5}</span>
              </div>
              <div className="w-full h-1.5 bg-[#F1F4F9] dark:bg-[#1E293B] rounded-full overflow-hidden">
                <div className="h-full bg-[#F79009]" style={{ width: `${((evaluation.criteria?.taskResponse?.score || 7.5) / 9) * 100}%` }} />
              </div>
              <p className="text-[#5A6478] dark:text-[#CBD5E1] text-[11px] leading-snug">{evaluation.criteria?.taskResponse?.feedback}</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#273449] border border-[#E4E8F0] dark:border-[#334155] space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1B1F2E] dark:text-white">Coherence & Cohesion</span>
                <span className="text-[#F79009] font-extrabold text-sm">{evaluation.criteria?.coherenceCohesion?.score || 7.0}</span>
              </div>
              <div className="w-full h-1.5 bg-[#F1F4F9] dark:bg-[#1E293B] rounded-full overflow-hidden">
                <div className="h-full bg-[#F79009]" style={{ width: `${((evaluation.criteria?.coherenceCohesion?.score || 7.0) / 9) * 100}%` }} />
              </div>
              <p className="text-[#5A6478] dark:text-[#CBD5E1] text-[11px] leading-snug">{evaluation.criteria?.coherenceCohesion?.feedback}</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#273449] border border-[#E4E8F0] dark:border-[#334155] space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1B1F2E] dark:text-white">Lexical Resource</span>
                <span className="text-[#F79009] font-extrabold text-sm">{evaluation.criteria?.lexicalResource?.score || 8.0}</span>
              </div>
              <div className="w-full h-1.5 bg-[#F1F4F9] dark:bg-[#1E293B] rounded-full overflow-hidden">
                <div className="h-full bg-[#F79009]" style={{ width: `${((evaluation.criteria?.lexicalResource?.score || 8.0) / 9) * 100}%` }} />
              </div>
              <p className="text-[#5A6478] dark:text-[#CBD5E1] text-[11px] leading-snug">{evaluation.criteria?.lexicalResource?.feedback}</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#273449] border border-[#E4E8F0] dark:border-[#334155] space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1B1F2E] dark:text-white">Grammar & Accuracy</span>
                <span className="text-[#F79009] font-extrabold text-sm">{evaluation.criteria?.grammaticalAccuracy?.score || 7.5}</span>
              </div>
              <div className="w-full h-1.5 bg-[#F1F4F9] dark:bg-[#1E293B] rounded-full overflow-hidden">
                <div className="h-full bg-[#F79009]" style={{ width: `${((evaluation.criteria?.grammaticalAccuracy?.score || 7.5) / 9) * 100}%` }} />
              </div>
              <p className="text-[#5A6478] dark:text-[#CBD5E1] text-[11px] leading-snug">{evaluation.criteria?.grammaticalAccuracy?.feedback}</p>
            </div>
          </div>

          {evaluation.highlightedErrors && evaluation.highlightedErrors.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs space-y-3">
              <p className="font-bold text-[#1B1F2E] dark:text-white flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-[#F79009]">
                <AlertTriangle className="w-4 h-4 text-[#F79009]" />
                <span>Suggested Refinements & Grammar Corrections</span>
              </p>
              
              <div className="space-y-2">
                {evaluation.highlightedErrors.map((errItem, errIdx) => (
                  <div key={errIdx} className="p-3 rounded-xl bg-white dark:bg-[#273449] border border-[#E4E8F0] dark:border-[#334155] space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="line-through text-red-500 font-medium">{errItem.originalText}</span>
                        <span className="text-[#5A6478]">→</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{errItem.suggestedText}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-[#F79009] text-[10px] font-extrabold uppercase">
                        {errItem.errorType || 'Grammar'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5A6478] dark:text-[#CBD5E1]">{errItem.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {evaluation.improvedModelAnswer && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <p className="font-bold text-[#1B1F2E] dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#F79009]" />
                <span>Improved Band 9.0 Model Answer:</span>
              </p>
              <p className="text-[#5A6478] dark:text-[#CBD5E1] italic leading-relaxed">
                "{evaluation.improvedModelAnswer}"
              </p>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setEvaluation(null)}
              className="px-5 py-2.5 rounded-xl bg-[#F1F4F9] dark:bg-[#273449] text-[#1B1F2E] dark:text-white font-bold text-xs uppercase flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Edit Response</span>
            </button>

            <button
              onClick={onFinishWriting}
              className="px-8 py-3.5 rounded-2xl bg-[#F79009] hover:bg-[#d97d02] text-white font-extrabold text-xs uppercase tracking-wide flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <span>Complete Writing Exercise</span>
              <ArrowRight className="w-4 h-4" />
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
  );
};
