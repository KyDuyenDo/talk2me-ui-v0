import React, { useState, useRef, useEffect } from 'react';
import { Category } from '../../../core/entities';
import { ChevronDown, Check, Plus, X, Search, Tag } from 'lucide-react';

interface CategoryComboboxProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onCreateNewCategory: (newCategoryName: string) => void;
}

export const CategoryCombobox: React.FC<CategoryComboboxProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCreateNewCategory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter out "all" category for selection
  const selectableCategories = categories.filter((c) => c.id !== 'all');
  const selectedCategory = selectableCategories.find((c) => c.id === selectedCategoryId);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Small delay so the dropdown is rendered first
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredCategories = selectableCategories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasExactMatch = selectableCategories.some(
    (cat) => cat.name.toLowerCase() === searchTerm.trim().toLowerCase()
  );

  const handleCreate = () => {
    if (searchTerm.trim()) {
      onCreateNewCategory(searchTerm.trim());
      setSearchTerm('');
      setIsOpen(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setSearchTerm('');
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs font-bold text-[#1B1F2E] dark:text-[#F1F5F9] mb-1.5 uppercase tracking-wider">
        Danh Mục Khóa Học
      </label>

      {/* Trigger Button */}
      <div
        onClick={handleToggle}
        className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-[#F1F4F9] dark:bg-[#273449] border cursor-pointer transition-all flex items-center justify-between gap-2 ${
          isOpen
            ? 'border-[#2E68FF] ring-2 ring-[#2E68FF]/20'
            : 'border-[#E4E8F0] dark:border-[#334155] hover:border-[#2E68FF]/40'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {selectedCategory ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF1FF] dark:bg-[#1A2540] text-[#2E68FF] dark:text-[#5B8CFF] border border-blue-200/50 dark:border-blue-800/40 max-w-full">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedCategory.color || '#2E68FF' }}
              />
              <span className="truncate">{selectedCategory.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCategory('');
                }}
                className="hover:text-red-500 p-0.5 rounded-full shrink-0 transition-colors"
                title="Bỏ chọn danh mục"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ) : (
            <span className="text-xs sm:text-sm text-[#95A0B4]">
              Chọn hoặc tạo danh mục mới...
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#95A0B4] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E4E8F0] dark:border-[#334155] shadow-xl max-h-72 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Sticky Search Input */}
          <div className="sticky top-0 z-10 bg-white dark:bg-[#1E293B] p-2 border-b border-[#E4E8F0] dark:border-[#334155]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#95A0B4]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchTerm.trim() && !hasExactMatch) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
                placeholder="Tìm kiếm hoặc nhập tên danh mục mới..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-[#F1F4F9] dark:bg-[#273449] border border-[#E4E8F0] dark:border-[#334155] focus:ring-2 focus:ring-[#2E68FF]/30 focus:outline-none text-[#1B1F2E] dark:text-white placeholder-[#95A0B4]"
              />
            </div>
          </div>

          {/* Scrollable List */}
          <div className="overflow-y-auto max-h-[calc(18rem-60px)] p-1.5">
            {/* Existing Categories */}
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => {
                const isSelected = cat.id === selectedCategoryId;
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      onSelectCategory(cat.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#EAF1FF] dark:bg-[#1A2540] text-[#2E68FF]'
                        : 'hover:bg-[#F1F4F9] dark:hover:bg-[#273449] text-[#1B1F2E] dark:text-[#F1F5F9]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || '#2E68FF' }}
                      />
                      <span>{cat.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#2E68FF] shrink-0" />}
                  </div>
                );
              })
            ) : searchTerm.trim() ? null : (
              <div className="p-3 text-xs text-[#95A0B4] text-center">
                Chưa có danh mục nào
              </div>
            )}

            {/* Inline Create New Category Option */}
            {searchTerm.trim() && !hasExactMatch && (
              <div
                onClick={handleCreate}
                className="mt-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#2E68FF] hover:bg-[#EAF1FF] dark:hover:bg-[#1A2540] cursor-pointer transition-colors border border-dashed border-[#2E68FF]/30 mx-1 group"
              >
                <div className="w-5 h-5 rounded-full bg-[#2E68FF]/10 flex items-center justify-center group-hover:bg-[#2E68FF]/20 transition-colors">
                  <Plus className="w-3 h-3" />
                </div>
                <span>
                  Tạo danh mục mới: "<strong>{searchTerm.trim()}</strong>"
                </span>
              </div>
            )}

            {/* No results message when searching */}
            {searchTerm.trim() && filteredCategories.length === 0 && hasExactMatch && (
              <div className="p-3 text-xs text-[#95A0B4] text-center">
                Danh mục này đã tồn tại
              </div>
            )}
          </div>

          {/* Footer Hint */}
          <div className="sticky bottom-0 bg-white dark:bg-[#1E293B] border-t border-[#E4E8F0] dark:border-[#334155] px-3 py-2">
            <p className="text-[10px] text-[#95A0B4] flex items-center gap-1.5">
              <Tag className="w-3 h-3" />
              <span>Nhập tên mới và nhấn Enter để tạo danh mục</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
