import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../../core/entities';
import {
  X,
  GraduationCap,
  Flame,
  BarChart3,
  Sparkles,
  HardDrive,
  LogOut,
  LogIn,
  Sun,
  Moon,
  PlusCircle,
  ChevronRight,
  Heart,
  Bell
} from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
  streakCount: number;
  dueCount?: number;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenCreateModal: () => void;
  onLogout?: () => void;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
  setCurrentTab: (tab: string) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  user,
  streakCount,
  dueCount = 0,
  darkMode,
  setDarkMode,
  onOpenCreateModal,
  onLogout,
  onOpenAuth,
  setCurrentTab,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleAction = (tabId: string, path: string) => {
    setCurrentTab(tabId);
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] xl:hidden flex items-end">
      {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Bottom Sheet Drawer Panel */}
      <div className="relative w-full bg-white dark:bg-[#1E293B] rounded-t-3xl shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden border-t border-[#E4E8F0] dark:border-[#334155] animate-in slide-in-from-bottom duration-250">
        
        {/* Drag Handle Bar Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mx-auto my-2.5 shrink-0" />

        {/* Top Header */}
        <div className="px-5 pb-3 pt-1 border-b border-[#E4E8F0] dark:border-[#334155] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#2E68FF] to-[#7C5CFC] flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base text-[#1B1F2E] dark:text-white">
              Tài khoản & Thiết lập
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          
          {/* USER PROFILE SECTION */}
          {user ? (
            <div className="space-y-4">
              {/* User Profile Identity Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-slate-800/90 dark:to-slate-800/50 border border-blue-100 dark:border-slate-700 flex items-center gap-3.5 shadow-xs">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md overflow-hidden shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-base text-[#1B1F2E] dark:text-white truncate">{user.name}</h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500 text-white uppercase shrink-0">
                      {user.role || 'Pro'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                </div>
              </div>

              {/* STREAK INFORMATION CARD */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-orange-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Flame className="w-5 h-5 fill-white animate-bounce" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Chuỗi học tập</p>
                      <h5 className="text-base font-black text-amber-700 dark:text-amber-300">
                        {user.streakDays || streakCount} Day Streak 🔥
                      </h5>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-xs">
                    Tích cực
                  </span>
                </div>
              </div>

              {/* QUICK ACCOUNT ACTIONS */}
              <div className="space-y-1.5 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border-t border-[#E4E8F0] dark:border-[#334155]">
                <button
                  type="button"
                  onClick={() => handleAction('notifications', '/notifications')}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center relative">
                      <Bell className="w-4 h-4" />
                      {dueCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#2E68FF] ring-2 ring-white dark:ring-[#1E293B]" />
                      )}
                    </div>
                    <span className="font-bold text-sm">Thông báo</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAction('progress', '/progress')}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">Báo cáo tiến độ cá nhân</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAction('settings', '/settings')}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">Cài đặt & Tài nguyên AI</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500 text-white">BYOK</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors mt-2"
                >
                  <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm">Đăng xuất</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2E68FF] text-white flex items-center justify-center mx-auto shadow-md">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Chào mừng đến với Talk2Me</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đăng nhập để lưu tiến độ học tập và khởi tạo khóa học AI cá nhân.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAuth) onOpenAuth('login');
                }}
                className="w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-[#2E68FF] hover:bg-blue-600 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập / Đăng ký</span>
              </button>
            </div>
          )}

        </div>

        {/* BOTTOM SHEET FOOTER & ACTIONS */}
        <div className="p-5 border-t border-[#E4E8F0] dark:border-[#334155] space-y-3 bg-slate-50/80 dark:bg-slate-800/40 shrink-0">
          
          {/* Create AI Course Action */}
          <button
            onClick={() => {
              onClose();
              onOpenCreateModal();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#2E68FF] hover:bg-[#1E52DB] text-white text-xs font-bold shadow-md transition-all active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo khóa học AI</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E4E8F0] dark:border-[#334155] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span>Giao diện {darkMode ? 'Tối' : 'Sáng'}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">{darkMode ? 'Đang bật' : 'Đang tắt'}</span>
          </button>

          {/* Brand Info */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
            <span>© 2026 Talk2Me LearnTube</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
