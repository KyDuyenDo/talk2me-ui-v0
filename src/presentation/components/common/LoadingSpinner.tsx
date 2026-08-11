import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  color = 'text-[#2E68FF]',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div className={`inline-block relative ${sizeClasses[size]} ${className}`}>
      <div
        className={`w-full h-full rounded-full border-current opacity-20 ${color}`}
      />
      <div
        className={`absolute top-0 left-0 w-full h-full rounded-full border-t-transparent border-l-transparent animate-spin ${color}`}
        style={{ borderTopColor: 'currentColor' }}
      />
    </div>
  );
};

interface PageLoadingSpinnerProps {
  message?: string;
  minHeight?: string;
}

export const PageLoadingSpinner: React.FC<PageLoadingSpinnerProps> = ({
  message = 'Đang tải dữ liệu...',
  minHeight = 'min-h-[65vh]',
}) => {
  return (
    <div
      className={`w-full ${minHeight} flex flex-col items-center justify-center p-8 animate-in fade-in duration-300`}
    >
      <div className="relative flex items-center justify-center mb-4">
        {/* Outer glowing pulse ring */}
        <div className="absolute w-16 h-16 rounded-full bg-[#2E68FF]/10 dark:bg-[#2E68FF]/20 animate-ping" />
        
        {/* Main circular loading spinner */}
        <div className="w-14 h-14 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-[#2E68FF] dark:border-t-[#5B8CFF] animate-spin shadow-lg" />
      </div>

      <p className="text-xs sm:text-sm font-extrabold text-slate-600 dark:text-slate-300 tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );
};
