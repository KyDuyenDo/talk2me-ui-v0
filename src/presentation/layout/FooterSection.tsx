import React from 'react';
import { GraduationCap, Heart } from 'lucide-react';

export const FooterSection: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-[#1E293B] border-t border-[#E4E8F0] dark:border-[#334155] py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Simple Footer Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#5A6478] dark:text-[#CBD5E1]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2E68FF] text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base text-[#1B1F2E] dark:text-white font-display">
              Talk2Me LearnTube
            </span>
          </div>

          <p className="text-xs text-[#5A6478] dark:text-[#CBD5E1]">
            AI-Powered Video Learning Engine & Interactive Practice Platform
          </p>

          <div className="flex items-center gap-4 text-xs text-[#95A0B4]">
            <p>© 2026 Talk2Me LearnTube</p>
            <div className="flex items-center gap-1">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
