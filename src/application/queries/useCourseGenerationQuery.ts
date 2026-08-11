import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Course } from '../../core/entities';
import {
  GenerateCourseClientData,
  GenerateCourseResult,
  GenerationStatus,
  generateCourse,
  getCourseDetail,
  getGenerationStatus,
} from '../../infrastructure/api/talk2meApi';

interface GenerateCourseVariables {
  youtubeUrl: string;
  category: string;
  difficulty: string;
  clientData?: GenerateCourseClientData;
}

export const useGenerateCourseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<GenerateCourseResult, Error, GenerateCourseVariables>({
    mutationFn: ({ youtubeUrl, category, difficulty, clientData }) =>
      generateCourse(youtubeUrl, category, difficulty, clientData),
    onSuccess: () => {
      // Kicked off (or resumed) a job — refresh the courses list so the new/retried
      // course shows up right away in its 'processing' state.
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

/** Polls the background generation job until it reaches a terminal status. */
export const useGenerationStatusQuery = (courseId: string | null, enabled: boolean) => {
  return useQuery<GenerationStatus>({
    queryKey: ['generation-status', courseId],
    queryFn: () => getGenerationStatus(courseId as string),
    enabled: enabled && !!courseId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 2000;
    },
  });
};

export const useCourseDetailQuery = (courseId: string | null, enabled = true) => {
  return useQuery<Course>({
    queryKey: ['course-detail', courseId],
    queryFn: () => getCourseDetail(courseId as string),
    enabled: enabled && !!courseId,
  });
};

export const useInvalidateCourses = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['courses'] });
};
