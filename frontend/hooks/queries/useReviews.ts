'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { reviewAPI } from '@/lib/api/reviews';
import { ReviewCreateData, ReviewUpdateData } from '@/lib/types/review';

/**
 * React Query hooks for Course Reviews
 * Replaces manual API calls in CourseReviews component
 */

interface ReviewFilters {
  rating?: number;
  sort_by?: 'created_at' | 'rating' | 'helpful_count';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

/**
 * Get course reviews with filtering and pagination
 */
export function useCourseReviewsQuery(courseId: string, filters: ReviewFilters = {}) {
  return useApiQuery(
    ['course-reviews', courseId, filters],
    async () => {
      return reviewAPI.getCourseReviews(courseId, {
        rating: filters.rating,
        sort_by: filters.sort_by || 'created_at',
        sort_order: filters.sort_order || 'desc',
        page: filters.page || 1,
        per_page: filters.per_page || 10,
      });
    },
    {
      enabled: !!courseId,
      showToast: false, // Disable toasts for public course review pages - use graceful degradation
      ...getCacheConfig('COURSE_REVIEWS') // Course reviews - moderate freshness
    }
  );
}

/**
 * Create a new review for a course
 */
export function useCreateReview() {
  return useApiMutation(
    async ({ courseId, reviewData }: { courseId: string; reviewData: ReviewCreateData }) => {
      return reviewAPI.createReview(courseId, reviewData);
    },
    {
      invalidateQueries: [
        ['course-reviews'], // Refresh course reviews
      ],
      showToast: false, // Disable toasts for public review creation - use inline feedback
    }
  );
}

/**
 * Update an existing review
 */
export function useUpdateReview() {
  return useApiMutation(
    async ({ reviewId, reviewData }: { reviewId: string; reviewData: ReviewUpdateData }) => {
      return reviewAPI.updateReview(reviewId, {
        ...reviewData,
        edit_reason: 'Updated review'
      });
    },
    {
      invalidateQueries: [
        ['course-reviews'], // Refresh course reviews
      ],
      showToast: false, // Disable toasts for public review updates - use inline feedback
    }
  );
}

/**
 * Delete a review
 */
export function useDeleteReview() {
  return useApiMutation(
    async (reviewId: string) => {
      return reviewAPI.deleteReview(reviewId);
    },
    {
      invalidateQueries: [
        ['course-reviews'], // Refresh course reviews
      ],
      showToast: false, // Disable toasts for public review deletion - use inline feedback
    }
  );
}

/**
 * Vote on a review (helpful/unhelpful)
 */
export function useVoteReview() {
  return useApiMutation(
    async ({ reviewId, isHelpful }: { reviewId: string; isHelpful: boolean }) => {
      return reviewAPI.voteReview(reviewId, { is_helpful: isHelpful });
    },
    {
      invalidateQueries: [
        ['course-reviews'], // Refresh course reviews to show updated vote counts
      ],
      showToast: false, // Don't show automatic success toast, but errors are handled manually in component
    }
  );
}

/**
 * Report a review
 */
export function useReportReview() {
  return useApiMutation(
    async ({ reviewId, reason, details }: { reviewId: string; reason: string; details?: string }) => {
      return reviewAPI.reportReview(reviewId, { reason, details });
    },
    {
      operationName: 'report-review',
      invalidateQueries: [
        ['reviews'], // Refresh reviews to show reported status
      ],
      showToast: false, // Disable toasts for public review reporting - use inline feedback
    }
  );
}