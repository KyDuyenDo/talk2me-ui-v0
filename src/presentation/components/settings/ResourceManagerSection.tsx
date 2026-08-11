import React, { useState, useEffect, useRef } from 'react';
import {
  DownloadCloud,
  HardDrive,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Info,
  RefreshCw,
  Cpu,
  Lock,
  WifiOff
} from 'lucide-react';
import {
  getModelResourceStatus,
  downloadModel,
  deleteModel,
  pronunciationDownloadStore,
  ModelResourceStatus
} from '../../../infrastructure/ai/resourceManager';
import {
  isTtsModelDownloaded,
  getTtsDownloadedAt,
  preloadTtsModel,
  deleteTtsModel,
  ttsDownloadStore,
} from '../../../infrastructure/ai/ttsEngine';
import { useDownloadStore } from '../../hooks/useDownloadStore';

interface ResourceManagerSectionProps {
  /** Set when the user arrived here by accepting a "download this AI model?" prompt
   * elsewhere in the app (see useAiResourceGate.tsx) — auto-starts that download immediately
   * instead of making them find and click the button themselves. */
  autoDownload?: 'pronunciation' | 'tts';
}

export const ResourceManagerSection: React.FC<ResourceManagerSectionProps> = ({ autoDownload }) => {
  const [status, setStatus] = useState<ModelResourceStatus | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Read from a module-level store instead of local state — a background download keeps
  // running (and reporting real progress) even if this component unmounts (e.g. user
  // navigates away from Settings mid-download) and remounts later; local state would have
  // reset to 0%/not-downloading on remount and looked like the download was lost.
  const pronunciationDl = useDownloadStore(pronunciationDownloadStore);
  const isDownloading = pronunciationDl.status === 'downloading';
  const downloadProgress = pronunciationDl.progress;

  // Kokoro TTS — independent state, own model, own cache (Transformers.js's own Cache
  // Storage entry, not the wav2vec2 zip-download flow above).
  const [ttsDownloaded, setTtsDownloaded] = useState(false);
  const [ttsDownloadedAt, setTtsDownloadedAt] = useState<string | null>(null);
  const [isTtsDeleting, setIsTtsDeleting] = useState(false);
  const [ttsMessage, setTtsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const ttsDl = useDownloadStore(ttsDownloadStore);
  const isTtsDownloading = ttsDl.status === 'downloading';
  const ttsDownloadProgress = ttsDl.progress;

  const loadStatus = async () => {
    try {
      const res = await getModelResourceStatus();
      setStatus(res);
    } catch (err) {
      console.error('Failed to load resource status:', err);
    }
  };

  const loadTtsStatus = () => {
    setTtsDownloaded(isTtsModelDownloaded());
    setTtsDownloadedAt(getTtsDownloadedAt());
  };

  useEffect(() => {
    loadStatus();
    loadTtsStatus();
  }, []);

  const handleDownload = async () => {
    setMessage(null);

    try {
      await downloadModel();
      await loadStatus();
      setMessage({
        type: 'success',
        text: 'Đã tải và lưu thành công Model AI Phát Âm (~90MB) vào bộ nhớ trình duyệt!',
      });
    } catch (err: any) {
      console.error('Download model failed:', err);
      setMessage({
        type: 'error',
        text: err.message || 'Tải model thất bại. Vui lòng kiểm tra lại kết nối mạng.',
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa Model AI Phát Âm khỏi bộ nhớ trình duyệt?')) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    try {
      await deleteModel();
      await loadStatus();
      setMessage({
        type: 'success',
        text: 'Đã xóa dữ liệu Model AI khỏi bộ nhớ thiết bị.',
      });
    } catch (err: any) {
      console.error('Delete model failed:', err);
      setMessage({
        type: 'error',
        text: 'Không thể xóa dữ liệu.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTtsDownload = async () => {
    setTtsMessage(null);

    try {
      await preloadTtsModel();
      loadTtsStatus();
      setTtsMessage({
        type: 'success',
        text: 'Đã tải và lưu thành công Model Kokoro TTS (~86MB) vào bộ nhớ trình duyệt!',
      });
    } catch (err: any) {
      console.error('Download TTS model failed:', err);
      setTtsMessage({
        type: 'error',
        text: err.message || 'Tải model thất bại. Vui lòng kiểm tra lại kết nối mạng.',
      });
    }
  };

  const handleTtsDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa Model Kokoro TTS khỏi bộ nhớ trình duyệt?')) {
      return;
    }

    setIsTtsDeleting(true);
    setTtsMessage(null);
    try {
      await deleteTtsModel();
      loadTtsStatus();
      setTtsMessage({
        type: 'success',
        text: 'Đã xóa dữ liệu Model Kokoro TTS khỏi bộ nhớ thiết bị.',
      });
    } catch (err) {
      console.error('Delete TTS model failed:', err);
      setTtsMessage({
        type: 'error',
        text: 'Không thể xóa dữ liệu.',
      });
    } finally {
      setIsTtsDeleting(false);
    }
  };

  // Auto-start the download the user just consented to (see useAiResourceGate.tsx) — no
  // second manual click needed. Guarded by a ref since React can invoke effects twice in
  // dev/StrictMode, and by the current downloaded state so this never re-downloads something
  // the user already has.
  const hasAutoTriggeredRef = useRef(false);
  useEffect(() => {
    if (!autoDownload || hasAutoTriggeredRef.current) return;
    hasAutoTriggeredRef.current = true;
    if (autoDownload === 'pronunciation' && !status?.downloaded) {
      handleDownload();
    } else if (autoDownload === 'tts' && !ttsDownloaded) {
      handleTtsDownload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload]);

  return (
    <div id="resource-manager-section" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#064E3B] to-[#022C22] text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <HardDrive className="w-80 h-80 text-emerald-400" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              100% Client-Side WebAssembly (ONNX)
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5 text-blue-400" />
              Chạy Offline Tức Thì Không Cần Mạng
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
              Bộ Nhớ Cục Bộ (CacheStorage)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
                Quản Lý Tài Nguyên AI & Dữ Liệu Tải Về
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-3xl mt-1">
                Tải gói mô hình học máy nén <strong>Wav2Vec2 INT8 (~90MB)</strong> về bộ nhớ trình duyệt để luyện tập bài tập Shadowing (nhại giọng) và chấm điểm âm tiết chính xác.
              </p>
            </div>

            <span
              className={`text-xs font-extrabold px-4 py-2 rounded-full shrink-0 flex items-center gap-1.5 shadow-md ${
                status?.downloaded
                  ? 'bg-emerald-500 text-white border border-emerald-400/50'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {status?.downloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã Tải Đủ (~90MB)</span>
                </>
              ) : (
                <span>Chưa Tải Model AI</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Message feedback */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Content Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xs space-y-6">
        
        {/* Resource Item Card */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 shadow-sm">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#1B1F2E] dark:text-white flex items-center gap-2">
                  <span>Model AI Chấm Điểm Phát Âm (Wav2Vec2 INT8 ONNX)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Mô hình học máy nén INT8 (~90MB), hỗ trợ Viterbi CTC Forced Alignment & GOP scoring chạy 100% Offline trên trình duyệt.
                </p>
                {status?.downloadedAt && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    ✓ Đã lưu trữ trong CacheStorage ({new Date(status.downloadedAt).toLocaleString('vi-VN')})
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {!status?.downloaded ? (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang tải {downloadProgress}%...</span>
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="w-4 h-4" />
                      <span>Tải Model (~90MB)</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Xóa Khỏi Bộ Nhớ</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress bar during download */}
          {isDownloading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                <span>Đang lưu trữ vào CacheStorage...</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* TTS message feedback */}
        {ttsMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
              ttsMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            {ttsMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span>{ttsMessage.text}</span>
          </div>
        )}

        {/* Resource Item Card — Kokoro TTS */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0 shadow-sm">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#1B1F2E] dark:text-white flex items-center gap-2">
                  <span>Model AI Đọc Giọng Nói (Kokoro TTS)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Mô hình đọc văn bản tiếng Anh tự nhiên (~86MB), dùng cho nút loa ở Flashcard, Writing & Speaking, chạy 100% Offline trên trình duyệt.
                </p>
                {ttsDownloadedAt && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    ✓ Đã lưu trữ trong CacheStorage ({new Date(ttsDownloadedAt).toLocaleString('vi-VN')})
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {!ttsDownloaded ? (
                <button
                  type="button"
                  onClick={handleTtsDownload}
                  disabled={isTtsDownloading}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#2E68FF] hover:bg-blue-600 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {isTtsDownloading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang tải {ttsDownloadProgress}%...</span>
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="w-4 h-4" />
                      <span>Tải Model (~86MB)</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTtsDelete}
                  disabled={isTtsDeleting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isTtsDeleting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Xóa Khỏi Bộ Nhớ</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress bar during download */}
          {isTtsDownloading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                <span>Đang lưu trữ vào CacheStorage...</span>
                <span>{ttsDownloadProgress}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-200"
                  style={{ width: `${ttsDownloadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Guide & Privacy Commitment Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* Commitment */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Cam Kết Bảo Mật & Quyền Riêng Tư 100%</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Model AI chạy <strong>100% Offline</strong> ngay trên thiết bị của bạn thông qua WebAssembly ONNX Runtime. Giọng nói và bản ghi âm phát âm của bạn <strong>KHÔNG BAO GIỜ</strong> bị gửi lên bất kỳ máy chủ nào.
            </p>
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-blue-800 dark:text-blue-300">
              <WifiOff className="w-4 h-4 text-blue-600" />
              <span>Hướng Dẫn & Quyền Lợi Sử Dụng</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Chỉ cần tải <strong>1 lần duy nhất</strong>. Sau khi tải thành công, bạn có thể thực hiện bài tập nhại giọng (Shadowing) và nhận điểm phát âm tức thì bất cứ lúc nào, kể cả khi mất kết nối Internet.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
