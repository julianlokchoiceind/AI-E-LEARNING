'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCourseAnalytics } from '@/lib/api/analytics';
import { StandardResponse } from '@/lib/types/api';
import { CACHE_CONFIGS } from '@/lib/constants/cache-config';
import { 
  getCourses,
  getCourseById, 
  updateCourse, 
  deleteCourse 
} from '@/lib/api/courses';
import { 
  getChaptersByCourse, 
  getChaptersWithLessons, 
  createChapter, 
  updateChapter, 
  deleteChapter, 
  reorderChapters 
} from '@/lib/api/chapters';
import { 
  createLesson, 
  updateLesson, 
  deleteLesson, 
  reorderLessons 
} from '@/lib/api/lessons';

/**
 * Hook for fetching course details in course editor
 * Optimized for course editing workflow
 */
export function useCourseEditorQuery(courseId: string, enabled: boolean = true) {
  return useApiQuery(
    ['course-editor', courseId],
    () => getCourseById(courseId),
    {
      enabled: enabled && !!courseId,
      ...CACHE_CONFIGS.CREATOR_EDITING, // 1 minute - course metadata changes frequently during editing
    }
  );
}

/**
 * Hook for fetching chapters with lessons for course editor
 * Provides hierarchical course structure
 */
export function useCourseChaptersQuery(courseId: string, enabled: boolean = true) {
  return useApiQuery(
    ['course-chapters', courseId],
    () => getChaptersWithLessons(courseId),
    {
      enabled: enabled && !!courseId,
      ...CACHE_CONFIGS.CREATOR_EDITING, // 1 minute - chapters change during editing
    }
  );
}

/**
 * Mutation for updating course data with optimistic updates
 * Integrates with useAutosave for seamless editing experience
 */
export function useUpdateCourse() {
  return useApiMutation(
    ({ courseId, courseData }: { courseId: string; courseData: any }) => 
      updateCourse(courseId, courseData),
    {
      invalidateQueries: [
        ['course-editor'], // Refresh course editor data
        ['creator-courses'], // Refresh course list
        ['courses'], // Refresh public course catalog
      ],
      operationName: 'update-course', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * Mutation for creating new chapters
 */
export function useCreateChapter() {
  return useApiMutation(
    ({ courseId, chapterData }: { courseId: string; chapterData: any }) => 
      createChapter({ course_id: courseId, ...chapterData }),
    {
      invalidateQueries: [
        ['course-chapters'], // Refresh chapters list
        ['course-editor'], // Refresh course data
      ],
      operationName: 'create-chapter', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * Mutation for updating chapter data
 */
export function useUpdateChapter() {
  return useApiMutation(
    ({ chapterId, chapterData }: { chapterId: string; chapterData: any }) => 
      updateChapter(chapterId, chapterData),
    {
      invalidateQueries: [
        ['course-chapters'], // Refresh chapters list
      ],
      operationName: 'update-chapter', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * Mutation for deleting chapters
 */
export function useDeleteChapter() {
  return useApiMutation(
    (chapterId: string) => deleteChapter(chapterId),
    {
      invalidateQueries: [
        ['course-chapters'], // Refresh chapters list
        ['course-editor'], // Refresh course data
      ],
      operationName: 'delete-chapter', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * Mutation for reordering chapters
 */
export function useReorderChapters() {
  return useApiMutation(
    ({ courseId, reorderData }: { courseId: string; reorderData: any }) => 
      reorderChapters(courseId, reorderData),
    {
      invalidateQueries: [
        ['course-chapters'], // Refresh chapters list
      ],
      operationName: 'reorder-chapters', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * Mutation for creating new lessons
 */
export function useCreateLesson() {
  return useApiMutation(
    ({ chapterId, lessonData }: { chapterId: string; lessonData: any }) => 
      createLesson({ chapter_id: chapterId, ...lessonData }),
    {
      invalidateQueries: [
        ['course-chapters'], // Refresh chapters list with lessons
      ],
      operationName: 'create-lesson', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * Mutation for updating lesson data
 */
export function useUpdateLesson() {
  return useApiMutation(
    ({ lessonId, lessonData }: { lessonId: string; lessonData: any }) => 
      updateLesson(lessonId, lessonData),
    {
      invalidateQueries: [
        ['course-chapters'], // Refresh chapters list with lessons
      ],
      operationName: 'update-lesson', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * Mutation for deleting lessons
 */
export function useDeleteLesson() {
  return useApiMutation(
    (lessonId: string) => deleteLesson(lessonId),
    {
      invalidateQueries: [
        ['course-chapters'], // Refresh chapters list with lessons
      ],
      operationName: 'delete-lesson', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * Mutation for reordering lessons within a chapter
 */
export function useReorderLessons() {
  return useApiMutation(
    ({ chapterId, reorderData }: { chapterId: string; reorderData: any }) => 
      reorderLessons(chapterId, reorderData),
    {
      invalidateQueries: [
        ['course-chapters'], // Refresh chapters list with lessons
      ],
      operationName: 'reorder-lessons', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * Hook for creator's dashboard data
 * Fetches creator's courses and calculates statistics
 */
export function useCreatorDashboardQuery(creatorId: string, enabled: boolean = true) {
  return useApiQuery(
    ['creator-dashboard', creatorId],
    () => getCourses(`creator_id=${creatorId}`),
    {
      enabled: enabled && !!creatorId,
      ...CACHE_CONFIGS.CREATOR_DASHBOARD, // 2 minutes - dashboard data changes frequently
    }
  );
}

/**
 * Hook for creator's course list
 */
export function useCreatorCoursesQuery(creatorId: string, enabled: boolean = true) {
  return useApiQuery(
    ['creator-courses', creatorId],
    () => getCourses(`creator_id=${creatorId}`),
    {
      enabled: enabled && !!creatorId,
      ...CACHE_CONFIGS.CREATOR_DASHBOARD, // 2 minutes - consistent with dashboard
    }
  );
}

// =============================================================================
// MISSING FUNCTIONS - Course analytics and deletion
// =============================================================================

/**
 * Get analytics data for a specific course
 */
export function useCourseAnalyticsQuery(courseId: string, timeRange: string = '30days', enabled: boolean = true) {
  return useApiQuery(
    ['course-analytics', courseId, timeRange],
    () => getCourseAnalytics(courseId, timeRange),
    {
      enabled: enabled && !!courseId,
      ...CACHE_CONFIGS.CONTENT_DETAILS, // 5 minutes - analytics can be slightly stale
    }
  );
}

/**
 * Delete a course (creator version)
 */
export function useDeleteCourse() {
  return useApiMutation(
    (courseId: string) => deleteCourse(courseId),
    {
      invalidateQueries: [
        ['creator-courses'], // Refresh creator courses list
        ['creator-dashboard'], // Refresh creator dashboard
      ],
      operationName: 'delete-course', // Unique operation ID for toast deduplication
    }
  );
}