import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Course } from '../../core/entities';
import { 
  TheoryReader, 
  QuizPlayer, 
  DictationExercise, 
  ShadowingExercise, 
  WritingExercise, 
  SpeakingExercise 
} from '../components/exercises';
import { 
  ArrowLeft, 
  Sparkles, 
  Trash2, 
  Video, 
  ChevronDown, 
  ArrowUp,
  MoreVertical,
  BookOpen,
  CheckCircle2,
  Play
} from 'lucide-react';
import { useDeleteCourseMutation } from '../../application/queries/useCoursesQuery';
import { useAuth } from '../../application/hooks/useAuth';
import { useYoutubeSegmentPlayer } from '../hooks/useYoutubeSegmentPlayer';

interface CourseDetailPageProps {
  course: Course;
  onBack: () => void;
  onOpenCreateModal?: (url?: string) => void;
  onDeleteCourse?: (courseId: string) => void;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  course,
  onBack,
  onOpenCreateModal,
  onDeleteCourse,
}) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlLesson = searchParams.get('lesson');
  const urlMode = searchParams.get('mode') as any;

  const [activeLessonIndex, setActiveLessonIndexState] = useState<number>(() => {
    const parsed = urlLesson ? parseInt(urlLesson, 10) : 0;
    return !isNaN(parsed) && parsed >= 0 ? parsed : 0;
  });

  const [activeMode, setActiveModeState] = useState<'theory' | 'quiz' | 'dictation' | 'shadowing' | 'writing' | 'speaking'>(() => {
    const validModes = ['theory', 'quiz', 'dictation', 'shadowing', 'writing', 'speaking'];
    return validModes.includes(urlMode) ? urlMode : 'theory';
  });

  const setActiveLessonIndex = (index: number) => {
    setActiveLessonIndexState(index);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('lesson', index.toString());
      return next;
    }, { replace: true });
  };

  const setActiveMode = (mode: 'theory' | 'quiz' | 'dictation' | 'shadowing' | 'writing' | 'speaking') => {
    setActiveModeState(mode);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('mode', mode);
      return next;
    }, { replace: true });
  };
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [isLessonsExpanded, setIsLessonsExpanded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  const deleteMutation = useDeleteCourseMutation();
  const { iframeRef: theoryVideoRef, playSegment: playTheorySegment } = useYoutubeSegmentPlayer(course.youtubeVideoId);

  const canDelete = Boolean(user && (onDeleteCourse || (course.userId && course.userId === user.id)));

  // Only visible while the user is actively scrolling — fades back out ~1.2s after the
  // last scroll event (standing still), instead of staying pinned onscreen the whole time
  // once past the threshold.
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => setShowScrollTop(false), 1200);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  const handleDeleteCourse = async () => {
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }
    try {
      if (onDeleteCourse) {
        onDeleteCourse(course.id);
      } else {
        await deleteMutation.mutateAsync(course.id);
      }
      onBack();
    } catch (err) {
      console.error('Delete course failed:', err);
    }
  };

  const currentLesson = course.lessons[activeLessonIndex] || course.lessons[0];
  const isModeDone = (mode: string) => Boolean(currentLesson?.completedModes?.includes(mode as any));

  const modesList = [
    { id: 'theory', label: 'Lý thuyết', icon: '📖', color: 'from-purple-600 to-indigo-600' },
    { id: 'quiz', label: `Trắc nghiệm (${currentLesson?.quizQuestions?.length || 0})`, icon: '🎯', color: 'from-blue-600 to-cyan-600' },
    { id: 'dictation', label: 'Chính tả', icon: '🎧', color: 'from-cyan-600 to-teal-600' },
    { id: 'shadowing', label: 'Luyện nói', icon: '🔁', color: 'from-pink-600 to-rose-600' },
    { id: 'writing', label: 'AI Viết', icon: '✍️', color: 'from-amber-500 to-orange-600' },
    { id: 'speaking', label: 'AI Nói', icon: '🎙️', color: 'from-emerald-500 to-green-600' },
  ];

  return (
    <div className="max-w-[1680px] w-full mx-auto px-3 sm:px-6 lg:px-10 py-3 sm:py-6 space-y-4 relative">
      
      {/* UNIFIED MODERN HEADER & TABS BAR */}
      <div className="bg-white dark:bg-[#1E293B] p-3.5 sm:p-4 rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-xs space-y-3">
        
        {/* Row 1: Top Action & Meta Info Bar */}
        <div className="flex items-center justify-between gap-3">
          
          {/* Left: Back button & Title */}
          <div className="flex items-center gap-2.5 overflow-hidden">
            <button
              onClick={onBack}
              className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-slate-800 text-[#1B1F2E] dark:text-white font-extrabold text-xs flex items-center gap-2 transition-all duration-200 border border-[#E4E8F0] dark:border-[#334155] shadow-xs active:scale-95 cursor-pointer shrink-0 group"
              title="Quay lại danh sách khóa học"
            >
              <ArrowLeft className="w-4 h-4 text-[#2E68FF] group-hover:-translate-x-0.5 transition-transform" />
              <span>Thư viện</span>
            </button>

            <div className="overflow-hidden flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2E68FF] font-extrabold text-[11px] border border-blue-200/50 dark:border-blue-800/40 shrink-0">
                Danh mục: {!course.category || course.category === 'Tất Cả Khóa Học' || course.category === 'all' ? 'Tiếng Anh & Kỹ Năng' : course.category}
              </span>
              <h2 className="font-extrabold text-sm sm:text-base text-[#1B1F2E] dark:text-white truncate hidden md:block">
                {course.title}
              </h2>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden lg:inline text-slate-500 dark:text-slate-400 text-xs font-semibold px-1">
              Kênh: {course.channelName || 'YouTube'}
            </span>

            {onOpenCreateModal && (
              <button
                onClick={() => onOpenCreateModal(course.youtubeUrl)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#2E68FF] dark:text-blue-400 text-xs font-bold transition-colors border border-blue-200/50 dark:border-slate-700"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tạo lại bằng AI</span>
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDeleteCourse}
                onMouseLeave={() => setShowConfirmDelete(false)}
                className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all border ${
                  showConfirmDelete
                    ? 'bg-red-600 text-white border-red-600 animate-pulse'
                    : 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60'
                }`}
                title="Xóa khóa học này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{showConfirmDelete ? 'Xác nhận xóa?' : 'Xóa'}</span>
              </button>
            )}

            {/* Mobile Actions Popover Trigger */}
            <div className="relative sm:hidden">
              <button
                onClick={() => setShowMobileActions(!showMobileActions)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMobileActions && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-[#E4E8F0] dark:border-[#334155] p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
                  {onOpenCreateModal && (
                    <button
                      onClick={() => {
                        setShowMobileActions(false);
                        onOpenCreateModal(course.youtubeUrl);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Sparkles className="w-4 h-4 text-[#2E68FF]" />
                      <span>Tạo lại bằng AI</span>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => {
                        setShowMobileActions(false);
                        handleDeleteCourse();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa khóa học</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Mode Switcher Bar (Horizontal Scrollable Pill Tabs) */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none whitespace-nowrap scroll-smooth">
          {modesList.map((m) => {
            const isActive = activeMode === m.id;
            const done = isModeDone(m.id);
            return (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id as any)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs transition-all duration-200 cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-r ${m.color} text-white font-extrabold shadow-md shadow-blue-500/20 scale-[1.02]`
                    : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
                {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />}
              </button>
            );
          })}
        </div>

      </div>

      {/* Mode Content Views */}
      {activeMode === 'dictation' ? (
        <DictationExercise
          courseId={course.id}
          lessonId={currentLesson?.id}
          progress={currentLesson?.modeProgress?.dictation}
          segments={currentLesson?.dictationSegments || []}
          youtubeVideoId={course.youtubeVideoId}
          videoTitle={course.title}
          onFinishDictation={() => setActiveMode('shadowing')}
        />
      ) : activeMode === 'speaking' ? (
        <SpeakingExercise
          courseId={course.id}
          lessonId={currentLesson?.id}
          progress={currentLesson?.modeProgress?.speaking}
          prompt={currentLesson?.speakingPrompt}
          youtubeVideoId={course.youtubeVideoId}
          startSeconds={currentLesson?.startSeconds}
          onFinishSpeaking={() => {
            alert('🎉 Chúc mừng! Bạn đã hoàn thành xuất sắc tất cả 6 bài tập cho bài học này!');
            setActiveMode('theory');
          }}
        />
      ) : activeMode === 'shadowing' ? (
        <ShadowingExercise
          courseId={course.id}
          lessonId={currentLesson?.id}
          progress={currentLesson?.modeProgress?.shadowing}
          youtubeVideoId={course.youtubeVideoId}
          lines={currentLesson?.shadowingLines || []}
          onFinishShadowing={() => setActiveMode('writing')}
        />
      ) : (
        /* ── Theory / Quiz / Writing / Exercises Shared Grid Layout ── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Video Player (With toggle for video iframe ONLY) & Lessons List */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
            
            {/* Video Card Container */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E4E8F0] dark:border-[#334155] p-3 shadow-xs space-y-3">
              
              {/* Dedicated Video Toggle Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 fill-red-600" />
                  </div>
                  <span className="font-bold text-xs text-[#1B1F2E] dark:text-white">Video bài học</span>
                </div>

                <button
                  onClick={() => setShowVideo(!showVideo)}
                  className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#2E68FF] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{showVideo ? 'Ẩn Video' : 'Hiện Video'}</span>
                </button>
              </div>

              {/* Video Iframe Container (Toggled ONLY by showVideo) */}
              {showVideo && (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md border border-slate-800 animate-in fade-in duration-150">
                  <iframe
                    ref={theoryVideoRef}
                    src={`https://www.youtube.com/embed/${course.youtubeVideoId}?start=${currentLesson?.startSeconds || 0}&autoplay=0&enablejsapi=1`}
                    title="Course Video Lesson"
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            {/* Current Lesson Badge & Title (ALWAYS VISIBLE) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#2E68FF]">
                  Bài {activeLessonIndex + 1} / {course.lessons.length}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  ⏱ {currentLesson?.videoStartTime} - {currentLesson?.videoEndTime}
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-[#1B1F2E] dark:text-white line-clamp-2">
                {currentLesson?.title}
              </h3>
            </div>

            {/* COMPACT COLLAPSIBLE LESSON SELECTOR (ALWAYS VISIBLE) */}
            <div className="rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setIsLessonsExpanded(!isLessonsExpanded)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-[#2E68FF] flex items-center justify-center font-bold text-xs shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Danh sách bài học ({course.lessons.length} bài)
                    </p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      Bài {activeLessonIndex + 1}: {currentLesson?.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <span className="text-[11px] font-bold text-[#2E68FF]">
                    {isLessonsExpanded ? 'Thu gọn' : 'Xem tất cả'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isLessonsExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Collapsible Lessons List Container */}
              {isLessonsExpanded && (
                <div className="p-3 pt-0 border-t border-[#E4E8F0] dark:border-[#334155] space-y-1.5 max-h-64 overflow-y-auto animate-in fade-in duration-150">
                  {course.lessons.map((les, lIdx) => (
                    <button
                      key={les.id || lIdx}
                      onClick={() => {
                        setActiveLessonIndex(lIdx);
                        setIsLessonsExpanded(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left font-semibold text-xs flex items-center justify-between transition-colors ${
                        lIdx === activeLessonIndex
                          ? 'bg-blue-50 dark:bg-blue-950 text-[#2E68FF] border border-blue-200 dark:border-blue-800'
                          : 'bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1B1F2E] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate pr-2">{lIdx + 1}. {les.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{les.videoStartTime}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Active Exercise / Theory Reader */}
          <div className="lg:col-span-7">
            {activeMode === 'theory' && currentLesson && (
              <TheoryReader
                lesson={currentLesson}
                courseId={course.id}
                lessonId={currentLesson.id}
                onPlaySegment={playTheorySegment}
                youtubeVideoId={course.youtubeVideoId}
                onCompleteTheory={() => setActiveMode('quiz')}
                onStartQuiz={() => setActiveMode('quiz')}
              />
            )}

            {activeMode === 'quiz' && currentLesson && (
              <QuizPlayer
                lesson={currentLesson}
                courseId={course.id}
                lessonId={currentLesson.id}
                onFinishQuiz={() => setActiveMode('dictation')}
              />
            )}

            {activeMode === 'writing' && (
              <WritingExercise
                courseId={course.id}
                lessonId={currentLesson?.id}
                progress={currentLesson?.modeProgress?.writing}
                prompt={currentLesson?.writingPrompt}
                onFinishWriting={() => setActiveMode('speaking')}
              />
            )}
          </div>

        </div>
      )}

      {/* FLOATING SCROLL TO TOP BUTTON — kept mounted so opacity/scale can transition
          smoothly on both show and hide, instead of popping in/out instantly. */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-40 p-3 rounded-full bg-[#2E68FF] hover:bg-blue-600 text-white shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center border border-blue-400/30 ${
          showScrollTop ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
        }`}
        title="Cuộn lên đầu trang"
        aria-hidden={!showScrollTop}
        tabIndex={showScrollTop ? 0 : -1}
      >
        <ArrowUp className="w-5 h-5 stroke-[2.5px]" />
      </button>

    </div>
  );
};
