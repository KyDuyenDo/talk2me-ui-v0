/**
 * PhonemeBreakdown — Expandable panel showing per-phoneme scores for a selected word.
 *
 * Shows:
 * - Each phoneme with score bar (green/amber/red)
 * - Guidance tips auto-expanded for mispronounced phonemes
 * - Example words and video link
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Volume2, BookOpen } from 'lucide-react';
import type { WordScore, PhonemeScore } from '../../../core/entities';

interface PhonemeBreakdownProps {
  wordScore: WordScore;
  onClose: () => void;
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getStatusIcon(ph: PhonemeScore): string {
  if (ph.score >= 80) return '✅';
  if (ph.score >= 50) return '⚠️';
  return '❌';
}

const PhonemeRow: React.FC<{ phoneme: PhonemeScore }> = ({ phoneme }) => {
  const [expanded, setExpanded] = useState(!phoneme.isCorrect && !!phoneme.guidance);

  return (
    <div className="space-y-1">
      <button
        onClick={() => phoneme.guidance && setExpanded(!expanded)}
        className={`
          w-full flex items-center gap-3 py-2 px-3 rounded-xl transition-colors
          ${phoneme.guidance ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : 'cursor-default'}
        `}
      >
        {/* Status icon */}
        <span className="text-sm w-5 text-center flex-shrink-0">{getStatusIcon(phoneme)}</span>

        {/* IPA symbol */}
        <span className="font-mono text-base font-bold text-[#1B1F2E] dark:text-white w-10 text-left flex-shrink-0">
          /{phoneme.symbol}/
        </span>

        {/* Score bar */}
        <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(phoneme.score)}`}
            style={{ width: `${phoneme.score}%` }}
          />
        </div>

        {/* Score number */}
        <span className={`text-xs font-extrabold w-10 text-right flex-shrink-0 ${getScoreTextColor(phoneme.score)}`}>
          {Math.round(phoneme.score)}%
        </span>

        {/* Expand icon */}
        {phoneme.guidance && (
          <span className="text-slate-400 flex-shrink-0">
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        )}
      </button>

      {/* Guidance panel */}
      {expanded && phoneme.guidance && (
        <div className="ml-8 mr-2 p-3 rounded-xl bg-pink-50/70 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800/50 space-y-2 animate-in slide-in-from-top-1 duration-200">
          <p className="text-xs font-semibold text-pink-700 dark:text-pink-300">
            {phoneme.guidance.name}
          </p>
          <p className="text-xs text-[#5A6478] dark:text-[#CBD5E1] leading-relaxed">
            💡 {phoneme.guidance.tip}
          </p>

          {/* Example words */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <BookOpen className="w-3 h-3 text-pink-400" />
            {phoneme.guidance.exampleWords.map((w) => (
              <span
                key={w}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-300"
              >
                {w}
              </span>
            ))}
          </div>

          {/* Video link */}
          {phoneme.guidance.videoUrl && !phoneme.guidance.videoUrl.includes('PLACEHOLDER') && (
            <a
              href={phoneme.guidance.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-pink-600 dark:text-pink-300 hover:underline"
            >
              <Volume2 className="w-3 h-3" />
              Watch pronunciation video →
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export const PhonemeBreakdown: React.FC<PhonemeBreakdownProps> = ({ wordScore, onClose }) => {
  const incorrectCount = wordScore.phonemes.filter((p) => !p.isCorrect).length;

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-pink-200 dark:border-pink-800/50 shadow-lg shadow-pink-500/5 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-[#1B1F2E] dark:text-white">
            "{wordScore.word}"
          </span>
          <span className={`text-sm font-extrabold ${getScoreTextColor(wordScore.score)}`}>
            {Math.round(wordScore.score)}%
          </span>
          {incorrectCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              {incorrectCount} issue{incorrectCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-xs font-bold"
        >
          ✕
        </button>
      </div>

      {/* Phoneme list */}
      <div className="space-y-0.5">
        {wordScore.phonemes.map((ph, idx) => (
          <PhonemeRow key={`${ph.symbol}-${idx}`} phoneme={ph} />
        ))}
      </div>
    </div>
  );
};
