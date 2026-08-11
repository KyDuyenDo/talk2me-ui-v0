import React from 'react';
import { Cpu, DownloadCloud, Lock, X } from 'lucide-react';

interface ModelDownloadPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToSettings: () => void;
  /** All below default to the original Wav2Vec2/Shadowing copy so existing call sites don't
   * need to change — pass these to reuse this same modal for a different model (e.g. Kokoro TTS). */
  title?: string;
  subtitle?: string;
  description?: React.ReactNode;
}

export const ModelDownloadPromptModal: React.FC<ModelDownloadPromptModalProps> = ({
  isOpen,
  onClose,
  onGoToSettings,
  title = 'Cần Tải Model AI Phát Âm (~90MB)',
  subtitle = 'Phục vụ chấm điểm Shadowing tức thì',
  description = (
    <>
      <p>
        Bài tập <strong>Shadowing (Luyện nhại giọng)</strong> sử dụng mô hình học máy <strong>Wav2Vec2 INT8</strong> để chấm điểm âm tiết trực tiếp trên trình duyệt của bạn.
      </p>
      <p className="text-slate-500 dark:text-slate-400">
        Hiện tại gói tài nguyên này chưa được tải về máy. Bạn có muốn di chuyển đến trang <strong>Quản Lý Tài Nguyên</strong> để tải về không?
      </p>
    </>
  ),
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-[#2E68FF] flex items-center justify-center font-bold shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#1B1F2E] dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
          {description}
        </div>

        {/* Privacy badge */}
        <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold px-1">
          <Lock className="w-3.5 h-3.5" />
          <span>Cam kết: Model chạy 100% Offline, âm thanh không gửi đi đâu.</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToSettings();
            }}
            className="flex-1 py-2.5 rounded-xl bg-[#2E68FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Đến Trang Tải Model</span>
          </button>
        </div>

      </div>
    </div>
  );
};
