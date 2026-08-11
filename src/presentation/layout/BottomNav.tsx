import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Layers, 
  BarChart3, 
  Users 
} from 'lucide-react';

interface BottomNavProps {
  setCurrentTab: (tab: string) => void;
  dueCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  setCurrentTab,
  dueCount = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', path: '/', icon: Home },
    { id: 'courses', label: 'Courses', path: '/courses', icon: BookOpen },
    { id: 'flashcards', label: 'Flashcards', path: '/flashcards', icon: Layers, badge: dueCount },
    { id: 'progress', label: 'Progress', path: '/progress', icon: BarChart3 },
    { id: 'community', label: 'Community', path: '/community', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 xl:hidden bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-lg border-t border-[#E4E8F0] dark:border-[#334155] px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Derive active state purely from the URL — see HeaderTopNav.tsx for why
          // relying on the `currentTab` state instead breaks after a page refresh.
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                navigate(item.path);
              }}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer relative ${
                isActive
                  ? 'text-[#2E68FF] dark:text-[#5B8CFF] font-bold scale-105'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1B1F2E] dark:hover:text-white font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#2E68FF] text-white text-[10px] font-black flex items-center justify-center shadow-xs border border-white dark:border-[#1E293B]">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] tracking-tight">{item.label}</span>
              
              {/* Active Indicator Dot */}
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#2E68FF] dark:bg-[#5B8CFF] absolute -bottom-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
