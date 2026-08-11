import React from 'react';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '../../application';
import { RequireAuthGate } from '../components/auth';
import { ProgressAnalytics } from '../components/analytics';

interface AnalyticsPageProps {
  onOpenAuth: (mode?: 'login' | 'signup') => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <RequireAuthGate
        icon={BarChart3}
        title="Đăng nhập để xem Tiến độ học tập"
        description="Báo cáo tiến độ, chuỗi ngày học và độ chính xác bài tập là dữ liệu cá nhân, cần đăng nhập để xem và lưu."
        benefits={[
          'Theo dõi thời gian học & độ chính xác quiz',
          'Giữ chuỗi ngày học liên tiếp (streak)',
          'Đồng bộ tiến độ trên mọi thiết bị',
        ]}
        onOpenAuth={onOpenAuth}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-3xl font-extrabold text-[#1B1F2E] dark:text-white">
          Learning Analytics & Progress
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6478] dark:text-[#CBD5E1] mt-1">
          Track study time, quiz accuracy, and lesson completion streak
        </p>
      </div>

      <ProgressAnalytics />
    </div>
  );
};
