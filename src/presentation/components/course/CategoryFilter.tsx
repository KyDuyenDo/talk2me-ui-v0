import React, { useRef } from 'react';
import { Category } from '../../../core/entities';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-3 text-center max-w-6xl mx-auto">
      {/* Eyebrow Tag */}
      <div>
        <span className="inline-block px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2E68FF] text-xs font-bold uppercase tracking-wider">
          Featured Courses
        </span>
      </div>

      {/* Main Title */}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B1F2E] dark:text-white tracking-tight">
        AI-Powered Interactive Lessons
      </h2>

      {/* Description */}
      <p className="text-sm text-[#5A6478] dark:text-[#CBD5E1] max-w-lg mx-auto leading-relaxed">
        Chọn khóa học mẫu hoặc tìm theo chủ đề để bắt đầu.
      </p>

      {/* Search Input Bar */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#95A0B4]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search courses by title, topic, or keyword..."
          className="w-full pl-11 pr-10 py-3 text-xs sm:text-sm rounded-full bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] focus:ring-2 focus:ring-[#2E68FF] focus:border-transparent focus:outline-none shadow-sm transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Bar with Horizontal Scroll Navigation */}
      <div className="relative pt-2 px-10 sm:px-14">
        {/* Left Scroll Button */}
        <button
          onClick={() => scroll('left')}
          aria-label="Cuộn sang trái"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] text-[#1B1F2E] dark:text-white flex items-center justify-center shadow-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-[#2E68FF]" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-3 overflow-x-auto py-2 px-2 scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#2E68FF] text-white shadow-md shadow-blue-500/20 scale-105'
                    : 'bg-white dark:bg-[#1E293B] text-[#5A6478] dark:text-[#CBD5E1] border border-[#E4E8F0] dark:border-[#334155] hover:border-[#2E68FF] hover:text-[#2E68FF]'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll('right')}
          aria-label="Cuộn sang phải"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] text-[#1B1F2E] dark:text-white flex items-center justify-center shadow-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105 transition-all"
        >
          <ChevronRight className="w-5 h-5 text-[#2E68FF]" />
        </button>
      </div>
    </div>
  );
};
