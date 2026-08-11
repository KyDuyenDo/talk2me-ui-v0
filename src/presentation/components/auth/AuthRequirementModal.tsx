import React from 'react';
import { Lock, Sparkles, LogIn, X, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AuthRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAuth: (initialMode?: 'login' | 'signup') => void;
  featureTitle?: string;
  featureDescription?: string;
  featureIcon?: React.ReactNode;
}

export const AuthRequirementModal: React.FC<AuthRequirementModalProps> = ({
  isOpen,
  onClose,
  onConfirmAuth,
  featureTitle = 'Tính năng yêu cầu đăng nhập',
  featureDescription = 'Để thực hiện thao tác này và lưu dữ liệu học tập cá nhân của bạn, vui lòng đăng nhập hoặc tạo tài khoản mới.',
  featureIcon,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-3xl shadow-2xl border border-[#E4E8F0] dark:border-[#334155] overflow-hidden p-6 space-y-6 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon Header */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 relative">
            {featureIcon || <Lock className="w-8 h-8" />}
            <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-[#1B1F2E] dark:text-white">
              {featureTitle}
            </h3>
            <p className="text-xs text-[#5A6478] dark:text-[#CBD5E1] leading-relaxed">
              {featureDescription}
            </p>
          </div>
        </div>

        {/* Value Bullet Points */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Quyền lợi khi tạo tài khoản miễn phí:
          </p>
          <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Tạo không giới hạn khóa học AI từ YouTube</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Đồng bộ thẻ ghi nhớ & Tiến độ học tập 6 kỹ năng</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Lưu lịch sử bài chấm nói/viết AI chi tiết</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => onConfirmAuth('login')}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#2E68FF] hover:bg-blue-600 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng Nhập</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
            Chưa có tài khoản?{' '}
            <button
              onClick={() => onConfirmAuth('signup')}
              className="font-extrabold text-[#2E68FF] hover:underline"
            >
              Đăng ký ngay
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full text-center py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
          >
            Để sau
          </button>
        </div>

      </div>
    </div>
  );
};
