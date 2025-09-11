'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { api } from '@/lib/api/api-client';
import { StandardResponse } from '@/lib/types/api';

/**
 * Progress-related React Query hooks
 * Domain: User progress tracking and course completion
 */

/**
 * COURSE PROGRESS - Aggregate course progress for ProgressTracker
 * Critical: Progress tracking for course completion overview
 * Used by: ProgressTracker component
 * Migrated from: useLearning.ts
 */
export function useCourseProgressQuery(courseId: string, enabled: boolean = true) {
  return useApiQuery(
    ['course-progress', courseId],
    async (): Promise<StandardResponse<any>> => {
      return await api.get(`/progress/courses/${courseId}/overview`, { requireAuth: true });
    },
    {
      enabled: enabled && !!courseId,
      showToast: false, // Disable toasts for public learning progress tracking - use graceful degradation
      ...getCacheConfig('COURSE_PROGRESS_OVERVIEW') // Course progress overview - fresh data
    }
  );
}

// Future progress-related hooks can be added here:
// - useUpdateProgress
// - useLessonProgress
// - useProgressStatistics
// - etc.