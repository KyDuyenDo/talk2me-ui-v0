/**
 * WordScoreDisplay — Shows the target sentence with each word color-coded by score.
 *
 * 🟢 Green (≥80%): Good pronunciation
 * 🟡 Amber (50–79%): Needs improvement
 * 🔴 Red (<50%): Mispronounced — wavy underline + click to drill down
 */

import React from 'react';
import type { WordScore } from '../../../core/entities';

interface WordScoreDisplayProps {
  wordAnalysis: WordScore[];
  selectedWord: string | null;
  onWordClick: (word: string) => void;
}

function getWordColor(score: number): string {
  if (score >= 80) return 'text-emerald-500 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-500 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

function getWordBg(score: number, isSelected: boolean): string {
  if (isSelected) {
    if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (score >= 50) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  }
  return '';
}

export const WordScoreDisplay: React.FC<WordScoreDisplayProps> = ({
  wordAnalysis,
  selectedWord,
  onWordClick,
}) => {
  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 px-2">
      {wordAnalysis.map((wa, idx) => {
        const isSelected = selectedWord === `${wa.word}-${idx}`;
        const wordId = `${wa.word}-${idx}`;
        const isBad = wa.score < 50;

        return (
          <button
            key={wordId}
            onClick={() => onWordClick(wordId)}
            className={`
              relative group px-1.5 py-0.5 rounded-lg transition-all duration-200
              cursor-pointer hover:scale-105
              ${getWordColor(wa.score)}
              ${getWordBg(wa.score, isSelected)}
              ${isSelected ? 'ring-2 ring-offset-1 ring-pink-400 dark:ring-offset-slate-900' : ''}
            `}
            title={`${wa.word} — ${wa.score}%`}
          >
            {/* Word text */}
            <span
              className={`
                text-lg sm:text-xl font-bold
                ${isBad ? 'underline decoration-wavy decoration-red-400 underline-offset-4 decoration-2' : ''}
              `}
            >
              {wa.word}
            </span>

            {/* Score badge (show on hover or when selected) */}
            <span
              className={`
                absolute -top-5 left-1/2 -translate-x-1/2
                text-[10px] font-extrabold px-1.5 py-0.5 rounded-full
                whitespace-nowrap transition-opacity duration-200
                ${wa.score >= 80
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                  : wa.score >= 50
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                }
                ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              `}
            >
              {Math.round(wa.score)}%
            </span>
          </button>
        );
      })}
    </div>
  );
};
