import React, { useState } from 'react';
import { PlayCircle, BookmarkPlus } from 'lucide-react';
import { VocabularyItem } from '../../../core/entities';
import { AddToFlashcardModal } from '../flashcards/AddToFlashcardModal';

interface VocabularyTableProps {
  items: VocabularyItem[];
  onPlay: (start: number, end: number) => void;
  /** youtubeVideoId of the course — lets each row's "Add to Flashcard" action attach the
   * matching video clip as evidence (optional, per-user choice in the modal). */
  videoId?: string;
}

/**
 * Fixed React table for lesson vocabulary — deliberately NOT rendered from LLM-authored
 * Markdown, so every lesson shows the exact same layout regardless of how the model felt
 * like formatting that particular generation call.
 */
export const VocabularyTable: React.FC<VocabularyTableProps> = ({ items, onPlay, videoId }) => {
  const [addingItem, setAddingItem] = useState<VocabularyItem | null>(null);

  if (!items || items.length === 0) return null;

  const clipFor = (item: VocabularyItem) =>
    videoId && item.startTime != null && item.endTime != null
      ? { videoId, startTime: item.startTime, endTime: item.endTime }
      : undefined;

  return (
    <div className="my-6 -mx-2 sm:mx-0 overflow-x-auto rounded-2xl border border-[#E4E8F0] dark:border-[#334155] shadow-sm">
      <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[640px]">
        <thead className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 sticky top-0 z-10">
          <tr>
            <th className="px-3 sm:px-4 py-3 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300 border-b-2 border-purple-200 dark:border-purple-800/60 whitespace-nowrap">
              Từ / Cụm từ
            </th>
            <th className="px-3 sm:px-4 py-3 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300 border-b-2 border-purple-200 dark:border-purple-800/60 whitespace-nowrap">
              Phiên âm
            </th>
            <th className="px-3 sm:px-4 py-3 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300 border-b-2 border-purple-200 dark:border-purple-800/60 whitespace-nowrap">
              Nghĩa
            </th>
            <th className="px-3 sm:px-4 py-3 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300 border-b-2 border-purple-200 dark:border-purple-800/60">
              Ví dụ trong bài
            </th>
            <th className="px-3 sm:px-4 py-3 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300 border-b-2 border-purple-200 dark:border-purple-800/60 text-center whitespace-nowrap">
              Nghe
            </th>
            <th className="px-3 sm:px-4 py-3 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300 border-b-2 border-purple-200 dark:border-purple-800/60 text-center whitespace-nowrap">
              Flashcard
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E4E8F0] dark:divide-[#334155]">
          {items.map((item, idx) => {
            const canPlay = item.startTime != null && item.endTime != null;
            return (
              <tr
                key={idx}
                className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 even:bg-slate-50/50 dark:even:bg-slate-800/20"
              >
                <td className="px-3 sm:px-4 py-3 text-[#1B1F2E] dark:text-[#E2E8F0] align-top leading-relaxed font-bold">
                  {item.term}
                </td>
                <td className="px-3 sm:px-4 py-3 text-[#5A6478] dark:text-[#94A3B8] align-top leading-relaxed font-mono text-[11px] sm:text-xs whitespace-nowrap">
                  {item.phonetic || '—'}
                </td>
                <td className="px-3 sm:px-4 py-3 text-[#1B1F2E] dark:text-[#E2E8F0] align-top leading-relaxed">
                  {item.meaning}
                </td>
                <td className="px-3 sm:px-4 py-3 text-[#1B1F2E] dark:text-[#E2E8F0] align-top leading-relaxed">
                  <p className="italic">"{item.exampleSentence}"</p>
                  {item.exampleTranslation && (
                    <p className="text-[11px] text-[#5A6478] dark:text-[#94A3B8] mt-1">
                      {item.exampleTranslation}
                    </p>
                  )}
                </td>
                <td className="px-3 sm:px-4 py-3 align-top text-center">
                  <button
                    type="button"
                    disabled={!canPlay}
                    onClick={() => canPlay && onPlay(item.startTime as number, item.endTime as number)}
                    title={canPlay ? 'Nghe đoạn video chứa từ này' : 'Không tìm được đúng vị trí trong video'}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                      canPlay
                        ? 'text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/60'
                        : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <PlayCircle className="w-5 h-5" />
                  </button>
                </td>
                <td className="px-3 sm:px-4 py-3 align-top text-center">
                  <button
                    type="button"
                    onClick={() => setAddingItem(item)}
                    title="Thêm vào Flashcard"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-colors"
                  >
                    <BookmarkPlus className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <AddToFlashcardModal
        isOpen={!!addingItem}
        onClose={() => setAddingItem(null)}
        initialFrontText={addingItem?.term || ''}
        initialBackText={addingItem?.meaning || ''}
        initialPhonetic={addingItem?.phonetic}
        initialExampleSentence={addingItem?.exampleSentence}
        videoClip={addingItem ? clipFor(addingItem) : undefined}
      />
    </div>
  );
};
