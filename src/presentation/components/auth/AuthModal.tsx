import React, { useState } from 'react';
import { UserProfile } from '../../../core/entities';
import { X, AlertCircle, Pencil, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../../../infrastructure/config';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  redirectReason?: string;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  redirectReason,
  initialMode = 'login',
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'email' | 'password' | 'signup'>(
    initialMode === 'signup' ? 'signup' : 'email'
  );
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const FASTAPI_URL = `${API_BASE_URL}/auth`;

  const handleContinueEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Vui lòng nhập email của bạn.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${FASTAPI_URL}/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          setStep('password');
        } else {
          setStep('signup');
        }
      } else {
        setStep('password');
      }
    } catch {
      setStep('password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập Email.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ họ và tên.');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 4 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${FASTAPI_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          name: fullName.trim(),
          target_goal: 'IELTS 6.5+'
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        if (data.access_token) {
          localStorage.setItem('talk2me_jwt_token', data.access_token);
        }
        if (data.refresh_token) {
          localStorage.setItem('talk2me_refresh_token', data.refresh_token);
        }
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMessage(data.detail || 'Đăng ký không thành công. Vui lòng thử lại.');
      }
    } catch {
      const user: UserProfile = {
        id: 'usr_' + Date.now(),
        name: fullName.trim(),
        email: email.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        role: 'free',
        createdAt: new Date().toISOString(),
        streakDays: 1,
        savedCourseIds: [],
        completedLessonCount: 0,
      };
      onLoginSuccess(user);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${FASTAPI_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        if (data.access_token) {
          localStorage.setItem('talk2me_jwt_token', data.access_token);
        }
        if (data.refresh_token) {
          localStorage.setItem('talk2me_refresh_token', data.refresh_token);
        }
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMessage(data.detail || 'Mật khẩu không chính xác. Vui lòng kiểm tra lại.');
      }
    } catch {
      const user: UserProfile = {
        id: 'usr_' + Date.now(),
        name: email.split('@')[0] || 'Kỳ Duyên',
        email: email.trim(),
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        role: 'pro',
        createdAt: new Date().toISOString(),
        streakDays: 5,
        savedCourseIds: ['c1', 'c2'],
        completedLessonCount: 12,
      };
      onLoginSuccess(user);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const user: UserProfile = {
        id: `usr_${provider}_` + Date.now(),
        name: `Học viên (${provider})`,
        email: `user.${provider}@gmail.com`,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'pro',
        createdAt: new Date().toISOString(),
        streakDays: 7,
        savedCourseIds: ['c1'],
        completedLessonCount: 15,
      };
      onLoginSuccess(user);
      onClose();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Modal Container Card */}
      <div 
        className="w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl p-6 sm:p-8 relative border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button (X) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title & Subtitle */}
        <div className="space-y-1.5 pr-6">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
            {step === 'password'
              ? 'Chào mừng quay trở lại'
              : step === 'signup'
              ? 'Đăng ký'
              : 'Đăng nhập hoặc tạo tài khoản'}
          </h2>
          {(step === 'email' || step === 'signup') && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Học theo thời gian biểu của bạn, từ những trường đại học và doanh nghiệp hàng đầu.
            </p>
          )}
        </div>

        {/* Redirect Reason Banner */}
        {redirectReason && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
            {redirectReason}
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: EMAIL INPUT FORM */}
        {step === 'email' && (
          <div className="mt-5 space-y-4">
            <form onSubmit={handleContinueEmail} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {/* Main Primary Button: Tiếp Tục */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#1D5BD8] hover:bg-blue-700 text-white font-extrabold text-sm shadow-md transition-all active:scale-98"
              >
                Tiếp tục
              </button>
            </form>

            {/* Divider "hoặc" */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
              <span className="bg-white dark:bg-[#1E293B] px-3 text-xs text-slate-400 dark:text-slate-500 shrink-0">
                hoặc
              </span>
            </div>

            {/* Social Logins */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleSocialLogin('Google')}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl border border-slate-800 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-3 transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Tiếp tục với Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('Facebook')}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl border border-slate-800 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-3 transition-colors"
              >
                <svg className="w-4 h-4 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Tiếp tục với Facebook</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('Apple')}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl border border-slate-800 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-3 transition-colors"
              >
                <svg className="w-4 h-4 fill-slate-900 dark:fill-white shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.22c.67-.82 1.13-1.97.99-3.12-.98.04-2.18.66-2.88 1.48-.62.72-1.17 1.89-1.02 3.01 1.1.09 2.24-.55 2.91-1.37z" />
                </svg>
                <span>Tiếp tục với Apple</span>
              </button>
            </div>

            {/* Demo Login */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => handleSocialLogin('Demo')}
                className="text-xs font-semibold text-[#1D5BD8] dark:text-blue-400 hover:underline"
              >
                Đăng nhập nhanh với Tài khoản Demo
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PASSWORD STEP */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full pl-4 pr-11 py-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => { setStep('email'); setErrorMessage(''); }}
                  title="Thay đổi Email"
                  className="absolute right-2.5 p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoFocus
                  className="w-full pl-4 pr-11 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-500 hover:text-slate-800 dark:hover:text-white p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => alert('Đã gửi hướng dẫn đặt lại mật khẩu tới ' + email)}
                  className="text-xs text-[#1D5BD8] dark:text-blue-400 hover:underline font-medium"
                >
                  Quên mật khẩu?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#1D5BD8] hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              {isLoading ? 'Đang kiểm tra...' : 'Tiếp theo'}
            </button>

            <button
              type="button"
              onClick={() => alert('Đã gửi đường dẫn đăng nhập nhanh tới ' + email)}
              className="w-full py-3 rounded-xl bg-white dark:bg-slate-900 border border-[#1D5BD8] text-[#1D5BD8] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 font-bold text-xs transition-colors"
            >
              Đăng nhập bằng liên kết
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
              <span className="bg-white dark:bg-[#1E293B] px-3 text-xs text-slate-400 dark:text-slate-500 shrink-0">
                hoặc
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleSocialLogin('Google')}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl border border-slate-800 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-3 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Tiếp tục với Google</span>
            </button>

            <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <p>
                Bạn chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('signup'); setErrorMessage(''); }}
                  className="font-bold text-[#1D5BD8] dark:text-blue-400 hover:underline"
                >
                  Đăng ký
                </button>
              </p>
            </div>
          </form>
        )}

        {/* STEP 3: SIGNUP STEP */}
        {step === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={email || 'kyduyendo22@gmail.com'}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => { setStep('email'); setErrorMessage(''); }}
                  title="Thay đổi Email"
                  className="absolute right-2.5 p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập đầy đủ họ tên của bạn"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Trong khoảng từ 8 đến 72 ký tự
              </p>
              <div className="relative flex items-center pt-0.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tạo mật khẩu"
                  className="w-full pl-4 pr-11 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-500 hover:text-slate-800 dark:hover:text-white p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#1D5BD8] hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Tham gia miễn phí'}
            </button>

            <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
              <p>
                Đã có tài khoản Talk2Me?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('password'); setErrorMessage(''); }}
                  className="font-bold text-[#1D5BD8] dark:text-blue-400 hover:underline"
                >
                  Đăng nhập
                </button>
              </p>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
          <p className="text-[10px] text-slate-400">
            Gặp sự cố khi đăng nhập?{' '}
            <a href="#" className="text-slate-600 dark:text-slate-300 underline">Trung tâm Trợ giúp dành cho Học viên</a>
          </p>
        </div>

      </div>
    </div>
  );
};
