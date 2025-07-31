'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { api } from '@/lib/api/api-client';
import { StandardResponse } from '@/lib/types/api';

/**
 * COURSE CHAPTERS WITH LESSONS - Course structure for navigation
 * Critical: Learning navigation and progress tracking
 * Used by: Course detail page (/courses/[id]/page.tsx)
 */
export function useCourseChaptersQuery(courseId: string) {
  return useApiQuery(
    ['course-chapters', courseId],
    async (): Promise<StandardResponse<any>> => {
      // Use public endpoint that works without authentication (for preview mode)
      const response = await api.get(`/courses/${courseId}/chapters-with-lessons-public`, { requireAuth: false });
      
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      // Return the full StandardResponse
      return response;
    },
    {
      enabled: !!courseId,
      ...getCacheConfig('COURSE_STRUCTURE') // Course structure - moderate freshness
    }
  );
}

/**
 * COURSE PROGRESS - Aggregate course progress for ProgressTracker
 * Critical: Progress tracking for course completion overview
 * Used by: ProgressTracker component
 */
export function useCourseProgressQuery(courseId: string, enabled: boolean = true) {
  return useApiQuery(
    ['course-progress', courseId],
    async (): Promise<StandardResponse<any>> => {
      return await api.get(`/progress/courses/${courseId}/overview`, { requireAuth: true });
    },
    {
      enabled: enabled && !!courseId,
      ...getCacheConfig('COURSE_PROGRESS_OVERVIEW') // Course progress overview - fresh data
    }
  );
}

/**
 * Submit quiz answers
 * Used by: QuizComponent
 */
export function useSubmitQuiz() {
  return useApiMutation(
    async ({ lessonId, answers }: { lessonId: string; answers: any[] }) => {
      return api.post<StandardResponse<any>>(`/lessons/${lessonId}/quiz/submit`, { answers });
    },
    {
      invalidateQueries: [
        ['quiz-progress'], // Refresh quiz progress
        ['lesson-progress'], // Refresh lesson progress
        ['course-progress'], // Update overall course progress
        ['student-dashboard'], // Update dashboard stats
        ['course-chapters'], // May unlock next lesson
      ],
    }
  );
}