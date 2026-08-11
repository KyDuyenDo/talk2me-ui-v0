import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UserProfile } from '../../core/entities';
import { getDueFlashcardCount } from '../../infrastructure/api/talk2meApi';
import { MobileDrawer } from './MobileDrawer';
import { 
  Sparkles, 
  BookOpen, 
  Layers, 
  BarChart3, 
  Users, 
  Home, 
  Moon, 
  Sun, 
  Bell, 
  Flame, 
  PlusCircle, 
  GraduationCap, 
  LogOut, 
  ChevronRight, 
  LogIn,
  HardDrive,
  Menu
} from 'lucide-react';

interface HeaderTopNavProps {
  setCurrentTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenCreateModal: (prefillUrl?: string) => void;
  streakCount: number;
  user?: UserProfile | null;
  onLogout?: () => void;
  onOpenAuth?: (initialMode?: 'login' | 'signup') => void;
}

export const HeaderTopNav: React.FC<HeaderTopNavProps> = ({
  setCurrentTab,
  darkMode,
  setDarkMode,
  onOpenCreateModal,
  streakCount,
  user,
  onLogout,
  onOpenAuth,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      setDueCount(0);
      return;
    }
    getDueFlashcardCount()
      .then((res) => setDueCount(res.count))
      .catch(() => setDueCount(0));
  }, [user]);

  const navItems = [
    { id: 'home', label: 'Home', path: '/', icon: Home },
    { id: 'courses', label: 'Courses', path: '/courses', icon: BookOpen },
    { id: 'flashcards', label: 'Flashcards', path: '/flashcards', icon: Layers },
    { id: 'progress', label: 'Progress', path: '/progress', icon: BarChart3 },
    { id: 'community', label: 'Community', path: '/community', icon: Users },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-md border-b border-[#E4E8F0] dark:border-[#334155] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            
            {/* Left section: Logo Brand */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Logo Brand */}
              <Link 
                to="/"
                onClick={() => setCurrentTab('home')}
                className="flex items-center gap-2.5 cursor-pointer group shrink-0"
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#2E68FF] to-[#7C5CFC] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#1B1F2E] dark:text-[#F1F5F9] font-display">
                      Talk2Me
                    </span>
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-[#EAF1FF] dark:bg-[#1A2540] text-[#2E68FF] dark:text-[#5B8CFF] font-semibold border border-blue-200/50 dark:border-blue-800/40">
                      LearnTube
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5A6478] dark:text-[#CBD5E1] hidden md:block">
                    AI Video & Skill Platform
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Top Navigation Bar Tabs */}
            <nav className="hidden xl:flex items-center gap-1 bg-[#F1F4F9] dark:bg-[#273449] p-1.5 rounded-full border border-[#E4E8F0] dark:border-[#334155] shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                // Derive active state purely from the URL — path is always in sync (even
                // right after F5, when `currentTab` state has reset to its default and
                // would otherwise make "Home" look active on every other page).
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
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#2E68FF] text-white shadow-sm'
                        : 'text-[#5A6478] dark:text-[#CBD5E1] hover:text-[#1B1F2E] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Action Tools — full toolbar on desktop (xl+); on mobile/tablet
                everything (Create, theme, notifications, account) lives behind a single
                menu button that opens MobileDrawer, since there isn't room to show every
                icon individually on a narrow header. */}
            <div className="flex items-center gap-2 sm:gap-3">

              <div className="hidden xl:flex items-center gap-2 sm:gap-3">
              {/* Create Course Button */}
              <button
                onClick={() => onOpenCreateModal()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#2E68FF] hover:bg-[#1E52DB] text-white text-xs font-bold shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tạo khóa học</span>
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 rounded-full text-[#5A6478] dark:text-[#CBD5E1] hover:bg-[#F1F4F9] dark:hover:bg-[#273449] border border-[#E4E8F0] dark:border-[#334155] transition-colors"
                title="Toggle theme"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              {/* Dedicated Notifications Bell Button (Navigates to /notifications Screen) —
                  only meaningful for logged-in users; dueCount is always 0 for guests. */}
              <button
                onClick={() => {
                  setCurrentTab('notifications');
                  navigate('/notifications');
                }}
                className="p-2.5 rounded-full text-[#5A6478] dark:text-[#CBD5E1] hover:bg-[#F1F4F9] dark:hover:bg-[#273449] border border-[#E4E8F0] dark:border-[#334155] transition-colors relative"
                title="Thông báo"
              >
                <Bell className="w-4 h-4" />
                {dueCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#2E68FF] ring-2 ring-white dark:ring-[#1E293B]" />
                )}
              </button>

              {/* User Profile Avatar (Desktop Dropdown Popup) */}
              <div className="relative pl-1 sm:pl-2 border-l border-[#E4E8F0] dark:border-[#334155] flex items-center gap-2">
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-[#2E68FF]/50 transition-all focus:outline-none"
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </button>

                    {/* Desktop User Menu Popup */}
                    {showUserMenu && (
                      <div className="hidden xl:block absolute right-0 top-full mt-3 w-80 bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-[#E4E8F0] dark:border-[#334155] p-5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
                        {/* User Profile Header */}
                        <div className="flex items-center gap-3 pb-3 border-b border-[#E4E8F0] dark:border-[#334155]">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-extrabold text-base flex items-center justify-center shadow-md overflow-hidden">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              user.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-extrabold text-sm text-[#1B1F2E] dark:text-white truncate">{user.name}</h4>
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white uppercase">
                                {user.role || 'Pro'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                          </div>
                        </div>

                        {/* STREAK INFORMATION CARD */}
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                                <Flame className="w-5 h-5 fill-white animate-bounce" />
                              </div>
                              <div>
                                <p className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Chuỗi học tập</p>
                                <h5 className="text-base font-black text-amber-700 dark:text-amber-300">
                                  {user.streakDays || streakCount} Day Streak 🔥
                                </h5>
                              </div>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-xs">
                              Tích cực
                            </span>
                          </div>

                          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                            Bạn đã hoàn thành mục tiêu học tập <strong>{user.streakDays || streakCount} ngày liên tiếp</strong>. Giữ vững phong độ nhé!
                          </p>
                        </div>

                        {/* Quick User Links */}
                        <div className="space-y-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentTab('progress');
                              setShowUserMenu(false);
                              navigate('/progress');
                            }}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <BarChart3 className="w-4 h-4 text-blue-500" />
                              <span>Báo cáo tiến độ cá nhân</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCurrentTab('settings');
                              setShowUserMenu(false);
                              navigate('/settings');
                            }}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-200 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-[#2E68FF] flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-bold">Cài đặt & Tài nguyên AI</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500 text-white">BYOK</span>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </button>

                          <div className="pt-2 border-t border-[#E4E8F0] dark:border-[#334155]">
                            <button
                              type="button"
                              onClick={() => {
                                setShowUserMenu(false);
                                if (onLogout) onLogout();
                              }}
                              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Đăng xuất</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth('login');
                      else setCurrentTab('auth');
                    }}
                    className="shrink-0 px-3 sm:px-4 py-2 rounded-full text-xs font-extrabold text-white bg-[#2E68FF] hover:bg-blue-600 shadow-sm transition-all flex items-center gap-1.5 sm:gap-2 active:scale-95"
                  >
                    <LogIn className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Đăng nhập</span>
                  </button>
                )}
              </div>
              </div>

              {/* Mobile/Tablet: a single icon on the right. Guests have nothing to put in
                  a menu yet (drawer would just be the same login prompt), so they get a
                  direct login icon; once logged in there are enough features (profile,
                  notifications, progress, settings, logout, create, theme) to warrant the
                  MobileDrawer menu instead. */}
              {user ? (
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="xl:hidden p-2.5 rounded-full text-[#5A6478] dark:text-[#CBD5E1] hover:bg-[#F1F4F9] dark:hover:bg-[#273449] border border-[#E4E8F0] dark:border-[#334155] transition-colors relative"
                  title="Menu"
                >
                  <Menu className="w-5 h-5" />
                  {dueCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#2E68FF] ring-2 ring-white dark:ring-[#1E293B]" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAuth) onOpenAuth('login');
                    else setCurrentTab('auth');
                  }}
                  className="xl:hidden p-2.5 rounded-full bg-[#2E68FF] hover:bg-blue-600 text-white transition-all active:scale-95"
                  title="Đăng nhập"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Panel */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        streakCount={streakCount}
        dueCount={dueCount}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenCreateModal={onOpenCreateModal}
        onLogout={onLogout}
        onOpenAuth={onOpenAuth}
        setCurrentTab={setCurrentTab}
      />
    </>
  );
};
