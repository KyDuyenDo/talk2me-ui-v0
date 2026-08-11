import React, { useState } from 'react';
import { Course } from '../../../core/entities';
import { Play, BookOpen, CheckCircle, Clock, Loader2, AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { useGenerateCourseMutation } from '../../../application/queries/useCourseGenerationQuery';
import { useDeleteCourseMutation } from '../../../application/queries/useCoursesQuery';
import { useAuth } from '../../../application/hooks/useAuth';

interface CourseCardProps {
  course: Course;
  onSelectCourse: (course: Course) => void;
  onDeleteCourse?: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onSelectCourse, onDeleteCourse }) => {
  const { user } = useAuth();
  const [retryError, setRetryError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const retryMutation = useGenerateCourseMutation();
  const deleteMutation = useDeleteCourseMutation();

  // Only allow deletion if user is logged in AND owns the course (or it's in their My Courses library)
  const canDelete = Boolean(user && (onDeleteCourse || (course.userId && course.userId === user.id)));

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryError('');
    try {
      await retryMutation.mutateAsync({
        youtubeUrl: course.youtubeUrl,
        category: course.category,
        difficulty: course.difficulty,
      });
    } catch (err: any) {
      setRetryError(err.message || 'Không thể tạo lại khoá học.');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }
    try {
      if (onDeleteCourse) {
        onDeleteCourse(course);
      } else {
        await deleteMutation.mutateAsync(course.id);
      }
    } catch (err) {
      console.error('Delete course failed:', err);
    }
  };

  if (course.creationStatus === 'processing') {
    return (
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-4 border border-[#E4E8F0] dark:border-[#334155] shadow-sm flex flex-col justify-between relative group">
        <div>
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover grayscale" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>

            {/* Trash button */}
            {canDelete && (
              <button
                onClick={handleDelete}
                onMouseLeave={() => setShowConfirmDelete(false)}
                className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1 z-20 ${
                  showConfirmDelete
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-white/80 dark:bg-slate-900/80 hover:bg-red-500 hover:text-white text-slate-600 dark:text-slate-300 backdrop-blur-xs'
                }`}
                title="Xóa khóa học này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {showConfirmDelete && <span>Xác nhận xóa?</span>}
              </button>
            )}
          </div>
          <h3 className="font-bold text-base text-[#1B1F2E] dark:text-white line-clamp-2 mb-3 px-1 leading-snug">
            {course.title}
          </h3>
        </div>
        <div className="space-y-1.5 px-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#2E68FF]">
            <span>Đang tạo khoá học...</span>
            <span>{course.progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#F1F4F9] dark:bg-[#273449] rounded-full overflow-hidden">
            <div className="h-full bg-[#2E68FF] transition-all" style={{ width: `${course.progressPercent}%` }} />
          </div>
        </div>
      </div>
    );
  }

  if (course.creationStatus === 'failed') {
    return (
      <div className="bg-red-50/60 dark:bg-red-950/20 rounded-3xl p-4 border border-red-200 dark:border-red-900/60 shadow-sm flex flex-col justify-between relative group">
        <div>
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover grayscale opacity-70" />
            <div className="absolute inset-0 bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>

            {/* Trash button */}
            {canDelete && (
              <button
                onClick={handleDelete}
                onMouseLeave={() => setShowConfirmDelete(false)}
                className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1 z-20 ${
                  showConfirmDelete
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-white/80 dark:bg-slate-900/80 hover:bg-red-500 hover:text-white text-slate-600 dark:text-slate-300 backdrop-blur-xs'
                }`}
                title="Xóa khóa học này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {showConfirmDelete && <span>Xác nhận xóa?</span>}
              </button>
            )}
          </div>
          <h3 className="font-bold text-base text-[#1B1F2E] dark:text-white line-clamp-2 mb-2 px-1 leading-snug">
            {course.title}
          </h3>
          <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold px-1 line-clamp-2 mb-3">
            Tạo thất bại{course.generationError ? `: ${course.generationError}` : ''}
          </p>
        </div>
        {retryError && (
          <p className="text-[10px] text-red-600 dark:text-red-400 px-1 mb-2 line-clamp-2">{retryError}</p>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRetry}
            disabled={retryMutation.isPending}
            className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-xs tracking-wide uppercase transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {retryMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            <span>Tạo lại</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelectCourse(course)}
      className="group bg-white dark:bg-[#1E293B] rounded-3xl p-4 border border-[#E4E8F0] dark:border-[#334155] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Thumbnail & Badge */}
        <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Overlay Play Button on Hover */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white text-[#2E68FF] flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 fill-[#2E68FF] ml-0.5" />
            </div>
          </div>

          {/* Top Left Trash Button */}
          {canDelete && (
            <button
              onClick={handleDelete}
              onMouseLeave={() => setShowConfirmDelete(false)}
              className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1 z-20 ${
                showConfirmDelete
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-white/80 dark:bg-slate-900/80 hover:bg-red-500 hover:text-white text-slate-600 dark:text-slate-300 backdrop-blur-xs'
              }`}
              title="Xóa khóa học này"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {showConfirmDelete && <span>Xác nhận xóa?</span>}
            </button>
          )}

          {/* Top Gold Badge Tag for Topic/Subject */}
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[11px] shadow-md tracking-tight">
            {course.category}
          </div>

          {/* Progress Bar overlay if started */}
          {course.progressPercent > 0 && (
            <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/40">
              <div
                className="h-full bg-[#2E68FF] transition-all"
                style={{ width: `${course.progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Channel & Duration Row */}
        <div className="flex items-center justify-between text-xs font-semibold text-[#5A6478] dark:text-[#CBD5E1] mb-2 px-1">
          <span className="text-[#5A6478] dark:text-[#CBD5E1] font-medium truncate max-w-[170px]">
            {course.channelName || 'YouTube Course'}
          </span>
          <div className="flex items-center gap-1 shrink-0 font-medium text-slate-500 dark:text-slate-400 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-[#2E68FF]" />
            <span>{course.durationText || '15:30'}</span>
          </div>
        </div>

        {/* Course Title */}
        <h3 className="font-bold text-base text-[#1B1F2E] dark:text-white line-clamp-2 mb-4 group-hover:text-[#2E68FF] transition-colors px-1 leading-snug">
          {course.title}
        </h3>
      </div>

      {/* Action Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelectCourse(course);
        }}
        className="w-full py-3 rounded-2xl bg-[#F1F4F9] dark:bg-[#273449] hover:bg-[#2E68FF] hover:text-white dark:hover:bg-[#2E68FF] text-[#1B1F2E] dark:text-white font-bold text-xs tracking-wide uppercase transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
      >
        {course.progressPercent > 0 ? (
          <>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Tiếp tục học ({course.progressPercent}%)</span>
          </>
        ) : (
          <>
            <BookOpen className="w-4 h-4" />
            <span>Học ngay</span>
          </>
        )}
      </button>
    </div>
  );
};
