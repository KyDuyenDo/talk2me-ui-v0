import React from 'react';
import { CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';

interface CompletedModeGateProps {
  title: string;
  scoreLabel?: string;
  onRetry: () => void;
  onContinue: () => void;
  continueLabel?: string;
}

/**
 * Shown instead of an exercise's normal UI when the user's most recent saved attempt for
 * this mode is already 'completed' (see Lesson.modeProgress) — lets them either redo it
 * from scratch or move on without repeating work they already did.
 */
export const CompletedModeGate: React.FC<CompletedModeGateProps> = ({
  title,
  scoreLabel,
  onRetry,
  onContinue,
  continueLabel = 'Tiếp tục',
}) => {
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-8 border border-[#E4E8F0] dark:border-[#334155] shadow-sm text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-extrabold text-[#1B1F2E] dark:text-white">{title}</h3>
        {scoreLabel && (
          <p className="text-sm text-[#5A6478] dark:text-[#CBD5E1]">
            Kết quả gần nhất: <span className="font-bold text-emerald-600 dark:text-emerald-400">{scoreLabel}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onRetry}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#F1F4F9] dark:bg-[#273449] text-[#1B1F2E] dark:text-white font-bold text-xs uppercase flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Làm lại</span>
        </button>

        <button
          onClick={onContinue}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#2E68FF] hover:bg-[#1E52DB] text-white font-extrabold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <span>{continueLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
