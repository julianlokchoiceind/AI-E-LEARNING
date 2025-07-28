'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { api } from '@/lib/api/api-client';
import { StandardResponse } from '@/lib/types/api';
import { 
  getLesson
} from '@/lib/api/lessons';

// Types for learning queries
interface VideoProgressUpdate {
  lessonId: string;
  progress: {
    watchPercentage: number;
    currentPosition: number;
    totalWatchTime: number;
  };
}

interface QuizSubmission {
  quizId: string;
  lessonId: string;
  answers: number[];
  timeSpent: number;
}

interface LessonNavigation {
  courseId: string;
  currentLessonId: string;
}

/**
 * LESSON CONTENT - Core learning interface (LEARNING INTERFACE)
 * Critical: Primary learning experience for learning page
 */
export function useLessonQuery(lessonId: string, enabled: boolean = true, preview: boolean = false) {
  return useApiQuery(
    ['lesson', lessonId, preview],
    async (): Promise<StandardResponse<any>> => {
      // Add preview parameter to URL if in preview mode
      const url = preview ? `/lessons/${lessonId}?preview=true` : `/lessons/${lessonId}`;
      return api.get(url, { requireAuth: !preview });
    },
    {
      enabled: enabled && !!lessonId,
      ...getCacheConfig('LESSON_CONTENT') // Lesson content - moderate freshness
    }
  );
}

// Note: Removed hooks that used non-existent API functions
// The learning interface now uses direct API calls via React Query

/**
 * LESSON PROGRESS - Individual lesson progress tracking (LEARNING INTERFACE)
 * Critical: Progress tracking for learning interface
 */
