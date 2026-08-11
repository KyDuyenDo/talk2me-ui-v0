import React, { useEffect, useState } from 'react';
import { X, Layers, Check, Film } from 'lucide-react';
import {
  getFlashcardSets,
  createFlashcardSet,
  createFlashcard,
  FlashcardSetSummary,
} from '../../../infrastructure/api/talk2meApi';

interface VideoClip {
  videoId: string;
  startTime: number;
  endTime: number;
}

interface AddToFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFrontText: string;
  initialBackText: string;
  initialPhonetic?: string;
  initialExampleSentence?: string;
  videoClip?: VideoClip;
}

export const AddToFlashcardModal: React.FC<AddToFlashcardModalProps> = ({
  isOpen,
  onClose,
  initialFrontText,
  initialBackText,
  initialPhonetic,
  initialExampleSentence,
  videoClip,
}) => {
  const [frontText, setFrontText] = useState(initialFrontText);
  const [backText, setBackText] = useState(initialBackText);
  const [phonetic, setPhonetic] = useState(initialPhonetic || '');
  const [exampleSentence, setExampleSentence] = useState(initialExampleSentence || '');
  const [includeClip, setIncludeClip] = useState(Boolean(videoClip));

  const [sets, setSets] = useState<FlashcardSetSummary[]>([]);
  const [isLoadingSets, setIsLoadingSets] = useState(false);
  const [target, setTarget] = useState<'existing' | 'new'>('new');
  const [selectedSetId, setSelectedSetId] = useState('');
  const [newSetTitle, setNewSetTitle] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  // Re-seed the form every time the modal is (re)opened for a new item — this single modal
  // instance is reused across many rows (vocabulary/grammar/dictation/shadowing), so it must
  // not keep stale text from the previous row it was opened for.
  useEffect(() => {
    if (!isOpen) return;
    setFrontText(initialFrontText);
    setBackText(initialBackText);
    setPhonetic(initialPhonetic || '');
    setExampleSentence(initialExampleSentence || '');
    setIncludeClip(Boolean(videoClip));
    setError(null);
    setSavedOk(false);
    setTarget('new');
    setSelectedSetId('');
    setNewSetTitle('');

    setIsLoadingSets(true);
    getFlashcardSets()
      .then((res) => {
        setSets(res);
        if (res.length > 0) {
          setTarget('existing');
          setSelectedSetId(res[0].id);
        }
      })
      .catch(() => setSets([]))
      .finally(() => setIsLoadingSets(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!frontText.trim() || !backText.trim()) {
      setError('Vui lòng nhập đủ mặt trước và mặt sau của thẻ.');
      return;
    }
    if (target === 'new' && !newSetTitle.trim()) {
      setError('Vui lòng nhập tên bộ thẻ mới.');
      return;
    }
    if (target === 'existing' && !selectedSetId) {
      setError('Vui lòng chọn một bộ thẻ.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const setId =
        target === 'new'
          ? (await createFlashcardSet({ title: newSetTitle.trim() })).id
          : selectedSetId;

      await createFlashcard({
        setId,
        frontText: frontText.trim(),
        backText: backText.trim(),
        phonetic: phonetic.trim() || undefined,
        exampleSentence: exampleSentence.trim() || undefined,
        sourceVideoId: includeClip && videoClip ? videoClip.videoId : undefined,
        clipStartSec: includeClip && videoClip ? Math.floor(videoClip.startTime) : undefined,
        clipEndSec: includeClip && videoClip ? Math.ceil(videoClip.endTime) : undefined,
      });

      setSavedOk(true);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu thẻ ghi nhớ.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white w-full max-w-lg rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-2xl p-6 space-y-5">

        <div className="flex items-center justify-between pb-3 border-b border-[#E4E8F0] dark:border-[#334155]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#2E68FF] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold">Thêm vào Flashcard</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedOk ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm">Đã lưu vào Flashcard!</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Mặt trước</label>
                <input
                  type="text"
                  value={frontText}
                  onChange={(e) => setFrontText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Mặt sau</label>
                <input
                  type="text"
                  value={backText}
                  onChange={(e) => setBackText(e.target.value)}
                  placeholder="Nhập nghĩa / bản dịch..."
                  className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300">Phiên âm</label>
                  <input
                    type="text"
                    value={phonetic}
                    onChange={(e) => setPhonetic(e.target.value)}
                    placeholder="(không bắt buộc)"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300">Câu ví dụ</label>
                  <input
                    type="text"
                    value={exampleSentence}
                    onChange={(e) => setExampleSentence(e.target.value)}
                    placeholder="(không bắt buộc)"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {videoClip && (
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeClip}
                    onChange={(e) => setIncludeClip(e.target.checked)}
                    className="w-4 h-4 accent-[#2E68FF]"
                  />
                  <Film className="w-4 h-4 text-[#2E68FF] shrink-0" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Đính kèm đoạn video làm dẫn chứng ({Math.floor(videoClip.startTime)}s–{Math.ceil(videoClip.endTime)}s)
                  </span>
                </label>
              )}

              <div className="space-y-2 pt-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block">Lưu vào:</label>

                {sets.length > 0 && (
                  <div
                    onClick={() => setTarget('existing')}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                      target === 'existing'
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                        : 'border-[#E4E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]'
                    }`}
                  >
                    <span className="font-bold block mb-1.5">Bộ thẻ có sẵn</span>
                    <select
                      value={selectedSetId}
                      onFocus={() => setTarget('existing')}
                      onChange={(e) => {
                        setTarget('existing');
                        setSelectedSetId(e.target.value);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-[#E4E8F0] dark:border-[#334155] rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
                    >
                      {sets.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.cardsCount ?? 0} thẻ)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div
                  onClick={() => setTarget('new')}
                  className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                    target === 'new'
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                      : 'border-[#E4E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]'
                  }`}
                >
                  <span className="font-bold block mb-1.5">Tạo bộ thẻ mới</span>
                  <input
                    type="text"
                    value={newSetTitle}
                    onFocus={() => setTarget('new')}
                    onChange={(e) => {
                      setTarget('new');
                      setNewSetTitle(e.target.value);
                    }}
                    placeholder="Tên bộ thẻ mới..."
                    className="w-full bg-white dark:bg-slate-900 border border-[#E4E8F0] dark:border-[#334155] rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {isLoadingSets && <p className="text-slate-400">Đang tải danh sách bộ thẻ...</p>}
              {error && <p className="text-red-500 font-semibold">{error}</p>}
            </div>

            <div className="pt-3 border-t border-[#E4E8F0] dark:border-[#334155] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#2E68FF] hover:bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-transform active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu vào Flashcard'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
