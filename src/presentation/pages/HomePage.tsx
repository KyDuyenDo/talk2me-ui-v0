import React from 'react';
import { Course, Category } from '../../core/entities';
import { HeroSection, CategoryFilter, CourseCard } from '../components/course';
import { StatsRibbon } from '../components/analytics';
import { FAQSection } from '../components/common';

interface HomePageProps {
  courses: Course[];
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectCourse: (courseId: string) => void;
  onCreateCourseClick: () => void;
  onExploreCourses: () => void;
  onExploreFlashcards: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  courses,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onSelectCourse,
  onCreateCourseClick,
  onExploreCourses,
  onExploreFlashcards,
}) => {
  return (
    <div className="space-y-8 lg:space-y-12">
      {/* Hero Header */}
      <HeroSection
        onOpenCreateModal={onCreateCourseClick}
        onExploreCourses={onExploreCourses}
        onExploreFlashcards={onExploreFlashcards}
      />

      {/* Courses Catalog Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Category Pills & Search */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        {/* Course Cards Grid */}
        {courses.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1E293B] border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-sm text-slate-500 font-medium">Không tìm thấy khóa học nào phù hợp.</p>
            <button
              onClick={onCreateCourseClick}
              className="px-6 py-2.5 rounded-full bg-[#2E68FF] text-white text-xs font-extrabold"
            >
              Tạo khóa học mới bằng AI ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onSelectCourse={() => onSelectCourse(course.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Stats Ribbon */}
      <StatsRibbon />

      {/* FAQ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FAQSection />
      </div>
    </div>
  );
};
