import React, { useState, useRef } from 'react';
import { SpeakingPrompt, SpeakingEvaluation, ModeProgress } from '../../../core/entities';
import { evaluateSpeaking } from '../../../infrastructure/api/talk2meApi';
import {
  Mic, Square, Sparkles, Volume2, Award, Send,
  RotateCcw, History, Video, Lightbulb, Loader2
} from 'lucide-react';
import { CompletedModeGate } from './CompletedModeGate';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useAiResourceGate } from '../../hooks/useAiResourceGate';
import { ModelDownloadPromptModal } from './ModelDownloadPromptModal';

interface SpeakingExerciseProps {
  courseId: string;
  lessonId: string;
  prompt?: SpeakingPrompt;
  progress?: ModeProgress;
  youtubeVideoId?: string;
  startSeconds?: number;
  onFinishSpeaking: () => void;
}

export const SpeakingExercise: React.FC<SpeakingExerciseProps> = ({
  courseId,
  lessonId,
  prompt,
  progress,
  youtubeVideoId = 's3a339B-8J8',
  startSeconds = 0,
  onFinishSpeaking,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTranscript, setRecordedTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<SpeakingEvaluation | null>(null);
  const [evalError, setEvalError] = useState('');
  const [practiceCount, setPracticeCount] = useState(3);
  const [showCompactVideo, setShowCompactVideo] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showHint, setShowHint] = useState(false);
  /** true after user stops recording — enables the "Submit" button */
  const [hasStopped, setHasStopped] = useState(false);

  const [pronounceWordInput, setPronounceWordInput] = useState('');
  const [aiAssistantMessages, setAiAssistantMessages] = useState<Array<{ role: 'ai' | 'user', text: string }>>([
    { role: 'ai', text: 'Xin chào! Mình là trợ lý AI Speaking. Bạn có thể xin câu mẫu, học từ vựng chủ đề hoặc luyện phát âm từ/cụm từ bên dưới nhé!' }
  ]);

  const recognitionRef = useRef<any>(null);
  const { speak: speakText, preload } = useTextToSpeech();
  const ttsGate = useAiResourceGate('tts', preload);

  if (progress?.completed && !isRetrying && !evaluation) {
    return (
      <CompletedModeGate
        title="Bạn đã hoàn thành Speaking này"
        scoreLabel={progress.accuracy != null ? `Band ${progress.accuracy}` : undefined}
        onRetry={() => setIsRetrying(true)}
        onContinue={onFinishSpeaking}
      />
    );
  }

  const topicTitle = prompt?.promptText || "Do you wear a watch or describe a favorite piece of technology?";

  const startRecording = () => {
    setIsRecording(true);
    setRecordedTranscript('');
    setHasStopped(false);
    setEvaluation(null);
    setEvalError('');

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          setRecordedTranscript(transcript);
        };

        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech recognition failed to start:', e);
        setIsRecording(false);
        setEvalError('Không thể khởi động nhận diện giọng nói. Hãy thử dùng Chrome.');
      }
    } else {
      setIsRecording(false);
      setEvalError('Trình duyệt không hỗ trợ nhận diện giọng nói. Hãy sử dụng Google Chrome.');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setHasStopped(true);
  };

  const handleSubmitForEvaluation = async () => {
    const textToEvaluate = recordedTranscript.trim();
    if (!textToEvaluate) {
      setEvalError('Không nhận được giọng nói. Vui lòng ghi âm lại và nói rõ hơn.');
      return;
    }
    setPracticeCount(prev => prev + 1);
    setIsEvaluating(true);
    setEvalError('');
    try {
      const result = await evaluateSpeaking(courseId, lessonId, textToEvaluate);
      setEvaluation(result);
    } catch (err: any) {
      console.error('Speaking evaluation failed:', err);
      setEvalError(err.message || 'Không thể chấm điểm phần nói. Vui lòng thử lại.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setRecordedTranscript('');
    setHasStopped(false);
    setEvaluation(null);
    setEvalError('');
  };

  const handleRequestSampleAnswer = () => {
    setAiAssistantMessages(prev => [
      ...prev,
      { role: 'user', text: 'Cho mình câu mẫu trả lời hay (Band 7.5+)' },
      { 
        role: 'ai', 
        text: `Dưới đây là câu mẫu gợi ý Band 8.0 cho chủ đề "${topicTitle}":\n\n"To be honest, I rely heavily on my smartwatch every single day. Not only does it allow me to manage my time efficiently, but it also monitors my heart rate and daily fitness. It has become an indispensable gadget in my routine."` 
      }
    ]);
  };

  const handleRequestTopicVocab = () => {
    setAiAssistantMessages(prev => [
      ...prev,
      { role: 'user', text: 'Từ vựng chủ đề này' },
      { 
        role: 'ai', 
        text: `Các cụm từ hay (Collocations) cho chủ đề "${topicTitle}":\n• manage my time efficiently (v): Quản lý thời gian hiệu quả\n• indispensable gadget (n): Thiết bị không thể thiếu\n• sentimental value (n): Giá trị kỷ niệm\n• state-of-the-art technology (n): Công nghệ hiện đại nhất\n• suit my personal style (v): Phù hợp với phong cách cá nhân` 
      }
    ]);
  };

  const handlePronouncePractice = () => {
    if (!pronounceWordInput.trim()) return;
    const text = pronounceWordInput.trim();
    speakText(text);
    setAiAssistantMessages(prev => [
      ...prev,
      { role: 'user', text: `Luyện phát âm từ/cụm: "${text}"` },
      { role: 'ai', text: `🔊 Đã phát âm audio chuẩn giọng Anh-Mỹ cho từ/cụm "${text}". Bạn hãy nghe và lặp lại 3 lần nhé!` }
    ]);
    setPronounceWordInput('');
  };

  return (
    <div className="w-full space-y-4">
      
      {/* TOP SUMMARY / CONTROL BAR */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
            Speaking Studio
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
            <History className="w-4 h-4 text-emerald-600" />
            <span>Lịch sử luyện tập: <strong className="text-emerald-600 font-extrabold">{practiceCount} lần</strong></span>
          </div>
        </div>

        <button
          onClick={() => setShowCompactVideo(!showCompactVideo)}
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors"
        >
          <Video className="w-3.5 h-3.5" />
          <span>{showCompactVideo ? 'Ẩn Video' : 'Hiện Video bài học'}</span>
        </button>
      </div>

      {/* 3-PART WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {showCompactVideo && (
          <div className="lg:col-span-3 space-y-4 bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">Video Bài Học</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Tham khảo</span>
              </div>

              <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-sm aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?start=${startSeconds}&autoplay=0`}
                  title="Lesson Reference Video"
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <span>💡 Mẹo luyện nói:</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Hãy lắng nghe người bản xứ trong video để học ngữ điệu & trọng âm tự nhiên trước khi bạn ghi âm.
              </p>
            </div>
          </div>
        )}

        {/* ── CENTER: Speaking topic + Record + Transcript ── */}
        <div className={`${showCompactVideo ? 'lg:col-span-5' : 'lg:col-span-7'} space-y-4 bg-white dark:bg-[#1E293B] p-5 sm:p-6 rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-sm flex flex-col justify-between min-h-[460px]`}>
          
          {/* Topic question */}
          <div className="space-y-3 text-center">
            <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[#12B76A] font-extrabold text-xs uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
              Câu hỏi nói (Speaking Topic)
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1B1F2E] dark:text-white leading-snug">
              "{topicTitle}"
            </h2>

            {prompt?.hintText && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowHint((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
                >
                  <Lightbulb className="w-3 h-3" />
                  <span>{showHint ? 'Ẩn gợi ý' : 'Xem gợi ý'}</span>
                </button>
                {showHint && (
                  <p className="text-[11px] text-[#5A6478] dark:text-[#94A3B8] mt-1">{prompt.hintText}</p>
                )}
              </div>
            )}
          </div>

          {/* ── Transcript box + controls ── */}
          <div className="flex-1 flex flex-col gap-3 my-3">
            {!evaluation ? (
              <>
                {/* Live transcript area */}
                <div className={`flex-1 relative rounded-2xl border-2 transition-all overflow-hidden ${
                  isRecording
                    ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20'
                    : hasStopped && recordedTranscript.trim()
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-[#E4E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]'
                }`}>
                  {/* Status indicator */}
                  <div className={`px-4 py-2 border-b flex items-center gap-2 ${
                    isRecording
                      ? 'border-red-200 dark:border-red-800 bg-red-100/60 dark:bg-red-950/40'
                      : hasStopped && recordedTranscript.trim()
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-100/60 dark:bg-emerald-950/40'
                      : 'border-[#E4E8F0] dark:border-[#334155]'
                  }`}>
                    {isRecording ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                          Đang nghe... Hãy nói tự nhiên!
                        </span>
                      </>
                    ) : hasStopped && recordedTranscript.trim() ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          Đã ghi nhận — xem lại văn bản bên dưới
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] font-medium text-[#95A0B4] dark:text-[#64748B]">
                        Nhấn nút Ghi âm để bắt đầu nói
                      </span>
                    )}
                  </div>

                  {/* Transcript content (read-only) */}
                  <div className="px-4 py-3 min-h-[120px] max-h-[200px] overflow-y-auto">
                    {recordedTranscript ? (
                      <p className="text-sm text-[#1B1F2E] dark:text-[#E2E8F0] leading-relaxed font-medium select-text">
                        {recordedTranscript}
                      </p>
                    ) : (
                      <p className="text-xs text-[#95A0B4] dark:text-[#64748B] italic">
                        {isRecording ? 'Đang chờ giọng nói...' : 'Văn bản sẽ hiển thị ở đây khi bạn nói...'}
                      </p>
                    )}
                  </div>

                  {/* Submit button — only after stopping with transcript */}
                  {hasStopped && recordedTranscript.trim() && !isEvaluating && (
                    <div className="px-4 py-3 border-t border-[#E4E8F0] dark:border-[#334155] flex items-center justify-between gap-3">
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] text-xs font-bold text-[#5A6478] dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Ghi âm lại</span>
                      </button>
                      <button
                        onClick={handleSubmitForEvaluation}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wide shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi đánh giá</span>
                      </button>
                    </div>
                  )}

                  {/* Loading state */}
                  {isEvaluating && (
                    <div className="px-4 py-4 border-t border-[#E4E8F0] dark:border-[#334155] flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                      <span className="text-xs font-bold text-emerald-600">Đang chấm điểm bởi AI...</span>
                    </div>
                  )}
                </div>

                {/* Empty transcript after stop */}
                {hasStopped && !recordedTranscript.trim() && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-medium">
                    ⚠ Không nhận được giọng nói. Hãy kiểm tra mic và thử ghi âm lại.
                  </div>
                )}

                {evalError && (
                  <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
                    {evalError}
                  </div>
                )}
              </>
            ) : (
              /* ── Evaluation result ── */
              <div className="p-5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#12B76A] uppercase tracking-wider">Kết quả chấm điểm AI</span>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Band {evaluation.overallScore}</h3>
                  </div>
                  <Award className="w-8 h-8 text-[#12B76A]" />
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {evaluation.summary}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-100 dark:border-emerald-900">
                    <span className="text-slate-400 block font-semibold">Pronunciation</span>
                    <strong className="text-slate-800 dark:text-slate-100">{evaluation.criteria.pronunciation.score}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-100 dark:border-emerald-900">
                    <span className="text-slate-400 block font-semibold">Fluency</span>
                    <strong className="text-slate-800 dark:text-slate-100">{evaluation.criteria.fluency.score}</strong>
                  </div>
                </div>

                {/* Transcript that was evaluated */}
                <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-[#E4E8F0] dark:border-[#334155]">
                  <span className="text-[10px] font-bold text-[#95A0B4] uppercase tracking-wider block mb-1">Văn bản đã ghi nhận</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">"{recordedTranscript}"</p>
                </div>

                <button
                  onClick={handleReset}
                  className="text-xs font-bold text-[#12B76A] hover:underline block pt-1"
                >
                  ← Thử ghi âm lại lần nữa
                </button>
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="pt-4 border-t border-[#E4E8F0] dark:border-[#334155] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => speakText(topicTitle)}
                className="w-10 h-10 rounded-full bg-[#F1F4F9] dark:bg-[#273449] hover:bg-slate-200 text-slate-700 dark:text-white flex items-center justify-center transition-transform active:scale-95"
                title="Nghe phát âm câu hỏi"
              >
                <Volume2 className="w-5 h-5 text-emerald-600" />
              </button>
            </div>

            {isRecording ? (
              <button
                onClick={stopRecording}
                className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs uppercase tracking-wide flex items-center gap-2 shadow-xl animate-pulse"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Dừng ghi âm</span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={isEvaluating}
                className="px-7 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wide flex items-center gap-2 shadow-xl shadow-emerald-500/20 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Mic className="w-4 h-4" />
                <span>Ghi âm ngay</span>
              </button>
            )}
          </div>

        </div>

        {/* ── RIGHT: AI Coach panel ── */}
        <div className={`${showCompactVideo ? 'lg:col-span-4' : 'lg:col-span-5'} space-y-4 bg-white dark:bg-[#1E293B] p-5 sm:p-6 rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-sm flex flex-col justify-between min-h-[460px]`}>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">AI Hỗ Trợ (AI Coach)</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Gợi ý câu mẫu, từ vựng & phát âm</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[9px] uppercase tracking-wider">
                ONLINE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={handleRequestSampleAnswer}
                className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] text-left font-bold text-slate-800 dark:text-slate-200 hover:border-emerald-500 transition-colors flex items-center gap-1.5 group"
              >
                <span className="text-sm">💡</span>
                <span className="text-[11px]">Cho câu mẫu</span>
              </button>

              <button
                type="button"
                onClick={handleRequestTopicVocab}
                className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] text-left font-bold text-slate-800 dark:text-slate-200 hover:border-emerald-500 transition-colors flex items-center gap-1.5 group"
              >
                <span className="text-sm">📚</span>
                <span className="text-[11px]">Từ vựng chủ đề</span>
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] max-h-[220px] overflow-y-auto space-y-2 text-xs">
              {aiAssistantMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl leading-relaxed font-medium whitespace-pre-wrap ${
                    msg.role === 'ai'
                      ? 'bg-white dark:bg-[#1E293B] border border-emerald-100 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200 shadow-2xs'
                      : 'bg-emerald-600 text-white ml-6 font-semibold'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-[#E4E8F0] dark:border-[#334155]">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Luyện phát âm từ/cụm từ:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pronounceWordInput}
                onChange={(e) => setPronounceWordInput(e.target.value)}
                placeholder="Nhập từ/cụm từ..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E4E8F0] dark:border-[#334155] text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handlePronouncePractice}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition-transform active:scale-95"
              >
                Phát âm
              </button>
            </div>
          </div>

        </div>

      </div>

      <ModelDownloadPromptModal
        isOpen={ttsGate.isPromptOpen}
        onClose={ttsGate.closePrompt}
        onGoToSettings={ttsGate.goToSettings}
        {...ttsGate.modalProps}
      />

    </div>
  );
};
