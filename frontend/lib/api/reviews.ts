/**
 * Review API client
 */
import { authFetch } from '@/lib/utils/auth-helpers';
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
    const response = await authFetch(`${API_BASE_URL}/reviews/courses/${courseId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create review');
    }

    const result = await response.json();
    return result.data;
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
   * Get a specific review
   */
  async getReview(reviewId: string): Promise<Review> {
    const response = await fetch(`${API_BASE_URL}/reviews/reviews/${reviewId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch review');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Update a review
   */
  async updateReview(reviewId: string, data: ReviewUpdateData): Promise<Review> {
    const response = await authFetch(`${API_BASE_URL}/reviews/reviews/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update review');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/reviews/reviews/${reviewId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete review');
    }
  },

  /**
   * Vote on review helpfulness
   */
  async voteReview(reviewId: string, data: ReviewVoteData): Promise<Review> {
    const response = await authFetch(`${API_BASE_URL}/reviews/reviews/${reviewId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to vote');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Report a review
   */
  async reportReview(reviewId: string, data: ReviewReportData): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/reviews/reviews/${reviewId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to report review');
    }
  },

  /**
   * Add instructor response to review
   */
  async respondToReview(reviewId: string, data: InstructorResponseData): Promise<Review> {
    const response = await authFetch(`${API_BASE_URL}/reviews/reviews/${reviewId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to add response');
    }

    const result = await response.json();
    return result.data;
  },
};