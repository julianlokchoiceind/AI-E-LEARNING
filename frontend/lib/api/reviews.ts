/**
 * Review API client
 */
import { apiClient } from './api-client';
import { StandardResponse } from '@/lib/types/api';
import type {
  Review,
  ReviewStats,
  CourseRatingSummary,
  ReviewCreateData,
  ReviewUpdateData,
  ReviewVoteData,
  ReviewReportData,
  CreatorResponseData,
  ReviewSearchParams,
  ReviewListResponse
} from '@/lib/types/review';

export const reviewAPI = {
  /**
   * Create a review for a course
   */
  async createReview(courseId: string, data: ReviewCreateData): Promise<StandardResponse<Review>> {
    return apiClient.post<StandardResponse<Review>>(`/reviews/courses/${courseId}/reviews`, data);
  },

  /**
   * Get reviews for a course
   */
  async getCourseReviews(courseId: string, params?: ReviewSearchParams): Promise<StandardResponse<ReviewListResponse>> {
    const queryParams = new URLSearchParams();
    queryParams.append('course_id', courseId);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'course_id') {
          queryParams.append(key, String(value));
        }
      });
    }

    return apiClient.get<StandardResponse<ReviewListResponse>>(
      `/reviews/courses/${courseId}/reviews?${queryParams.toString()}`
    );
  },

  /**
   * Get review statistics for a course
   */
  async getCourseReviewStats(courseId: string): Promise<StandardResponse<ReviewStats>> {
    return apiClient.get<StandardResponse<ReviewStats>>(
      `/reviews/courses/${courseId}/reviews/stats`
    );
  },

  /**
   * Get reviews by a user
   */
  async getUserReviews(userId: string, params?: ReviewSearchParams): Promise<StandardResponse<Review[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    return apiClient.get<StandardResponse<Review[]>>(
      `/reviews/users/${userId}/reviews?${queryParams.toString()}`
    );
  },

  /**
   * Get my reviews
   */
  async getMyReviews(params?: ReviewSearchParams): Promise<StandardResponse<Review[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    return apiClient.get<StandardResponse<Review[]>>(
      `/reviews/my-reviews?${queryParams.toString()}`
    );
  },

  /**
   * Update a review
   */
  async updateReview(reviewId: string, data: ReviewUpdateData): Promise<StandardResponse<Review>> {
    return apiClient.put<StandardResponse<Review>>(`/reviews/${reviewId}`, data);
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<StandardResponse<any>> {
    return apiClient.delete<StandardResponse<any>>(`/reviews/${reviewId}`);
  },

  /**
   * Vote on a review
   */
  async voteReview(reviewId: string, data: ReviewVoteData): Promise<StandardResponse<any>> {
    return apiClient.post<StandardResponse<any>>(`/reviews/${reviewId}/vote`, data);
  },

  /**
   * Report a review
   */
  async reportReview(reviewId: string, data: ReviewReportData): Promise<StandardResponse<any>> {
    return apiClient.post<StandardResponse<any>>(`/reviews/${reviewId}/report`, data);
  },

  /**
   * Creator: Respond to a review
   */
  async respondToReview(reviewId: string, data: CreatorResponseData): Promise<StandardResponse<Review>> {
    return apiClient.post<StandardResponse<Review>>(`/reviews/${reviewId}/respond`, data);
  },

  /**
   * Get course rating summary
   */
  async getCourseSummary(courseId: string): Promise<StandardResponse<CourseRatingSummary>> {
    return apiClient.get<StandardResponse<CourseRatingSummary>>(
      `/reviews/courses/${courseId}/summary`
    );
  },

  /**
   * Admin: Get all reviews
   */
  async getAllReviews(params?: ReviewSearchParams): Promise<StandardResponse<Review[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    return apiClient.get<StandardResponse<Review[]>>(`/reviews/admin/all?${queryParams.toString()}`);
  },

  /**
   * Admin: Moderate a review
   */
  async moderateReview(
    reviewId: string,
    action: 'approve' | 'reject' | 'flag',
    reason?: string
  ): Promise<StandardResponse<Review>> {
    return apiClient.post<StandardResponse<Review>>(`/reviews/admin/${reviewId}/moderate`, {
      action,
      reason
    });
  },
};