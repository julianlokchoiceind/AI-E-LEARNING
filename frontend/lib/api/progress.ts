/**
 * Progress API client
 */
import { authFetch } from '@/lib/utils/auth-helpers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface VideoProgressUpdate {
  watch_percentage: number;
  current_position: number;
}

export interface Progress {
  _id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  video_progress: {
    watch_percentage: number;
    current_position: number;
    total_watch_time: number;
    is_completed: boolean;
    completed_at?: string;
  };
  is_unlocked: boolean;
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
  last_accessed: string;
  created_at: string;
  updated_at: string;
}

export interface ProgressResponse {
  success: boolean;
  data: Progress;
  message: string;
}

export interface ProgressListResponse {
  success: boolean;
  data: Progress[];
  message: string;
}

export interface CourseCompletionResponse {
  success: boolean;
  data: any; // Certificate data if successful
  message: string;
}

export const progressAPI = {
  /**
   * Start a lesson
   */
  async startLesson(lessonId: string): Promise<Progress> {
    const response = await authFetch(`${API_BASE_URL}/progress/lessons/${lessonId}/start`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to start lesson');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Update video progress
   */
  async updateVideoProgress(
    lessonId: string,
    progressData: VideoProgressUpdate
  ): Promise<Progress> {
    const response = await authFetch(`${API_BASE_URL}/progress/lessons/${lessonId}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(progressData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update progress');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Complete a lesson
   */
  async completeLesson(lessonId: string): Promise<Progress> {
    const response = await authFetch(`${API_BASE_URL}/progress/lessons/${lessonId}/complete`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to complete lesson');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get lesson progress
   */
  async getLessonProgress(lessonId: string): Promise<Progress> {
    const response = await authFetch(`${API_BASE_URL}/progress/lessons/${lessonId}/progress`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch lesson progress');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get course progress
   */
  async getCourseProgress(courseId: string): Promise<Progress[]> {
    const response = await authFetch(`${API_BASE_URL}/progress/courses/${courseId}/progress`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch course progress');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Check course completion and trigger certificate generation
   */
  async checkCourseCompletion(courseId: string): Promise<CourseCompletionResponse> {
    const response = await authFetch(
      `${API_BASE_URL}/progress/courses/${courseId}/check-completion`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to check course completion');
    }

    return response.json();
  },
};