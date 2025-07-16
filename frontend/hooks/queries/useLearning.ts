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
export function useLessonQuery(lessonId: string, enabled: boolean = true) {
  return useApiQuery(
    ['lesson', lessonId],
    async (): Promise<StandardResponse<any>> => {
      return api.get(`/lessons/${lessonId}`, { requireAuth: true });
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
export function useLessonProgressQuery(lessonId: string) {
  return useApiQuery(
    ['lesson-progress', lessonId],
    async (): Promise<StandardResponse<any>> => {
      try {
        return await api.get(`/progress/lessons/${lessonId}/progress`, { requireAuth: true });
      } catch (error: any) {
        // If no progress exists, return null (this is normal)
        if (error.statusCode === 404) {
          return { success: true, data: null, message: 'No progress found' };
        }
        throw error;
      }
    },
    {
      enabled: !!lessonId,
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
export function useCourseChaptersQuery(courseId: string) {
  return useApiQuery(
    ['course-chapters', courseId],
    async (): Promise<any> => {
      const data: any = await api.get(`/courses/${courseId}/chapters-with-lessons`, { requireAuth: true });
      if (!data.success) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      return data.data; // Return the chapters array directly
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
    async ({ lessonId, courseId, quizScore }: { lessonId: string; courseId: string; quizScore?: number }): Promise<StandardResponse<any>> => {
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
export function useBatchLessonProgressQuery(lessonIds: string[], enabled: boolean = true) {
  return useApiQuery(
    ['lesson-progress-batch', lessonIds.sort().join(',')],
    async (): Promise<StandardResponse<any[]>> => {
      if (lessonIds.length === 0) {
        return { success: true, data: [], message: 'No lessons to fetch progress for' };
      }

      // Batch fetch all lesson progress in a single request
      const data: any = await api.post(`/progress/lessons/batch`, {
        lesson_ids: lessonIds
      }, { requireAuth: true });

      if (!data.success) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data.data || [];
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
 * Get quiz for specific lesson
 */
export function useLessonQuizQuery(lessonId: string, enabled: boolean = true) {
  return useApiQuery(
    ['lesson-quiz', lessonId],
    async () => {
      return api.get<StandardResponse<any>>(`/lessons/${lessonId}/quiz`);
    },
    {
      enabled: enabled && !!lessonId,
      ...getCacheConfig('LESSON_QUIZ') // Lesson quiz - stable content
    }
  );
}

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

/**
 * Get quiz progress for lesson
 */
export function useQuizProgressQuery(lessonId: string, enabled: boolean = true) {
  return useApiQuery(
    ['quiz-progress', lessonId],
    async () => {
      return api.get<StandardResponse<any>>(`/lessons/${lessonId}/quiz/progress`);
    },
    {
      enabled: enabled && !!lessonId,
      ...getCacheConfig('QUIZ_PROGRESS') // Quiz progress - fresh data
    }
  );
}