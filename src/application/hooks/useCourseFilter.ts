import { useMemo } from 'react';
import { useCourses } from './useCourses';

export function useCourseFilter() {
  const { courses, selectedCategory, searchQuery, visibleLimit } = useCourses();

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        c.categoryId === selectedCategory ||
        c.category.toLowerCase() === selectedCategory.toLowerCase();

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.channelName.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [courses, selectedCategory, searchQuery]);

  const visibleCourses = useMemo(() => {
    return filteredCourses.slice(0, visibleLimit);
  }, [filteredCourses, visibleLimit]);

  const hasMore = filteredCourses.length > visibleLimit;

  return {
    filteredCourses,
    visibleCourses,
    hasMore,
    totalCount: filteredCourses.length,
  };
}
