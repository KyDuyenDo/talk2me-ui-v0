import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Course } from '../../core/entities';
import { INITIAL_COURSES } from '../../infrastructure/data/mockCourses';
import { getCourses } from '../../infrastructure/api/talk2meApi';

export const useCoursesQuery = (category?: string, query?: string) => {
  return useQuery({
    queryKey: ['courses', category || 'all', query || ''],
    queryFn: async (): Promise<Course[]> => {
      try {
        const apiCourses = await getCourses(category, query);
        if (Array.isArray(apiCourses) && apiCourses.length > 0) {
          return apiCourses;
        }
      } catch (err) {
        console.warn('API courses query failed, using local courses fallback:', err);
      }

      // Fallback to local storage or mock courses
      const saved = localStorage.getItem('talk2me_courses');
      const localCourses: Course[] = saved ? JSON.parse(saved) : INITIAL_COURSES;

      return localCourses.filter((c) => {
        const matchesCategory =
          !category || category === 'all' || c.categoryId === category || c.category.toLowerCase() === category.toLowerCase();
        const matchesQuery =
          !query || c.title.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase());
        return matchesCategory && matchesQuery;
      });
    },
    // Any course still being generated? Keep polling so its card updates live without a
    // manual refresh — stop once nothing in the current data is 'processing' anymore.
    refetchInterval: (q) => {
      const data = q.state.data;
      const hasProcessing = Array.isArray(data) && data.some((c) => c.creationStatus === 'processing');
      return hasProcessing ? 4000 : false;
    },
  });
};

export const useAddCourseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCourse: Course) => {
      const saved = localStorage.getItem('talk2me_courses');
      const existing: Course[] = saved ? JSON.parse(saved) : INITIAL_COURSES;
      const updated = [newCourse, ...existing];
      localStorage.setItem('talk2me_courses', JSON.stringify(updated));
      return newCourse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useDeleteCourseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      // 1. Call API delete
      const api = await import('../../infrastructure/api/talk2meApi');
      await api.deleteCourse(courseId);

      // 2. Clean up localStorage fallback
      const saved = localStorage.getItem('talk2me_courses');
      if (saved) {
        const existing: Course[] = JSON.parse(saved);
        const updated = existing.filter((c) => c.id !== courseId);
        localStorage.setItem('talk2me_courses', JSON.stringify(updated));
      }
      return courseId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

