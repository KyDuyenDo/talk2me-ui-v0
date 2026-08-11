import React, { useState } from 'react';
import { ArrowRight, Sparkles, CheckCircle2, Play, Youtube, Layers } from 'lucide-react';

interface HeroSectionProps {
  onOpenCreateModal: (prefillUrl?: string) => void;
  onExploreCourses: () => void;
  onExploreFlashcards: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenCreateModal,
  onExploreCourses,
  onExploreFlashcards,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (youtubeUrl.trim()) {
      onOpenCreateModal(youtubeUrl.trim());
    } else {
      onOpenCreateModal();
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-8 lg:py-20 bg-gradient-to-b from-[#F7F8FB] via-white to-[#F7F8FB] dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      
      {/* Decorative Background Accents */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-400/10 dark:bg-blue-600/10 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Top Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-[#2E68FF] dark:text-[#5B8CFF] text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 fill-[#2E68FF]" />
              <span>Nền Tảng Học Tiếng Anh AI từ Video YouTube</span>
            </div>

            {/* Display Typography */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1B1F2E] dark:text-white tracking-tight leading-[1.12]">
              Chinh Phục Tiếng Anh cùng <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2E68FF] via-[#7C5CFC] to-[#0EA5C4]">Tri Thức Đúng Đắn</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#5A6478] dark:text-[#CBD5E1] max-w-2xl font-normal leading-relaxed">
              Khám phá thế giới kiến thức tương tác từ các video YouTube yêu thích. Tự động biến video thành bài giảng Lý thuyết, Trắc nghiệm, Nghe-Chép chính tả, Nhại giọng và Luyện nói phản xạ.
            </p>

            {/* Interactive Youtube URL Converter Box */}
            <form onSubmit={handleGenerate} className="p-2 sm:p-2.5 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xl shadow-blue-500/5 max-w-xl space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
              <div className="flex-1 flex items-center gap-3 px-3 py-2">
                <Youtube className="w-5 h-5 text-red-500 shrink-0" />
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Dán liên kết YouTube (ví dụ: TED Talk, VOA, BBC...)"
                  className="w-full text-sm bg-transparent border-none text-[#1B1F2E] dark:text-[#F1F5F9] focus:outline-none placeholder-[#95A0B4]"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#1B1F2E] hover:bg-[#2E68FF] dark:bg-[#2E68FF] dark:hover:bg-[#1E52DB] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all shrink-0 group"
              >
                <span>TẠO KHÓA HỌC</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Quick Action Buttons — course-creation itself is already covered by the
                form above, so these two lead with the platform's other core surfaces
                (course library, flashcards) instead of repeating "create a course" */}
            <div className="pt-2 grid grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onExploreFlashcards}
                className="justify-center px-4 py-3.5 sm:px-6 sm:py-4 rounded-full bg-[#1B1F2E] hover:bg-[#2E68FF] dark:bg-[#2E68FF] dark:hover:bg-[#1E52DB] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xl transition-all"
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>Ôn Flashcard</span>
              </button>

              <button
                type="button"
                onClick={onExploreCourses}
                className="justify-center px-4 py-3.5 sm:px-6 sm:py-4 rounded-full bg-white dark:bg-[#1E293B] hover:bg-[#F1F4F9] dark:hover:bg-[#273449] border border-[#E4E8F0] dark:border-[#334155] text-[#1B1F2E] dark:text-[#F1F5F9] text-xs sm:text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 fill-[#2E68FF] text-[#2E68FF] shrink-0" />
                <span>Khám Phá Thư Viện</span>
              </button>
            </div>

            {/* Feature Bullets — flashcard mentioned first since it now has its own CTA above */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-[#5A6478] dark:text-[#CBD5E1] font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
                <span>Thẻ từ vựng SRS thông minh</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
                <span>Lý thuyết & Trắc nghiệm AI</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
                <span>Nghe-Chép & Nhại giọng</span>
              </div>
            </div>

          </div>

          {/* Right Hero Image Column — desktop only, hidden on mobile per design request */}
          <div className="hidden lg:flex lg:col-span-5 relative justify-center items-center">
            
            {/* Main Portrait Container */}
            <div className="relative w-full max-w-md aspect-[4/5] rounded-[2.5rem] bg-gradient-to-tr from-blue-100 via-indigo-50 to-purple-100 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950 p-4 border border-white/60 dark:border-slate-800 shadow-2xl overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80"
                alt="Young Student Learning with AI"
                className="w-full h-full object-cover rounded-[2rem] transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-[2.5rem]" />
            </div>

            {/* Floating Badge 1: Top Right */}
            <div className="absolute -top-4 right-2 sm:-right-4 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#E4E8F0] dark:border-[#334155] shadow-xl flex items-center gap-3 animate-bounce-slow">
              <div className="flex -space-x-2">
                <img className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" alt="Student" />
                <img className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" alt="Student" />
                <img className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Student" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#2E68FF]">Hơn 600,000+</p>
                <p className="text-xs font-extrabold text-[#1B1F2E] dark:text-white">Học viên chủ động</p>
              </div>
            </div>

            {/* Floating Feature Pill: Bottom Left */}
            <div className="absolute -bottom-4 -left-2 sm:-left-4 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-[#E4E8F0] dark:border-[#334155] shadow-xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#2E68FF] flex items-center justify-center font-bold text-xs">
                ⚡
              </div>
              <div>
                <p className="text-xs font-bold text-[#1B1F2E] dark:text-white">6 Chế độ học tương tác</p>
                <p className="text-[10px] text-[#5A6478] dark:text-[#CBD5E1]">Lý thuyết, Trắc nghiệm, Chính tả, Luyện nói</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
