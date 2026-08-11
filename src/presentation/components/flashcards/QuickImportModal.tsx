import React, { useState, useMemo } from 'react';
import { X, Check, FileText } from 'lucide-react';
import { Flashcard } from '../../../core/entities';

interface QuickImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCards: (importedCards: Partial<Flashcard>[]) => void;
}

export const QuickImportModal: React.FC<QuickImportModalProps> = ({
  isOpen,
  onClose,
  onImportCards,
}) => {
  const [rawText, setRawText] = useState<string>(
    'Pivotal\tQuan trọng then chốt, có tính chất quyết định.\nUbiquitous\tCó mặt ở khắp mọi nơi, phổ biến rộng rãi.\nProfound impact\tTác động sâu sắc, ảnh hưởng lớn lao.\nMeticulous\tTỉ mỉ, cẩn thận, trau chuốt từng chi tiết.'
  );

  const [termDefSepType, setTermDefSepType] = useState<'tab' | 'comma' | 'custom'>('tab');
  const [termDefCustom, setTermDefCustom] = useState<string>('-');

  const [cardSepType, setCardSepType] = useState<'newline' | 'semicolon' | 'custom'>('newline');
  const [cardCustom, setCardCustom] = useState<string>(';');

  if (!isOpen) return null;

  const getCardDelimiter = (): string => {
    if (cardSepType === 'newline') return '\n';
    if (cardSepType === 'semicolon') return ';';
    return cardCustom || '\n';
  };

  const getTermDefDelimiter = (): RegExp | string => {
    if (termDefSepType === 'tab') return '\t';
    if (termDefSepType === 'comma') return ',';
    return termDefCustom || '\t';
  };

  const parsedPreviewCards = useMemo(() => {
    if (!rawText.trim()) return [];

    const cardDelim = getCardDelimiter();
    const termDefDelim = getTermDefDelimiter();

    const chunks = rawText
      .split(cardDelim)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const cards: { frontText: string; backText: string }[] = [];

    chunks.forEach((chunk) => {
      let parts: string[] = [];
      if (typeof termDefDelim === 'string') {
        if (termDefDelim === '\t') {
          parts = chunk.split(/\t|\s{2,}/);
        } else {
          parts = chunk.split(termDefDelim);
        }
      } else {
        parts = chunk.split(termDefDelim);
      }

      if (parts.length >= 2) {
        const front = parts[0].trim();
        const back = parts.slice(1).join(typeof termDefDelim === 'string' ? termDefDelim : ' ').trim();
        if (front || back) {
          cards.push({ frontText: front, backText: back });
        }
      } else if (parts.length === 1 && parts[0].trim()) {
        cards.push({ frontText: parts[0].trim(), backText: '' });
      }
    });

    return cards;
  }, [rawText, termDefSepType, termDefCustom, cardSepType, cardCustom]);

  const handleApplyImport = () => {
    if (parsedPreviewCards.length === 0) return;
    onImportCards(parsedPreviewCards);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white w-full max-w-4xl max-h-[92vh] rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E4E8F0] dark:border-[#334155] flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2 text-[#1B1F2E] dark:text-white">
              <FileText className="w-5 h-5 text-[#2E68FF]" />
              <span>Nhập dữ liệu</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Chép và dán dữ liệu ở đây (từ Word, Excel, Google Docs, Quizlet, v.v.)
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          <div className="space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              Dán văn bản bài học của bạn:
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Từ 1	Định nghĩa 1&#10;Từ 2	Định nghĩa 2&#10;Từ 3	Định nghĩa 3"
              className="w-full p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono text-xs focus:outline-none focus:border-[#2E68FF] focus:ring-1 focus:ring-[#2E68FF] leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#F8FAFC] dark:bg-[#0F172A] p-5 rounded-2xl border border-[#E4E8F0] dark:border-[#334155]">
            
            <div className="space-y-3">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                Giữa thuật ngữ và định nghĩa
              </span>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                  <input
                    type="radio"
                    name="termDefSep"
                    checked={termDefSepType === 'tab'}
                    onChange={() => setTermDefSepType('tab')}
                    className="w-4 h-4 accent-[#2E68FF]"
                  />
                  <span>Tab</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                  <input
                    type="radio"
                    name="termDefSep"
                    checked={termDefSepType === 'comma'}
                    onChange={() => setTermDefSepType('comma')}
                    className="w-4 h-4 accent-[#2E68FF]"
                  />
                  <span>Phẩy ( , )</span>
                </label>

                <div className="flex items-center gap-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                    <input
                      type="radio"
                      name="termDefSep"
                      checked={termDefSepType === 'custom'}
                      onChange={() => setTermDefSepType('custom')}
                      className="w-4 h-4 accent-[#2E68FF]"
                    />
                    <span>Tùy chỉnh</span>
                  </label>

                  {termDefSepType === 'custom' && (
                    <input
                      type="text"
                      value={termDefCustom}
                      onChange={(e) => setTermDefCustom(e.target.value)}
                      className="w-20 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-[#E4E8F0] dark:border-[#334155] text-slate-900 dark:text-white font-mono text-center focus:outline-none focus:border-[#2E68FF]"
                      placeholder="vd: -"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                Giữa các thẻ
              </span>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                  <input
                    type="radio"
                    name="cardSep"
                    checked={cardSepType === 'newline'}
                    onChange={() => setCardSepType('newline')}
                    className="w-4 h-4 accent-[#2E68FF]"
                  />
                  <span>Dòng mới</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                  <input
                    type="radio"
                    name="cardSep"
                    checked={cardSepType === 'semicolon'}
                    onChange={() => setCardSepType('semicolon')}
                    className="w-4 h-4 accent-[#2E68FF]"
                  />
                  <span>Chấm phẩy ( ; )</span>
                </label>

                <div className="flex items-center gap-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                    <input
                      type="radio"
                      name="cardSep"
                      checked={cardSepType === 'custom'}
                      onChange={() => setCardSepType('custom')}
                      className="w-4 h-4 accent-[#2E68FF]"
                    />
                    <span>Tùy chỉnh</span>
                  </label>

                  {cardSepType === 'custom' && (
                    <input
                      type="text"
                      value={cardCustom}
                      onChange={(e) => setCardCustom(e.target.value)}
                      className="w-20 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-[#E4E8F0] dark:border-[#334155] text-slate-900 dark:text-white font-mono text-center focus:outline-none focus:border-[#2E68FF]"
                      placeholder="vd: ;;"
                    />
                  )}
                </div>
              </div>
            </div>

          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                Xem trước <span className="text-[#2E68FF]">({parsedPreviewCards.length} thẻ)</span>
              </h3>
            </div>

            {parsedPreviewCards.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-dashed border-[#E4E8F0] dark:border-[#334155] text-center text-slate-400">
                Không có nội dung để xem trước
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {parsedPreviewCards.map((card, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-extrabold block mb-0.5">
                        Thuật ngữ {idx + 1}
                      </span>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{card.frontText || '(Trống)'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-extrabold block mb-0.5">
                        Định nghĩa {idx + 1}
                      </span>
                      <p className="text-slate-600 dark:text-slate-300">{card.backText || '(Trống)'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="p-5 border-t border-[#E4E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
          >
            Hủy nhập
          </button>

          <button
            onClick={handleApplyImport}
            disabled={parsedPreviewCards.length === 0}
            className="px-6 py-2.5 rounded-xl bg-[#2E68FF] hover:bg-blue-600 disabled:opacity-40 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-transform active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Nhập ({parsedPreviewCards.length} thẻ)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
