'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { api } from '@/lib/api/api-client';
import { StandardResponse } from '@/lib/types/api';

// Types for the consolidated learn page data
export interface VideoProgress {
  watch_percentage: number;
  current_position: number;
  total_watch_time: number;
  is_completed: boolean;
  completed_at?: string;
}

export interface QuizProgress {
  attempts: number;
  best_score: number;
  is_passed: boolean;
  last_attempt_at?: string;
}

export interface LessonProgress {
  lesson_id: string;
  is_unlocked: boolean;
  is_completed: boolean;
  video_progress: VideoProgress;
  quiz_progress?: QuizProgress;
  started_at?: string;
  completed_at?: string;
}

export interface VideoContent {
  youtube_url?: string;
  duration?: number;
  thumbnail_url?: string;
  title?: string;
  description?: string;
}

export interface Resource {
  title: string;
  url: string;
  type: string;
  description?: string;
}

export interface LessonData {
  id: string;
  title: string;
  description?: string;
  order: number;
  video?: VideoContent;
  content?: string;
  resources: Resource[];
  has_quiz: boolean;
  quiz_required: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  progress?: LessonProgress;
}

export interface ChapterData {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: LessonData[];
  total_lessons: number;
  completed_lessons: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CourseProgress {
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
  is_completed: boolean;
  current_lesson_id?: string;
  continue_lesson_id?: string;
  last_accessed?: string;
  completed_at?: string;
}

export interface EnrollmentData {
  id: string;
  user_id: string;
  course_id: string;
  is_active: boolean;
  enrolled_at: string;
  progress: CourseProgress;
  access_type: string;
  expires_at?: string;
}

export interface CourseData {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  total_lessons: number;
  total_duration: number;
  difficulty_level: string;
  category?: string;
  tags: string[];
  status: string;
  is_free: boolean;
  created_at: string;
  updated_at: string;
}

export interface NavigationInfo {
  current_lesson_order: number;
  total_lessons_in_chapter: number;
  current_chapter_order: number;
  total_chapters: number;
  previous_lesson_id?: string;
  next_lesson_id?: string;
  can_navigate_previous: boolean;
  can_navigate_next: boolean;
}

export interface LearnPageData {
  course: CourseData;
  current_lesson: LessonData;
  chapters: ChapterData[];
  enrollment?: EnrollmentData;
  user_progress?: Record<string, LessonProgress>;
  navigation: NavigationInfo;
  is_preview_mode: boolean;
  total_watch_time_minutes: number;
  generated_at: string;
  data_sources: string[];
}

export interface UpdateProgressData {
  lesson_id: string;
  watch_percentage: number;
  current_position: number;
  total_watch_time?: number;
}

export interface ProgressUpdateResponse {
  updated: boolean;
  lesson_completed: boolean;
  course_completed: boolean;
  next_lesson_unlocked?: string;
  updated_progress: LessonProgress;
}

/**
 * CONSOLIDATED LEARN PAGE HOOK
 * 
 * Smart Frontend Hook - Replaces 7 individual API calls:
 * 1. useCourseQuery (course details)
 * 2. useLessonQuery (current lesson)
 * 3. useChaptersQuery (course structure)
 * 4. useEnrollmentQuery (user enrollment)
 * 5. useProgressQuery (user progress)
 * 6. useUserStatsQuery (learning statistics)
 * 7. useNavigationQuery (lesson navigation)
 * 
 * BENEFITS:
 * - Reduces loading states from 4 to 1
 * - Eliminates API waterfall effects
 * - Provides atomic data consistency
 * - Uses optimized backend with parallel fetching
 * 
 * CACHE STRATEGY:
 * - REALTIME cache (staleTime: 0) for immediate updates
 * - Invalidated by progress updates and course changes
 * - Supports both authenticated and guest users
 */
export function useLearnPage(courseId: string, lessonId: string, enabled: boolean = true) {
  return useApiQuery<LearnPageData>(
    ['learn-page', courseId, lessonId],
    async () => {
      const response = await api.get<StandardResponse<LearnPageData>>(
        `/learn/${courseId}/${lessonId}`,
        { requireAuth: false } // Support both authenticated and guest users
      );
      return response.data || null;
    },
    {
      enabled: enabled && !!courseId && !!lessonId,
      ...getCacheConfig('REALTIME'), // staleTime: 0 for immediate updates
      retry: 3, // Important for learn page reliability
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Error handling for better UX
      onError: (error: any) => {
        console.error('[useLearnPage] Failed to load learn page data:', error);
        // Don't show toast automatically - let component handle it
      },
      
      // Success callback for debugging
      onSuccess: (data) => {
        console.log('[useLearnPage] Learn page data loaded:', {
          courseId,
          lessonId,
          isPreviewMode: data?.is_preview_mode,
          totalLessons: data?.course?.total_lessons,
          currentProgress: data?.enrollment?.progress?.completion_percentage,
          timestamp: new Date().toISOString()
        });
      }
    }
  );
}

/**
 * PROGRESS UPDATE MUTATION
 * 
 * Smart Frontend Mutation - Handles video progress updates:
 * - Debounced updates (handled by parent component)
 * - Optimistic UI updates
 * - Automatic cache invalidation
 * - Business logic handled by backend
 */
export function useUpdateLessonProgress() {
  return useApiMutation<ProgressUpdateResponse, { courseId: string; progressData: UpdateProgressData }>(
    async ({ courseId, progressData }) => {
      const response = await api.put<StandardResponse<ProgressUpdateResponse>>(
        `/learn/${courseId}/progress`,
        progressData,
        { requireAuth: true }
      );
      return response;
    },
    {
      operationName: 'update-lesson-progress',
      showToast: false, // Progress updates should be silent
      
      // Cache invalidation strategy
      invalidateQueries: (variables) => [
        ['learn-page', variables.courseId], // Invalidate for any lesson in the course
        ['courses'], // Update course catalog completion status
        ['my-courses'], // Update student dashboard
        ['creator-courses'], // Update creator analytics
        ['admin-courses'], // Update admin view
        ['enrollment'], // Update enrollment progress
        ['student-dashboard'], // Update dashboard stats
      ],
      
      // Success callback for completion notifications
      onSuccess: (response, variables) => {
        if (response.data?.lesson_completed) {
          console.log('[useUpdateLessonProgress] Lesson completed!', {
            lessonId: variables.progressData.lesson_id,
            courseCompleted: response.data.course_completed,
            nextLessonUnlocked: response.data.next_lesson_unlocked
          });
        }
      },
      
      // Error handling
      onError: (error, variables) => {
        console.error('[useUpdateLessonProgress] Progress update failed:', {
          lessonId: variables.progressData.lesson_id,
          error: error.message
        });
      }
    }
  );
}

/**
 * UTILITY HOOKS FOR BACKWARD COMPATIBILITY
 * 
 * These hooks extract specific data from the consolidated response
 * to maintain compatibility with existing components during migration.
 */

/**
 * Extract course data from consolidated response
 */
export function useCourseFromLearnPage(courseId: string, lessonId: string, enabled: boolean = true) {
  const { data, isLoading, error } = useLearnPage(courseId, lessonId, enabled);
  
  return {
    data: data?.course || null,
    isLoading,
    error,
    
    // Additional computed properties for compatibility
    isEnrolled: !data?.is_preview_mode,
    enrollment: data?.enrollment,
    totalWatchTime: data?.total_watch_time_minutes
  };
}

/**
 * Extract current lesson data from consolidated response
 */
export function useCurrentLessonFromLearnPage(courseId: string, lessonId: string, enabled: boolean = true) {
  const { data, isLoading, error } = useLearnPage(courseId, lessonId, enabled);
  
  return {
    data: data?.current_lesson || null,
    isLoading,
    error,
    
    // Additional computed properties
    progress: data?.current_lesson?.progress,
    navigation: data?.navigation,
    isUnlocked: data?.current_lesson?.progress?.is_unlocked ?? false,
    isCompleted: data?.current_lesson?.progress?.is_completed ?? false
  };
}

/**
 * Extract chapters data from consolidated response
 */
export function useChaptersFromLearnPage(courseId: string, lessonId: string, enabled: boolean = true) {
  const { data, isLoading, error } = useLearnPage(courseId, lessonId, enabled);
  
  return {
    data: data?.chapters || [],
    isLoading,
    error,
    
    // Additional computed properties
    totalChapters: data?.navigation?.total_chapters ?? 0,
    currentChapterOrder: data?.navigation?.current_chapter_order ?? 1
  };
}

/**
 * Extract user progress data from consolidated response
 */
export function useProgressFromLearnPage(courseId: string, lessonId: string, enabled: boolean = true) {
  const { data, isLoading, error } = useLearnPage(courseId, lessonId, enabled);
  
  return {
    data: data?.user_progress || {},
    isLoading,
    error,
    
    // Additional computed properties
    courseProgress: data?.enrollment?.progress,
    isPreviewMode: data?.is_preview_mode ?? true,
    totalWatchTime: data?.total_watch_time_minutes ?? 0
  };
}

/**
 * MIGRATION HELPER
 * 
 * This function helps identify which components are still using old hooks
 * during the migration process.
 */
export function logOldHookUsage(hookName: string, location: string) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[MIGRATION] Old hook ${hookName} still used in ${location}. Consider migrating to useLearnPage.`);
  }
}