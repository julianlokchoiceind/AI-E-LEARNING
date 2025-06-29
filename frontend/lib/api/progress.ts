/**
 * Progress API client
 */
import { apiClient } from './api-client';

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
    const response = await apiClient.post<{ data: Progress }>(`/progress/lessons/${lessonId}/start`);
    return response.data;
  },

  /**
   * Update video progress
   */
  async updateVideoProgress(
    lessonId: string,
    progressData: VideoProgressUpdate
  ): Promise<Progress> {
    const response = await apiClient.put<{ data: Progress }>(`/progress/lessons/${lessonId}/progress`, progressData);
    return response.data;
  },

  /**
   * Complete a lesson
   */
  async completeLesson(lessonId: string): Promise<Progress> {
    const response = await apiClient.post<{ data: Progress }>(`/progress/lessons/${lessonId}/complete`);
    return response.data;
  },

  /**
   * Get lesson progress
   */
  async getLessonProgress(lessonId: string): Promise<Progress> {
    const response = await apiClient.get<{ data: Progress }>(`/progress/lessons/${lessonId}/progress`);
    return response.data;
  },

  /**
   * Get course progress
   */
  async getCourseProgress(courseId: string): Promise<Progress[]> {
    const response = await apiClient.get<{ data: Progress[] }>(`/progress/courses/${courseId}/progress`);
    return response.data;
  },

  /**
   * Check course completion and trigger certificate generation
   */
  async checkCourseCompletion(courseId: string): Promise<CourseCompletionResponse> {
    const response = await apiClient.post<CourseCompletionResponse>(`/progress/courses/${courseId}/check-completion`);
    return response;
  },
};