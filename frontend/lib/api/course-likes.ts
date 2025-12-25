/**
 * Course Reaction API client (YouTube-style like/dislike)
 */
import { apiClient } from './api-client';
import { StandardResponse } from '@/lib/types/api';
import type {
  CourseReactionStatus,
  CourseReactionToggleResponse,
  ReactionType
} from '@/lib/types/course-like';

export const courseReactionAPI = {
  /**
   * Toggle reaction (like/dislike) for a course
   * Requires authentication
   */
  async toggleReaction(
    courseId: string,
    reactionType: ReactionType
  ): Promise<StandardResponse<CourseReactionToggleResponse>> {
    return apiClient.post<StandardResponse<CourseReactionToggleResponse>>(
      `/likes/courses/${courseId}/react`,
      { reaction_type: reactionType }
    );
  },

  /**
   * Get reaction status and counts for a course
   * Works for both authenticated and unauthenticated users
   */
  async getReactionStatus(courseId: string): Promise<StandardResponse<CourseReactionStatus>> {
    return apiClient.get<StandardResponse<CourseReactionStatus>>(
      `/likes/courses/${courseId}/react`
    );
  },
};

// Keep alias for backward compatibility
export const courseLikeAPI = courseReactionAPI;
