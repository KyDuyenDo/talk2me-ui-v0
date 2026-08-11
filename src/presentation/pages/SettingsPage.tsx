import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Key,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Zap,
  Layers,
  BookOpen,
  FileText,
  HelpCircle,
  Bot,
  Send,
  Sliders,
  Check,
  Info,
  HardDrive,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../application';
import { RequireAuthGate } from '../components/auth';
import { ResourceManagerSection } from '../components/settings/ResourceManagerSection';
import {
  GeminiModel,
  GeminiConfig,
  getStoredConfig,
  saveStoredConfig,
  testGeminiKey,
  generateCompletion,
  fetchLiveModels,
  resolveModelSlots,
  pickModelId
} from '../../infrastructure/api/gemini';

interface SettingsPageProps {
  onBack?: () => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack, onOpenAuth }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<GeminiConfig>(getStoredConfig);
  const [apiKeyInput, setApiKeyInput] = useState<string>(config.apiKey);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    details?: string;
  } | null>(null);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // AI Playground test
  const [testPrompt, setTestPrompt] = useState<string>(
    'Hãy cho tôi 3 lý do vì sao phương pháp Lặp lại ngắt quãng (SRS) giúp ghi nhớ từ vựng tiếng Anh tốt nhất.'
  );
  const [testSelectedModel, setTestSelectedModel] = useState<string>('');
  const [testResponse, setTestResponse] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [playgroundError, setPlaygroundError] = useState<string>('');

  // Fetch live models dynamically through the backend's Gemini catalog proxy
  const [liveModels, setLiveModels] = useState<GeminiModel[]>([]);
  const availableModels = liveModels;

  useEffect(() => {
    fetchLiveModels(config.useCustomKey ? config.apiKey : undefined)
      .then((models) => {
        setLiveModels(models);

        // Self-heal: any slot that's empty (never set) or points at a model that's since
        // been retired gets replaced with something that's actually live right now — no
        // hardcoded id is ever trusted blindly.
        const healedModels = resolveModelSlots(config.models, models);
        if (JSON.stringify(healedModels) !== JSON.stringify(config.models)) {
          const healedConfig = { ...config, models: healedModels };
          setConfig(healedConfig);
          saveStoredConfig(healedConfig);
        }

        setTestSelectedModel((prev) => prev || pickModelId(models));
      })
      .catch((err) => console.warn('Không lấy được danh sách model live từ Gemini API:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeTab, setActiveTab] = useState<'api' | 'resources'>('api');
  const location = useLocation();
  const autoDownload = (location.state as { autoDownload?: 'pronunciation' | 'tts' } | null)?.autoDownload;

  useEffect(() => {
    // Check initial URL hash (or an autoDownload navigation state — see useAiResourceGate.tsx)
    if (window.location.hash === '#resources' || window.location.hash === '#resource-manager' || autoDownload) {
      setActiveTab('resources');
    }

    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#resources' || hash === '#resource-manager') {
        setActiveTab('resources');
      } else if (hash === '#api') {
        setActiveTab('api');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleMode = (useCustom: boolean) => {
    const updated = { ...config, useCustomKey: useCustom };
    setConfig(updated);
    saveStoredConfig(updated);
    showSaveNotification();
  };

  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({
        success: false,
        message: 'Vui lòng nhập API Key trước khi kiểm tra.',
      });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    const result = await testGeminiKey(apiKeyInput.trim());
    setIsTestingKey(false);

    if (result.success) {
      const detailsMsg = result.data?.modelCount
        ? `Tìm thấy ${result.data.modelCount} model khả dụng với Key này.`
        : undefined;
      setTestResult({
        success: true,
        message: result.message,
        details: detailsMsg,
      });

      // Automatically save and activate custom key mode if valid
      const updatedConfig: GeminiConfig = {
        ...config,
        apiKey: apiKeyInput.trim(),
        useCustomKey: true,
      };
      setConfig(updatedConfig);
      saveStoredConfig(updatedConfig);
      showSaveNotification();
    } else {
      setTestResult({
        success: false,
        message: result.message,
      });
    }
  };

  const handleSaveApiKey = () => {
    const updatedConfig: GeminiConfig = {
      ...config,
      apiKey: apiKeyInput.trim(),
      useCustomKey: true,
    };
    setConfig(updatedConfig);
    saveStoredConfig(updatedConfig);
    showSaveNotification();
  };

  const handleResetToSystemKey = () => {
    const updatedConfig: GeminiConfig = {
      ...config,
      apiKey: '',
      useCustomKey: false,
    };
    setApiKeyInput('');
    setConfig(updatedConfig);
    saveStoredConfig(updatedConfig);
    setTestResult(null);
    showSaveNotification();
  };

  const showSaveNotification = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveSlots = (newConfig: GeminiConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);
    showSaveNotification();
  };

  // Presets never reference a specific model id — each one just picks by Gemini's own
  // stable tier-naming convention ("flash-lite" -> tốc độ, "pro" -> suy luận sâu, "flash" ->
  // cân bằng) from whatever's LIVE right now, so none of them can go stale.
  const applyPreset = (presetType: 'free' | 'speed' | 'pro') => {
    if (availableModels.length === 0) {
      setPlaygroundError('Danh sách model chưa tải xong, vui lòng thử lại sau giây lát.');
      return;
    }

    const keywords = presetType === 'speed' ? ['3.6-flash', 'flash-lite', 'flash'] : presetType === 'pro' ? ['pro'] : ['3.6-flash', '2.5-flash', 'flash'];
    const baseSeed = presetType === 'free' ? 0 : presetType === 'speed' ? 5 : 10;
    const updatedModels = {
      defaultModel: pickModelId(availableModels, keywords, baseSeed),
      courseGenerator: pickModelId(availableModels, keywords, baseSeed),
      flashcardGenerator: pickModelId(availableModels, keywords, baseSeed + 1),
      writingGrader: pickModelId(availableModels, keywords, baseSeed + 2),
      quizGenerator: pickModelId(availableModels, keywords, baseSeed),
    };

    const newConfig = { ...config, models: updatedModels };
    handleSaveSlots(newConfig);
  };

  const handleRunPlayground = async () => {
    if (!testPrompt.trim()) return;
    setIsGenerating(true);
    setPlaygroundError('');
    setTestResponse('');

    try {
      const result = await generateCompletion(testPrompt, testSelectedModel);
      setTestResponse(result);
    } catch (err: any) {
      setPlaygroundError(err.message || 'Xảy ra lỗi khi gửi yêu cầu đến Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <RequireAuthGate
        icon={Key}
        title="Đăng nhập để dùng Cài đặt"
        description="API Key và cấu hình model AI là dữ liệu cá nhân, cần đăng nhập để lưu và quản lý an toàn."
        benefits={[
          'Cấu hình Gemini API Key riêng, tăng hạn mức',
          'Chọn model AI tối ưu cho từng tính năng',
          'Cấu hình được lưu và đồng bộ theo tài khoản',
        ]}
        onOpenAuth={onOpenAuth}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">

      {/* Toast Save Notification */}
      {savedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>Đã lưu cấu hình AI thành công vào Trình duyệt!</span>
        </div>
      )}

      {/* Top Header & Segmented Control Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            if (onBack) onBack();
            else window.history.back();
          }}
          className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-slate-800 text-[#1B1F2E] dark:text-white font-extrabold text-xs flex items-center gap-2 transition-all duration-200 border border-[#E4E8F0] dark:border-[#334155] shadow-xs active:scale-95 cursor-pointer shrink-0 group"
          title="Quay lại"
        >
          <ArrowLeft className="w-4 h-4 text-[#2E68FF] group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại</span>
        </button>
        
        <div className="p-1.5 bg-[#EEF2F6] dark:bg-slate-800/80 rounded-2xl border border-[#E4E8F0] dark:border-slate-700/60 inline-flex flex-wrap items-center gap-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveTab('api');
              window.location.hash = 'api';
            }}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all duration-200 ${
              activeTab === 'api'
                ? 'bg-white dark:bg-[#1E293B] text-[#2E68FF] dark:text-blue-400 shadow-md border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-[#1B1F2E] dark:hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Cấu Hình Gemini API Key</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('resources');
              window.location.hash = 'resources';
            }}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all duration-200 ${
              activeTab === 'resources'
                ? 'bg-white dark:bg-[#1E293B] text-emerald-600 dark:text-emerald-400 shadow-md border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-[#1B1F2E] dark:hover:text-white'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Quản Lý Tài Nguyên AI (~90MB)</span>
          </button>
        </div>
      </div>

      {activeTab === 'api' ? (
        <>
          {/* Header Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E1B4B] text-white shadow-xl relative overflow-hidden border border-slate-700/60">
            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
              <Key className="w-80 h-80 text-blue-400" />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Miễn Phí Theo Hạn Mức Google AI Studio
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Dùng Key Hệ Thống Nếu Chưa Cấu Hình
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Chi phí vận hành 0đ
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
                Cài Đặt Cấu Hình AI & Gemini API Key
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                Tận dụng sức mạnh của <strong>Gemini API (Google AI)</strong> cho mọi tính năng AI trong ứng dụng. Nếu bạn chưa cấu hình Key riêng, hệ thống sẽ tự dùng Key dùng chung (có giới hạn lượt gọi/ngày) để bạn luôn sẵn sàng học tập.
              </p>
            </div>
          </div>

      {/* SECTION 1: HYBRID MODE TOGGLE */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-[#1B1F2E] dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#2E68FF]" />
            <span>1. Chọn Chế Độ Hoạt Động (Hybrid Model)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chọn giữa việc dùng sẵn Key dùng chung hoặc dùng Key Gemini cá nhân của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div
            onClick={() => handleToggleMode(false)}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 relative flex flex-col justify-between ${
              !config.useCustomKey
                ? 'border-[#2E68FF] bg-blue-50/50 dark:bg-blue-950/30 shadow-md'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            {!config.useCustomKey && (
              <span className="absolute top-4 right-4 text-xs font-black px-2.5 py-1 rounded-full bg-[#2E68FF] text-white flex items-center gap-1 shadow-xs">
                <Check className="w-3.5 h-3.5" /> Đang chọn
              </span>
            )}

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center font-bold">
                🟢
              </div>
              <h3 className="font-extrabold text-base text-[#1B1F2E] dark:text-white">
                Chế độ Miễn Phí Mặc Định (0Đ)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Dùng Key Gemini dùng chung của hệ thống, sẵn sàng dùng ngay không cần cấu hình gì thêm.
              </p>
            </div>

            <div className="pt-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Không cần API Key • Có giới hạn lượt gọi/ngày
            </div>
          </div>

          <div
            onClick={() => handleToggleMode(true)}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 relative flex flex-col justify-between ${
              config.useCustomKey
                ? 'border-[#2E68FF] bg-blue-50/50 dark:bg-blue-950/30 shadow-md'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            {config.useCustomKey && (
              <span className="absolute top-4 right-4 text-xs font-black px-2.5 py-1 rounded-full bg-[#2E68FF] text-white flex items-center gap-1 shadow-xs">
                <Check className="w-3.5 h-3.5" /> Đang chọn
              </span>
            )}

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center font-bold">
                ⚡
              </div>
              <h3 className="font-extrabold text-base text-[#1B1F2E] dark:text-white">
                Chế độ BYOK (Key Gemini Cá Nhân)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Nhập 1 API Key Gemini của riêng bạn (miễn phí tại Google AI Studio). Tăng giới hạn lượt gọi riêng cho bạn.
              </p>
            </div>

            <div className="pt-2 text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              Tăng Quota Riêng • Giảm tỉ lệ gặp lỗi hết hạn mức
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: GEMINI API KEY CONFIGURATION */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xs space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#1B1F2E] dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-[#2E68FF]" />
              <span>2. Quản Lý Gemini API Key</span>
            </h2>

            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              config.apiKey ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {config.apiKey ? '✓ Đã cấu hình Key' : 'Chưa nhập Key'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Nhập 1 API Key từ Google AI Studio để cấp quyền cho các tính năng AI trong ứng dụng.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Gemini API Key (bắt đầu bằng <code className="text-[#2E68FF]">AIzaSy...</code>)
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs font-mono text-[#1B1F2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E68FF]"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTestingKey}
                className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#1B1F2E] dark:text-white font-bold text-xs flex items-center gap-2 transition-colors shrink-0 disabled:opacity-50"
              >
                {isTestingKey ? <RefreshCw className="w-4 h-4 animate-spin text-[#2E68FF]" /> : <Zap className="w-4 h-4 text-amber-500" />}
                <span>Kiểm tra Key</span>
              </button>

              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-6 py-3 rounded-2xl bg-[#2E68FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-2 transition-colors shrink-0 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Lưu Cấu Hình</span>
              </button>
            </div>
          </div>

          {testResult && (
            <div className={`p-4 rounded-2xl text-xs space-y-1 flex items-start gap-3 animate-in fade-in duration-150 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{testResult.message}</p>
                {testResult.details && <p className="text-[11px] opacity-80">{testResult.details}</p>}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>
                <strong>Bảo mật tuyệt đối:</strong> Key lưu an toàn trong <code>localStorage</code> trên máy bạn.
              </span>
            </div>

            {config.apiKey && (
              <button
                type="button"
                onClick={handleResetToSystemKey}
                className="text-xs font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 underline underline-offset-4"
              >
                Xóa Key & Quay về Mặc Định
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: MODEL MAPPING PER FEATURE */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xs space-y-6">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#1B1F2E] dark:text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#2E68FF]" />
                <span>3. Phân Mạch Model AI Cho Từng Tính Năng</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tùy chỉnh mô hình Gemini tối ưu nhất cho từng tác vụ trong khóa học.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Cấu hình nhanh:</span>
              <button
                type="button"
                onClick={() => applyPreset('free')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors"
              >
                🟢 Cân Bằng
              </button>
              <button
                type="button"
                onClick={() => applyPreset('speed')}
                className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors"
              >
                ⚡ Tốc Độ Fast
              </button>
              <button
                type="button"
                onClick={() => applyPreset('pro')}
                className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-600 dark:text-purple-400 text-xs font-bold transition-colors"
              >
                🧠 Suy Luận Sâu
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs space-y-1 text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-300">
            <RefreshCw className="w-4 h-4 text-blue-500" />
            <span>Danh Sách Model Được Tải Trực Tiếp Từ Gemini</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Danh sách bên dưới luôn phản ánh đúng model Gemini đang khả dụng ngay lúc này (qua Key bạn đang cấu hình hoặc Key hệ thống), không có model nào bị "đóng cứng" trong ứng dụng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B1F2E] dark:text-white">
              <BookOpen className="w-4 h-4 text-[#2E68FF]" />
              <span>Tạo Khóa Học & Bài Giảng Tự Động</span>
            </div>
            <p className="text-[11px] text-slate-500">Phân tích video YouTube, tổng hợp lý thuyết & transcript.</p>
            <select
              value={config.models.courseGenerator}
              onChange={(e) => {
                const newConfig = {
                  ...config,
                  models: { ...config.models, courseGenerator: e.target.value },
                };
                setConfig(newConfig);
                saveStoredConfig(newConfig);
              }}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1F2E] dark:text-white focus:ring-2 focus:ring-[#2E68FF]"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B1F2E] dark:text-white">
              <Layers className="w-4 h-4 text-[#2E68FF]" />
              <span>Tạo Thẻ Ghi Nhớ Flashcard (SRS)</span>
            </div>
            <p className="text-[11px] text-slate-500">Trích xuất từ vựng, phiên âm IPA, câu ví dụ chuẩn.</p>
            <select
              value={config.models.flashcardGenerator}
              onChange={(e) => {
                const newConfig = {
                  ...config,
                  models: { ...config.models, flashcardGenerator: e.target.value },
                };
                setConfig(newConfig);
                saveStoredConfig(newConfig);
              }}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1F2E] dark:text-white focus:ring-2 focus:ring-[#2E68FF]"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B1F2E] dark:text-white">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Chấm Bài Viết & Sửa Lỗi Ngữ Pháp (Writing)</span>
            </div>
            <p className="text-[11px] text-slate-500">Đánh giá IELTS Band score, chỉ ra lỗi sai chi tiết.</p>
            <select
              value={config.models.writingGrader}
              onChange={(e) => {
                const newConfig = {
                  ...config,
                  models: { ...config.models, writingGrader: e.target.value },
                };
                setConfig(newConfig);
                saveStoredConfig(newConfig);
              }}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1F2E] dark:text-white focus:ring-2 focus:ring-[#2E68FF]"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B1F2E] dark:text-white">
              <HelpCircle className="w-4 h-4 text-purple-500" />
              <span>Tạo Câu Hỏi Trắc Nghiệm (Quiz & Dictation)</span>
            </div>
            <p className="text-[11px] text-slate-500">Tạo câu hỏi kiểm tra độ hiểu bài & bài tập chính tả.</p>
            <select
              value={config.models.quizGenerator}
              onChange={(e) => {
                const newConfig = {
                  ...config,
                  models: { ...config.models, quizGenerator: e.target.value },
                };
                setConfig(newConfig);
                saveStoredConfig(newConfig);
              }}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1F2E] dark:text-white focus:ring-2 focus:ring-[#2E68FF]"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

          {/* SECTION 5: PLAYGROUND */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#1B1F2E] dark:text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-500" />
                <span>4. Thử Nghiệm Gọi AI Trực Tiếp (AI Playground)</span>
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="sm:w-1/3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Chọn Model</label>
                  <select
                    value={testSelectedModel}
                    onChange={(e) => setTestSelectedModel(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1F2E] dark:text-white"
                  >
                    {availableModels.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:w-2/3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Prompt</label>
                  <input
                    type="text"
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs text-[#1B1F2E] dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRunPlayground}
                  disabled={isGenerating}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{isGenerating ? 'Đang gửi...' : 'Gửi Yêu Cầu'}</span>
                </button>
              </div>

              {playgroundError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 text-xs text-red-700 dark:text-red-300">
                  <strong>Lỗi:</strong> {playgroundError}
                </div>
              )}

              {testResponse && (
                <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono leading-relaxed space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                    <span>🤖 Response from: {testSelectedModel}</span>
                    <span className="text-emerald-400 font-bold">200 OK</span>
                  </div>
                  <p className="whitespace-pre-wrap font-sans text-xs text-slate-200">{testResponse}</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <ResourceManagerSection autoDownload={autoDownload} />
      )}

    </div>
  );
};