export function useLessonProgressQuery(lessonId: string, enabled: boolean = true) {
  return useApiQuery(
    ['lesson-progress', lessonId],
    async (): Promise<StandardResponse<any>> => {
      try {
        const response = await api.get(`/progress/lessons/${lessonId}/progress`, { requireAuth: true });
        return response;
      } catch (error: any) {
        // If no progress exists, return null (this is normal for first-time access)
        if (error.statusCode === 404 || error.type === 'NOT_FOUND') {
          return { success: true, data: null, message: 'No progress found' };
        }
        // For other errors, still return a valid response structure
        console.warn('Error fetching lesson progress:', error);
        return { success: false, data: null, message: error.message || 'Failed to fetch progress' };
      }
    },
    {
      enabled: enabled && !!lessonId,
      retry: (failureCount, error: any) => {
        // Don't retry on 404 errors
        if (error?.statusCode === 404) return false;
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      ...getCacheConfig('LESSON_PROGRESS') // Lesson progress - fresh data
    }
  );
}

// Note: Course navigation is handled in the learning page component
// using chapter data from useCourseChaptersQuery

/**
 * COURSE CHAPTERS WITH LESSONS - Course structure for navigation
 * Critical: Learning navigation and progress tracking
 */
interface ChaptersResponse {
  chapters: any[];
  total: number;
}

export function useCourseChaptersQuery(courseId: string) {
  return useApiQuery<ChaptersResponse>(
    ['course-chapters', courseId],
    async (): Promise<StandardResponse<ChaptersResponse>> => {
      // Use public endpoint that works without authentication (for preview mode)
      const response: StandardResponse<ChaptersResponse> = await api.get(`/courses/${courseId}/chapters-with-lessons-public`, { requireAuth: false });
      
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      // Return the full StandardResponse
      return response;
    },
    {
      enabled: !!courseId,
      ...getCacheConfig('COURSE_STRUCTURE') // Course structure - moderate freshness
    }
  );
}

/**
 * START LESSON - Initialize lesson progress
 * Critical: Sequential learning flow
 */
export function useStartLesson() {
  return useApiMutation(
    async ({ lessonId }: { lessonId: string }): Promise<StandardResponse<any>> => {
      return await api.post(`/progress/lessons/${lessonId}/start`, {}, { requireAuth: true });
    },
    {
      operationName: 'start-lesson',
      invalidateQueries: [
        ['lesson-progress'], // Refresh lesson progress
        ['course-chapters'], // Update lesson unlock status in navigation
        ['student-dashboard'], // Update dashboard learning stats
      ],
      showToast: false, // Don't show toast for lesson start
    }
  );
}

/**
 * UPDATE LESSON PROGRESS - Real-time video progress updates
 * Critical: Progress tracking during video playback
 */
export function useUpdateLessonProgress() {
  return useApiMutation(
    async ({ lessonId, progress }: VideoProgressUpdate): Promise<StandardResponse<any>> => {
      return await api.put(`/progress/lessons/${lessonId}/progress`, {
        watch_percentage: progress.watchPercentage,
        current_position: progress.currentPosition,
        total_watch_time: progress.totalWatchTime,
      }, { requireAuth: true });
    },
    {
      operationName: 'update-lesson-progress',
      invalidateQueries: [
        ['lesson-progress'], // Refresh lesson progress
        // Ultra-think: Don't invalidate course-progress on every update (too frequent)
        // Only invalidate when progress is significant (e.g., 25%, 50%, 75%, 100%)
      ],
      showToast: false, // Don't show toast for progress updates (too frequent)
    }
  );
}

/**
 * MARK LESSON COMPLETE - Complete lesson with optional quiz score
 * Critical: Sequential learning progression
 */
export function useMarkLessonComplete() {
  return useApiMutation(
    async ({ lessonId, quizScore }: { lessonId: string; quizScore?: number }): Promise<StandardResponse<any>> => {
      return await api.post(`/progress/lessons/${lessonId}/complete`, {
        quiz_score: quizScore
      }, { requireAuth: true });
    },
    {
      operationName: 'mark-lesson-complete',
      invalidateQueries: [
        ['lesson-progress'], // Refresh lesson progress
        ['lesson-progress-batch'], // Refresh batch progress
        ['course-progress'], // Refresh course progress
        ['next-lesson'], // Refresh next lesson availability
        ['student-dashboard'], // Update dashboard
        ['my-courses'], // Update course list
        ['course-chapters'], // Update lesson unlock status
        ['enrollment'], // Update enrollment progress
      ],
    }
  );
}

/**
 * BATCH LESSON PROGRESS - Efficient progress fetching for multiple lessons
 * Critical: Replaces manual fetchAllLessonsProgress in lesson page
 * This eliminates multiple individual API calls with a single batch request
 */
export function useBatchLessonProgressQuery(lessonIds: string[], enabled: boolean = true, preview: boolean = false) {
  return useApiQuery(
    ['lesson-progress-batch', lessonIds.sort().join(','), preview],
    async (): Promise<StandardResponse<any[]>> => {
      if (lessonIds.length === 0) {
        return { success: true, data: [], message: 'No lessons to fetch progress for' };
      }

      // Batch fetch all lesson progress in a single request
      try {
        const params = preview ? '?preview=true' : '';
        const response: StandardResponse<any[]> = await api.post(`/progress/lessons/batch${params}`, {
          lesson_ids: lessonIds
        }, { requireAuth: !preview });

        if (!response.success) {
          throw new Error(response.message || 'Something went wrong');
        }

        return response;
      } catch (error: any) {
        // If batch endpoint doesn't exist or user is in preview mode, return empty progress
        if (preview) {
          return { success: true, data: [], message: 'No progress in preview mode' };
        }
        
        // If batch endpoint doesn't exist (400/404), fall back to individual queries
        if (error.statusCode === 400 || error.statusCode === 404) {
          console.warn('Batch progress endpoint not available, falling back to individual queries');
          
          // Fetch progress for each lesson individually
          const progressPromises = lessonIds.map(async (lessonId) => {
            try {
              const response = await api.get<StandardResponse<any>>(`/progress/lessons/${lessonId}/progress`, { requireAuth: true });
              if (response.success && response.data) {
                return response.data;
              }
              return null;
            } catch (err: any) {
              // If no progress exists for this lesson, that's okay
              if (err.statusCode === 404 || err.type === 'NOT_FOUND') {
                return null;
              }
              // For other errors, log but don't throw (allow other lessons to continue)
              console.warn(`Error fetching progress for lesson ${lessonId}:`, err);
              return null;
            }
          });
          
          const results = await Promise.all(progressPromises);
          const validProgress = results.filter((p: any) => p !== null);
          
          return { success: true, data: validProgress, message: 'Fetched individual progress' };
        }
        
        throw error;
      }
    },
    {
      enabled: enabled && lessonIds.length > 0,
      ...getCacheConfig('LESSON_PROGRESS_BATCH') // Batch progress - fresh data
    }
  );
}

/**
 * COURSE PROGRESS - Aggregate course progress for ProgressTracker
 * Critical: Progress tracking for course completion overview
 */
export function useCourseProgressQuery(courseId: string, enabled: boolean = true) {
  return useApiQuery(
    ['course-progress', courseId],
    async (): Promise<StandardResponse<any>> => {
      return await api.get(`/progress/courses/${courseId}/overview`, { requireAuth: true });
    },
    {
      enabled: enabled && !!courseId,
      ...getCacheConfig('COURSE_PROGRESS_OVERVIEW') // Course progress overview - fresh data
    }
  );
}

// =============================================================================
// MISSING FUNCTIONS - Chapter, Lesson, and Quiz management
// =============================================================================

/**
 * Get chapter by ID with details
 */
export function useChapterByIdQuery(chapterId: string, enabled: boolean = true) {
  return useApiQuery(
    ['chapter', chapterId],
    async () => {
      return api.get<StandardResponse<any>>(`/chapters/${chapterId}`);
    },
    {
      enabled: enabled && !!chapterId,
      ...getCacheConfig('CHAPTER_DETAILS') // Chapter details - moderate freshness
    }
  );
}

/**
 * Get lessons for a specific chapter
 */
export function useChapterLessonsQuery(chapterId: string, enabled: boolean = true) {
  return useApiQuery(
    ['chapter-lessons', chapterId],
    async () => {
      return api.get<StandardResponse<any>>(`/chapters/${chapterId}/lessons`);
    },
    {
      enabled: enabled && !!chapterId,
      ...getCacheConfig('CHAPTER_LESSONS') // Chapter lessons - fresh data
    }
  );
}

/**
 * Update chapter information
 */
export function useUpdateChapter() {
  return useApiMutation(
    async ({ chapterId, data }: { chapterId: string; data: any }) => {
      return api.put<StandardResponse<any>>(`/chapters/${chapterId}`, data);
    },
    {
      invalidateQueries: [
        ['chapter'], // Refresh chapter data
        ['course-chapters'], // Refresh course chapters list
        ['courses'], // Chapter info may affect course metadata
      ],
    }
  );
}

/**
 * Create new lesson in chapter
 */
export function useCreateLesson() {
  return useApiMutation(
    async (data: { chapterId: string; title: string; description?: string; video_url?: string }) => {
      return api.post<StandardResponse<any>>(`/chapters/${data.chapterId}/lessons`, {
        title: data.title,
        description: data.description,
        video_url: data.video_url
      });
    },
    {
      invalidateQueries: [
        ['chapter-lessons'], // Refresh chapter lessons
        ['course-chapters'], // Refresh course structure
        ['course'], // Update course lesson count
        ['lessons'], // Refresh lessons list
      ],
    }
  );
}

/**
 * Get lesson by ID (alias for existing useLessonQuery)
 */
export const useLessonByIdQuery = useLessonQuery;


/**
 * Update lesson information
 */
export function useUpdateLesson() {
  return useApiMutation(
    async ({ lessonId, data }: { lessonId: string; data: any }) => {
      return api.put<StandardResponse<any>>(`/lessons/${lessonId}`, data);
    },
    {
      invalidateQueries: [
        ['lesson'], // Refresh lesson data
        ['chapter-lessons'], // Refresh chapter lessons
        ['course-chapters'], // Lesson info shows in course structure
      ],
    }
  );
}

/**
 * Create quiz for lesson
 */
export function useCreateQuiz() {
  return useApiMutation(
    async (data: { lessonId: string; quiz: any }) => {
      return api.post<StandardResponse<any>>(`/lessons/${data.lessonId}/quiz`, data.quiz);
    },
    {
      invalidateQueries: [
        ['lesson-quiz'], // Refresh lesson quiz
        ['lesson'], // Update has_quiz flag
      ],
    }
  );
}

/**
 * Update existing quiz
 */
export function useUpdateQuiz() {
  return useApiMutation(
    async ({ lessonId, quiz }: { lessonId: string; quiz: any }) => {
      return api.put<StandardResponse<any>>(`/lessons/${lessonId}/quiz`, quiz);
    },
    {
      invalidateQueries: [
        ['lesson-quiz'], // Refresh lesson quiz
        ['lesson'], // Update has_quiz flag
      ],
    }
  );
}

/**
 * Submit quiz answers
 */
export function useSubmitQuiz() {
  return useApiMutation(
    async ({ lessonId, answers }: { lessonId: string; answers: any[] }) => {
      return api.post<StandardResponse<any>>(`/lessons/${lessonId}/quiz/submit`, { answers });
    },
    {
      invalidateQueries: [
        ['quiz-progress'], // Refresh quiz progress
        ['lesson-progress'], // Refresh lesson progress
        ['course-progress'], // Update overall course progress
        ['student-dashboard'], // Update dashboard stats
        ['course-chapters'], // May unlock next lesson
      ],
    }
  );
}

