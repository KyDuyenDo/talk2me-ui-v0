import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Bell, 
  Flame, 
  Sparkles, 
  Layers, 
  CheckCheck, 
  Trash2, 
  BookOpen, 
  CheckCircle2, 
  Bot,
  Users
} from 'lucide-react';
import { getDueFlashcardCount } from '../../infrastructure/api/talk2meApi';
import { useAuth } from '../../application';
import { PageLoadingSpinner } from '../components/common/LoadingSpinner';

interface NotificationItem {
  id: string;
  type: 'reminder' | 'system' | 'streak' | 'community';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionText?: string;
  actionPath?: string;
  icon: any;
  iconBg: string;
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dueCount, setDueCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'reminder' | 'system' | 'community'>('all');

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setIsLoading(false);
      return;
    }
    getDueFlashcardCount()
      .then((res) => {
        if (isMounted) setDueCount(res.count);
      })
      .catch(() => {
        if (isMounted) setDueCount(0);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, [user]);

  const initialNotifications: NotificationItem[] = [
    {
      id: 'notif-1',
      type: 'reminder',
      title: '🔥 Nhắc nhở ôn tập Flashcards',
      message: dueCount > 0 
        ? `Bạn có ${dueCount} thẻ ghi nhớ cần ôn tập hôm nay để duy trì trí nhớ ngắn hạn.`
        : 'Bạn đã hoàn thành xuất sắc tất cả thẻ ghi nhớ cần ôn tập cho ngày hôm nay!',
      timestamp: ' Vừa xong',
      isRead: false,
      actionText: 'Ôn tập ngay',
      actionPath: '/flashcards',
      icon: Layers,
      iconBg: 'bg-blue-500 text-white',
    },
    {
      id: 'notif-2',
      type: 'streak',
      title: '⚡ Chuỗi ngày học tập (Streak)',
      message: `Tuyệt vời! Bạn đang duy trì chuỗi ${user?.streakDays || 5} ngày học liên tiếp. Đừng để đứt quãng hôm nay nhé!`,
      timestamp: ' 2 giờ trước',
      isRead: false,
      actionText: 'Tiếp tục học',
      actionPath: '/courses',
      icon: Flame,
      iconBg: 'bg-amber-500 text-white',
    },
    {
      id: 'notif-3',
      type: 'system',
      title: '🤖 Khóa học AI đã khởi tạo hoàn tất',
      message: 'Hệ thống AI vừa hoàn tất phân tích video YouTube và trích xuất từ vựng, ngữ pháp cho khóa học của bạn.',
      timestamp: ' Hôm qua',
      isRead: true,
      actionText: 'Xem khóa học',
      actionPath: '/courses',
      icon: Bot,
      iconBg: 'bg-purple-500 text-white',
    },
    {
      id: 'notif-4',
      type: 'system',
      title: '💡 Mẹo học tiếng Anh từ Talk2Me AI',
      message: 'Luyện tập phát âm theo từng câu video nhỏ (Shadowing Method) giúp tăng tốc độ phản xạ nói lên 40%.',
      timestamp: ' 2 ngày trước',
      isRead: true,
      icon: Sparkles,
      iconBg: 'bg-emerald-500 text-white',
    },
    {
      id: 'notif-5',
      type: 'community',
      title: '👥 Thành viên mới tham gia nhóm học',
      message: 'Cộng đồng Talk2Me vừa chào đón 120 học viên mới tuần này. Hãy giao lưu và chia sẻ tiến độ học tập!',
      timestamp: ' 3 ngày trước',
      isRead: true,
      actionText: 'Khám phá cộng đồng',
      actionPath: '/community',
      icon: Users,
      iconBg: 'bg-indigo-500 text-white',
    },
  ];

  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'reminder') return n.type === 'reminder' || n.type === 'streak';
    if (activeTab === 'system') return n.type === 'system';
    if (activeTab === 'community') return n.type === 'community';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return <PageLoadingSpinner message="Đang tải danh sách thông báo..." />;
  }

  return (
    <div className="min-h-screen bg-[#F7F8FB] dark:bg-[#0F172A] text-[#1B1F2E] dark:text-[#F1F5F9] pb-24">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-md border-b border-[#E4E8F0] dark:border-[#334155] px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-slate-800 text-[#1B1F2E] dark:text-white font-extrabold text-xs flex items-center gap-2 transition-all duration-200 border border-[#E4E8F0] dark:border-[#334155] shadow-xs active:scale-95 cursor-pointer shrink-0 group"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4 text-[#2E68FF] group-hover:-translate-x-0.5 transition-transform" />
              <span>Quay lại</span>
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight">Thông báo</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#2E68FF] text-white text-xs font-black">
                  {unreadCount} mới
                </span>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 text-xs font-bold text-[#2E68FF] hover:underline"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Đánh dấu tất cả đã đọc</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'reminder', label: 'Nhắc học tập' },
            { id: 'system', label: 'Hệ thống & AI' },
            { id: 'community', label: 'Cộng đồng' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#2E68FF] text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const Icon = notif.icon;
              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 ${
                    notif.isRead
                      ? 'bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 opacity-80'
                      : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-2xl ${notif.iconBg} flex items-center justify-center shadow-xs shrink-0 mt-0.5`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm font-bold ${notif.isRead ? 'text-slate-800 dark:text-slate-200' : 'text-slate-900 dark:text-white font-extrabold'}`}>
                          {notif.title}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                          {notif.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Action Bar */}
                      <div className="pt-2 flex items-center justify-between gap-2">
                        {notif.actionText && notif.actionPath ? (
                          <button
                            onClick={() => navigate(notif.actionPath!)}
                            className="px-3 py-1.5 rounded-xl bg-[#2E68FF] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                          >
                            <span>{notif.actionText}</span>
                          </button>
                        ) : (
                          <div />
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleRead(notif.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={notif.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                          >
                            <CheckCircle2 className={`w-4 h-4 ${notif.isRead ? 'text-slate-400' : 'text-[#2E68FF]'}`} />
                          </button>

                          <button
                            onClick={() => handleDelete(notif.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">Không có thông báo nào</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Bạn đã cập nhật tất cả thông báo thuộc danh mục này.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
