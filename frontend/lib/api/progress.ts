/**
 * Progress API client
 */
import { apiClient } from './api-client';
import { StandardResponse } from '@/lib/types/api';

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

// Remove old response interfaces as we'll use StandardResponse

export const progressAPI = {
  /**
   * Start a lesson
   */
  async startLesson(lessonId: string): Promise<StandardResponse<Progress>> {
    return apiClient.post<StandardResponse<Progress>>(`/progress/lessons/${lessonId}/start`, {});
  },

  /**
   * Update video progress
   */
  async updateVideoProgress(
    lessonId: string,
    progressData: VideoProgressUpdate
  ): Promise<StandardResponse<Progress>> {
    return apiClient.put<StandardResponse<Progress>>(`/progress/lessons/${lessonId}/progress`, progressData);
  },

  /**
   * Complete a lesson
   */
  async completeLesson(lessonId: string): Promise<StandardResponse<Progress>> {
    return apiClient.post<StandardResponse<Progress>>(`/progress/lessons/${lessonId}/complete`, {});
  },

  /**
   * Get lesson progress
   */
  async getLessonProgress(lessonId: string): Promise<StandardResponse<Progress>> {
    return apiClient.get<StandardResponse<Progress>>(`/progress/lessons/${lessonId}/progress`);
  },

  /**
   * Get course progress
   */
  async getCourseProgress(courseId: string): Promise<StandardResponse<Progress[]>> {
    return apiClient.get<StandardResponse<Progress[]>>(`/progress/courses/${courseId}/progress`);
  },

  /**
   * Check course completion and trigger certificate generation
   */
  async checkCourseCompletion(courseId: string): Promise<StandardResponse<any>> {
    return apiClient.post<StandardResponse<any>>(`/progress/courses/${courseId}/check-completion`, {});
  },
};