import React, { useState } from 'react';
import { X, FolderPlus, Check } from 'lucide-react';
import { FlashcardFolder, FlashcardSet } from '../../../core/entities';
import { createFlashcardFolder } from '../../../infrastructure/api/talk2meApi';

interface FlashcardFolderModalProps {
  isOpen: boolean;
  initialFolder?: FlashcardFolder | null;
  allSets: FlashcardSet[];
  onClose: () => void;
  onSaveFolder: (folder: FlashcardFolder) => void;
}

export const FlashcardFolderModal: React.FC<FlashcardFolderModalProps> = ({
  isOpen,
  initialFolder,
  allSets,
  onClose,
  onSaveFolder,
}) => {
  const [name, setName] = useState(initialFolder?.name || '');
  const [description, setDescription] = useState(initialFolder?.description || '');
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>(
    initialFolder?.setIds || []
  );

  if (!isOpen) return null;

  const toggleSetSelection = (setId: string) => {
    setSelectedSetIds((prev) =>
      prev.includes(setId) ? prev.filter((id) => id !== setId) : [...prev, setId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Vui lòng nhập tên thư mục!');
      return;
    }

    // Editing an existing folder, and the set<->folder association below, stay local-only —
    // the backend only supports create/delete for folders (no update endpoint), and a set's
    // folder is only settable at the set's own creation time.
    if (initialFolder) {
      const folder: FlashcardFolder = {
        ...initialFolder,
        name: name.trim(),
        description: description.trim(),
        setIds: selectedSetIds,
      };
      onSaveFolder(folder);
      onClose();
      return;
    }

    try {
      const created = await createFlashcardFolder({ name: name.trim(), color: '#2E68FF' });
      onSaveFolder({ ...created, description: description.trim(), setIds: selectedSetIds });
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể tạo thư mục.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white w-full max-w-lg rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-2xl p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E8F0] dark:border-[#334155]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#2E68FF] flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold">
              {initialFolder ? 'Chỉnh sửa thư mục' : 'Tạo thư mục mới'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-700 dark:text-slate-300">
              Tên thư mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Từ vựng IELTS, Lập trình Frontend..."
              className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-700 dark:text-slate-300">
              Mô tả thư mục (không bắt buộc)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Thêm ghi chú hoặc định hướng học tập cho thư mục..."
              className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Include Study Sets */}
          {allSets.length > 0 && (
            <div className="space-y-2 pt-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300 block">
                Chọn các học phần đưa vào thư mục này:
              </label>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {allSets.map((set) => {
                  const isChecked = selectedSetIds.includes(set.id);
                  return (
                    <div
                      key={set.id}
                      onClick={() => toggleSetSelection(set.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                          : 'border-[#E4E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold block text-xs">{set.title}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {set.cardsCount ?? set.cards.length} thẻ ghi nhớ
                        </span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E4E8F0] dark:border-[#334155] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Hủy
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#2E68FF] hover:bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-transform active:scale-95"
          >
            Lưu thư mục
          </button>
        </div>

      </div>
    </div>
  );
};
