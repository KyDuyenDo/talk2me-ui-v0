import React, { useState } from 'react';
import { UserProfile } from '../../core/entities';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Volume2,
  Award,
  Check
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onLoginSuccess: (user: UserProfile) => void;
  onCancel?: () => void;
  onBack?: () => void;
  redirectReason?: string;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onLoginSuccess,
  onCancel,
  onBack,
  redirectReason,
}) => {
  const handleGoBack = () => {
    if (onBack) onBack();
    else if (onCancel) onCancel();
  };

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [targetGoal, setTargetGoal] = useState('IELTS 6.5+');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ Email và Mật khẩu.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Vui lòng điền Họ và tên của bạn.');
      return;
    }

    const mockUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: mode === 'signup' ? name.trim() : email.split('@')[0] || 'Học Viên Talk2Me',
      email: email.trim(),
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      targetGoal: targetGoal,
      currentLevel: 'Intermediate (B1-B2)',
      streakDays: 5,
      totalStudyMinutes: 120,
      completedLessonsCount: 3,
      joinedDate: new Date().toISOString().split('T')[0],
      subscriptionTier: 'Pro Premium',
    };

    onLoginSuccess(mockUser);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-[#E4E8F0] dark:border-[#334155] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* Left Marketing Banner Column (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#1E1B4B] via-[#0F172A] to-[#1E293B] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#2E68FF] text-white flex items-center justify-center font-black text-lg shadow-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white font-display">
                Talk2Me <span className="text-[#5B8CFF]">LearnTube</span>
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {mode === 'login' ? 'Chào Mừng Bạn Quay Trở Lại! 👋' : 'Bắt Đầu Hành Trình Luyện Nói Tiếng Anh AI 🚀'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Biến mọi video YouTube thành khóa học tương tác 6 chế độ thông minh.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              {[
                { icon: Sparkles, color: 'text-amber-400', title: 'Tạo Khóa Học AI Siêu Tốc', desc: 'Bóc tách Lý thuyết, Quiz & Dictation từ YouTube link' },
                { icon: BookOpen, color: 'text-[#5B8CFF]', title: 'Thuật Toán Flashcard SRS', desc: 'Ghi nhớ từ vựng ngắt quãng không lo bị quên' },
                { icon: Volume2, color: 'text-pink-400', title: 'Phòng Call & Luyện Nói 1-1', desc: 'Ghép cặp nói tiếng Anh ngẫu nhiên với bạn học' },
                { icon: Award, color: 'text-emerald-400', title: 'Đồng Bộ Tiến Độ & Chuỗi Streak', desc: 'Tích điểm thưởng và giữ vững động lực học tập daily' }
              ].map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <feat.icon className={`w-5 h-5 ${feat.color} shrink-0 mt-0.5`} />
                  <div>
                    <h4 className="font-extrabold text-xs text-white">{feat.title}</h4>
                    <p className="text-[11px] text-slate-300">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-700/60 relative z-10 flex items-center justify-between text-xs text-slate-400">
            <span>© 2026 Talk2Me AI Ecosystem</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AI System Active
            </span>
          </div>
        </div>

        {/* Right Form Column (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white dark:bg-[#1E293B]">
          
          {/* Top Bar with Navigation Back */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-slate-800 text-[#1B1F2E] dark:text-white font-extrabold text-xs flex items-center gap-2 transition-all duration-200 border border-[#E4E8F0] dark:border-[#334155] shadow-xs active:scale-95 cursor-pointer shrink-0 group"
              title="Quay lại Trang Chủ"
            >
              <ArrowLeft className="w-4 h-4 text-[#2E68FF] group-hover:-translate-x-0.5 transition-transform" />
              <span>Quay Lại Trang Chủ</span>
            </button>

            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  mode === 'login'
                    ? 'bg-white dark:bg-[#1E293B] text-[#2E68FF] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-[#1E293B] text-[#2E68FF] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Đăng Ký
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="py-6 space-y-6">
            
            {/* Context Notice Banner */}
            {redirectReason && (
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs text-[#2E68FF] dark:text-blue-300 font-medium flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#2E68FF]" />
                <div>
                  <strong className="font-extrabold block">Yêu cầu đăng nhập:</strong>
                  <span>{redirectReason}</span>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xl font-black text-[#1B1F2E] dark:text-white">
                {mode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Tạo Tài Khoản Học Viên Mới'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {mode === 'login' 
                  ? 'Nhập email và mật khẩu của bạn để truy cập hệ thống học tập.' 
                  : 'Tham gia cộng đồng học viên Tiếng Anh tương tác cùng Trợ lý AI.'}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Main Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Họ và Tên của bạn
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="VD: Kỳ Duyên"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1F2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E68FF]"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1F2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E68FF]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mật khẩu
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => alert('Vui lòng liên hệ Admin để khôi phục mật khẩu tài khoản thử nghiệm.')}
                      className="text-[11px] font-bold text-[#2E68FF] hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1F2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E68FF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mục tiêu học tập chính
                  </label>
                  <select
                    value={targetGoal}
                    onChange={(e) => setTargetGoal(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1F2E] dark:text-white"
                  >
                    <option value="IELTS 6.5+">🎯 IELTS Band 6.5+ / 7.5+</option>
                    <option value="Giao tiếp Pro">💬 Giao tiếp Tiếng Anh Tự Tin & Trôi Chảy</option>
                    <option value="English for Tech">💻 Tiếng Anh Chuyên Ngành Web Dev / IT</option>
                    <option value="TOEIC 800+">📝 TOEIC 800+ Listening & Reading</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#2E68FF] hover:bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-transform active:scale-98 mt-2"
              >
                <span>{mode === 'login' ? 'Đăng Nhập Ngay' : 'Hoàn Tất Đăng Ký Tài Khoản'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>

            {/* Quick Demo Sign-in Helper */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <span className="text-[11px] text-slate-500 font-medium">Hoặc đăng nhập nhanh bằng tài khoản Demo:</span>
              <button
                type="button"
                onClick={() => {
                  const demoUser: UserProfile = {
                    id: 'usr_demo',
                    name: 'Kỳ Duyên (Demo Account)',
                    email: 'kyduyen@talk2me.ai',
                    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                    targetGoal: 'IELTS 7.5+',
                    currentLevel: 'Intermediate B2',
                    streakDays: 18,
                    totalStudyMinutes: 450,
                    completedLessonsCount: 12,
                    joinedDate: '2026-01-15',
                    subscriptionTier: 'Pro Premium Member'
                  };
                  onLoginSuccess(demoUser);
                }}
                className="w-full py-2 rounded-xl bg-white dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-slate-800 text-[#2E68FF] font-extrabold text-xs border border-blue-200 dark:border-blue-900 transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>⚡ Đăng Nhập Tài Khoản Demo (Kỳ Duyên)</span>
              </button>
            </div>

          </div>

          {/* Footer Terms */}
          <p className="text-[11px] text-center text-slate-400">
            Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng & Chính sách bảo mật của Talk2Me.
          </p>

        </div>

      </div>
    </div>
  );
};
