/**
 * Review API client
 */
import { apiClient } from './api-client';
import type {
  Review,
  ReviewStats,
  CourseRatingSummary,
  ReviewCreateData,
  ReviewUpdateData,
  ReviewVoteData,
  ReviewReportData,
  InstructorResponseData,
  ReviewSearchParams
} from '@/lib/types/review';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const reviewAPI = {
  /**
   * Create a review for a course
   */
  async createReview(courseId: string, data: ReviewCreateData): Promise<Review> {
    return apiClient.post(`${API_BASE_URL}/reviews/courses/${courseId}/reviews`, data);
  },

  /**
   * Get reviews for a course
   */
  async getCourseReviews(courseId: string, params?: ReviewSearchParams) {
    const queryParams = new URLSearchParams();
    queryParams.append('course_id', courseId);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'course_id') {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/reviews/courses/${courseId}/reviews?${queryParams.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch reviews');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get review statistics for a course
   */
  async getCourseReviewStats(courseId: string): Promise<ReviewStats> {
    const response = await fetch(`${API_BASE_URL}/reviews/courses/${courseId}/reviews/stats`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch review stats');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get reviews by a user
   */
  async getUserReviews(userId: string, params?: ReviewSearchParams) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/reviews/users/${userId}/reviews?${queryParams.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch user reviews');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get my reviews
   */
  async getMyReviews(params?: ReviewSearchParams) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    return apiClient.get(
      `${API_BASE_URL}/reviews/my-reviews?${queryParams.toString()}`
    );
  },

  /**
   * Update a review
   */
  async updateReview(reviewId: string, data: ReviewUpdateData): Promise<Review> {
    return apiClient.put(`${API_BASE_URL}/reviews/${reviewId}`, data);
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<void> {
    await apiClient.delete(`${API_BASE_URL}/reviews/${reviewId}`);
  },

  /**
   * Vote on a review
   */
  async voteReview(reviewId: string, data: ReviewVoteData): Promise<void> {
    await apiClient.post(`${API_BASE_URL}/reviews/${reviewId}/vote`, data);
  },

  /**
   * Report a review
   */
  async reportReview(reviewId: string, data: ReviewReportData): Promise<void> {
    await apiClient.post(`${API_BASE_URL}/reviews/${reviewId}/report`, data);
  },

  /**
   * Instructor: Respond to a review
   */
  async respondToReview(reviewId: string, data: InstructorResponseData): Promise<Review> {
    return apiClient.post(`${API_BASE_URL}/reviews/${reviewId}/respond`, data);
  },

  /**
   * Get course rating summary
   */
  async getCourseSummary(courseId: string): Promise<CourseRatingSummary> {
    const response = await fetch(`${API_BASE_URL}/reviews/courses/${courseId}/summary`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch course summary');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Admin: Get all reviews
   */
  async getAllReviews(params?: ReviewSearchParams) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    return apiClient.get(`${API_BASE_URL}/reviews/admin/all?${queryParams.toString()}`);
  },

  /**
   * Admin: Moderate a review
   */
  async moderateReview(
    reviewId: string,
    action: 'approve' | 'reject' | 'flag',
    reason?: string
  ): Promise<Review> {
    return apiClient.post(`${API_BASE_URL}/reviews/admin/${reviewId}/moderate`, {
      action,
      reason
    });
  },
};