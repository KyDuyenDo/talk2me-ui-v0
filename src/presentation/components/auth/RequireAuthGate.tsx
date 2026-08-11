import React from 'react';
import { LogIn, ArrowRight, Sparkles, CheckCircle2, LucideIcon } from 'lucide-react';

interface RequireAuthGateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  onOpenAuth: (mode?: 'login' | 'signup') => void;
}

/**
 * Full replacement for a route's page content when the visitor is a guest — not a
 * dismissible overlay. A closable modal on top of the real (personal, per-user) page
 * content lets a guest just dismiss it and stare at an empty/broken page underneath;
 * this instead is the only thing rendered, so there is nothing to dismiss past.
 */
export const RequireAuthGate: React.FC<RequireAuthGateProps> = ({
  icon: Icon,
  title,
  description,
  benefits,
  onOpenAuth,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md mx-auto text-center space-y-6 p-8 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-sm">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 relative">
          <Icon className="w-8 h-8" />
          <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold text-[#1B1F2E] dark:text-white">{title}</h2>
          <p className="text-xs text-[#5A6478] dark:text-[#CBD5E1] leading-relaxed">{description}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] space-y-2.5 text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Quyền lợi khi tạo tài khoản miễn phí:
          </p>
          <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => onOpenAuth('login')}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#2E68FF] hover:bg-blue-600 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng Nhập</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="font-extrabold text-[#2E68FF] hover:underline"
            >
              Đăng ký ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
