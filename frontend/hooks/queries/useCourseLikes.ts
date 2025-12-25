'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { courseReactionAPI } from '@/lib/api/course-likes';
import type { ReactionType } from '@/lib/types/course-like';

/**
 * React Query hooks for Course Reactions (YouTube-style like/dislike)
 */

/**
 * Get reaction status for a course
 * Returns user_reaction (like/dislike/null), like_count, and dislike_count
 */
export function useCourseReactionStatus(courseId: string) {
  return useApiQuery(
    ['course-reaction-status', courseId],
    async () => {
      return courseReactionAPI.getReactionStatus(courseId);
    },
    {
      enabled: !!courseId,
      showToast: false,
      ...getCacheConfig('COURSE_REVIEWS'),
    }
  );
}

/**
 * Toggle reaction for a course (like/dislike)
 * Requires user to be authenticated
 */
export function useToggleCourseReaction() {
  return useApiMutation(
    async ({ courseId, reactionType }: { courseId: string; reactionType: ReactionType }) => {
      return courseReactionAPI.toggleReaction(courseId, reactionType);
    },
    {
      invalidateQueries: [
        ['course-reaction-status'],
      ],
      showToast: false,
    }
  );
}

// Keep aliases for backward compatibility
export const useCourseLikeStatus = useCourseReactionStatus;
export const useToggleCourseLike = useToggleCourseReaction;
