import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Course, Category, LearningModeType } from '../../core/entities';
import { LocalCourseRepository } from '../../infrastructure/storage/LocalCourseRepository';
import { INITIAL_COURSES } from '../../infrastructure/data/mockCourses';
import {
  getCategories as fetchCategories,
  createCategory as createCategoryApi,
  ApiCategory,
} from '../../infrastructure/api/talk2meApi';

const courseRepo = new LocalCourseRepository();

/** The backend only stores id/name/color/createdAt — badgeBg/badgeText are display-only and
 * derived here, always the same blue used for every user-created category today (matches
 * the fixed styling the old localStorage-based createCategory always applied). */
const toCategory = (api: ApiCategory): Category => ({
  id: api.id,
  name: api.name,
  color: api.color,
  badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
  badgeText: 'text-blue-600 dark:text-blue-400',
});

interface CourseContextType {
  categories: Category[];
  createCategory: (name: string) => void;
  publicCourses: Course[];
  userCourses: Course[];
  courses: Course[];
  selectedCategory: string;
  searchQuery: string;
  visibleLimit: number;
  activeCourse: Course | null;
  activeLessonIndex: number;
  activeMode: LearningModeType;
  isCreateModalOpen: boolean;
  prefillUrl: string;
  setSelectedCategory: (cat: string) => void;
  setSearchQuery: (query: string) => void;
  setVisibleLimit: (limit: number | ((prev: number) => number)) => void;
  setActiveCourse: (course: Course | null) => void;
  setActiveLessonIndex: (index: number) => void;
  setActiveMode: (mode: LearningModeType) => void;
  setIsCreateModalOpen: (open: boolean) => void;
  setPrefillUrl: (url: string) => void;
  addCourse: (newCourse: Course) => void;
  selectCourse: (course: Course, lessonIndex?: number) => void;
  clearActiveCourse: () => void;
  openCreateModal: (url?: string) => void;
  closeCreateModal: () => void;
}

export const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const CourseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [publicCourses] = useState<Course[]>(INITIAL_COURSES);
  
  // User's own created/saved courses
  const [userCourses, setUserCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem('talk2me_user_created_courses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(6);

  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [activeMode, setActiveMode] = useState<LearningModeType>('theory');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [prefillUrl, setPrefillUrl] = useState<string>('');

  // Categories are per-user, server-backed (see app/api/v1/categories.py) — a logged-out
  // visitor gets a 401 here, which we swallow to an empty list; App.tsx already falls back
  // to INITIAL_CATEGORIES (the old hardcoded set) whenever `categories` is empty, so guest
  // browsing keeps working exactly as before.
  useEffect(() => {
    fetchCategories()
      .then((apiCats) => setCategories(apiCats.map(toCategory)))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    localStorage.setItem('talk2me_user_created_courses', JSON.stringify(userCourses));
  }, [userCourses]);

  const addCourse = (newCourse: Course) => {
    setUserCourses((prev) => [newCourse, ...prev]);
    setActiveCourse(newCourse);
    setActiveLessonIndex(0);
    setActiveMode('theory');
  };

  const createCategory = (name: string) => {
    createCategoryApi({ name })
      .then((created) => setCategories((prev) => [...prev, toCategory(created)]))
      .catch((err) => console.warn('Không tạo được danh mục:', err));
  };

  const selectCourse = (course: Course, lessonIndex = 0) => {
    setActiveCourse(course);
    setActiveLessonIndex(lessonIndex);
    setActiveMode('theory');
  };

  const clearActiveCourse = () => {
    setActiveCourse(null);
  };

  const openCreateModal = (url?: string) => {
    if (url) setPrefillUrl(url);
    else setPrefillUrl('');
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <CourseContext.Provider
      value={{
        categories,
        publicCourses,
        userCourses,
        courses: userCourses,
        selectedCategory,
        searchQuery,
        visibleLimit,
        activeCourse,
        activeLessonIndex,
        activeMode,
        isCreateModalOpen,
        prefillUrl,
        setSelectedCategory,
        setSearchQuery,
        setVisibleLimit,
        setActiveCourse,
        setActiveLessonIndex,
        setActiveMode,
        setIsCreateModalOpen,
        setPrefillUrl,
        addCourse,
        createCategory,
        selectCourse,
        clearActiveCourse,
        openCreateModal,
        closeCreateModal,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};
