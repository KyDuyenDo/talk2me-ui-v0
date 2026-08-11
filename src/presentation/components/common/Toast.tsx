import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onDismiss, durationMs = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-[#1B1F2E] dark:bg-[#2E68FF] text-white font-semibold text-xs shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-sm">
      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
      <span>{message}</span>
    </div>
  );
};
