'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { Lesson } from '@/lib/types/course';
import { 
  getLessonsByChapter, 
  getLesson, 
  getPreviewLesson,
  createLesson, 
  updateLesson, 
  deleteLesson
} from '@/lib/api/lessons';

// Types for lesson operations
interface LessonData {
  course_id: string;
  chapter_id: string;
  title: string;
  description?: string;
  video?: {
    url?: string;
    youtube_id?: string;
    duration?: number;
  };
}

interface LessonUpdateData {
  title?: string;
  description?: string;
  video?: {
    url?: string;
    youtube_id?: string;
    duration?: number;
  };
  content?: string;
  resources?: Array<{
    title: string;
    type: 'pdf' | 'code' | 'link' | 'exercise';
    url: string;
    description?: string;
  }>;
  order?: number;
  status?: 'draft' | 'published';
}

interface ReorderData {
  chapterId: string;
  lessonOrders: Array<{ id: string; order: number }>;
}

/**
 * CHAPTER LESSONS - Lesson list for chapter management
 * High-impact: Used in course editors and learning interface
 */
export function useLessonsQuery(chapterId: string, enabled: boolean = true) {
  return useApiQuery(
    ['lessons', chapterId],
    () => getLessonsByChapter(chapterId),
    {
      enabled: enabled && !!chapterId,
      showToast: false, // Disable toasts for public course learning interface - use graceful degradation
      ...getCacheConfig('CHAPTER_LESSONS') // Chapter lessons - fresh data
    }
  );
}

/**
 * SINGLE LESSON - Lesson details
 * High-impact: Used in lesson editing and learning interface
 */
export function useLessonQuery(lessonId: string, enabled: boolean = true) {
  return useApiQuery<Lesson>(
    ['lesson', lessonId],
    () => getLesson(lessonId),
    {
      enabled: enabled && !!lessonId,
      showToast: false, // Disable toasts for public lesson learning interface - use graceful degradation
      ...getCacheConfig('LESSON_DETAILS') // Lesson details - moderate freshness
    }
  );
}

/**
 * PREVIEW LESSON - Public lesson preview (no auth required)
 * High-impact: Used in course preview and marketing pages
 */
export function usePreviewLessonQuery(courseId: string, lessonId: string, enabled: boolean = true) {
  return useApiQuery(
    ['preview-lesson', courseId, lessonId],
    () => getPreviewLesson(courseId, lessonId),
    {
      enabled: enabled && !!courseId && !!lessonId,
      showToast: false, // Disable toasts for public lesson previews - use ErrorState instead
      ...getCacheConfig('LESSON_PREVIEW') // Lesson preview - stable content
    }
  );
}

/**
 * CREATE LESSON - For course creation workflow
 * Critical: Content creation process
 */
export function useCreateLesson() {
  return useApiMutation(
    (lessonData: LessonData) => createLesson(lessonData),
    {
      invalidateQueries: [
        ['lessons'], // Refresh lesson lists
        ['chapters'], // Refresh chapter details (lesson count)
        ['course-chapters'], // Refresh course editor chapter lists (CRITICAL FIX)
        ['chapters-with-lessons'], // Refresh course structure
        ['course'], // Refresh course details
        ['creator-courses'], // Refresh creator dashboard
        ['admin-courses'], // Refresh admin view
      ],
      operationName: 'create-lesson', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * UPDATE LESSON - Lesson editing
 * Critical: Content management workflow
 */
export function useUpdateLesson(silent: boolean = false) {
  return useApiMutation(
    ({ lessonId, data }: { lessonId: string; data: LessonUpdateData }) => 
      updateLesson(lessonId, data),
    {
      invalidateQueries: [
        ['lesson'], // Refresh lesson details
        ['lessons'], // Refresh lesson lists
        ['course-chapters'], // Refresh course editor chapter lists
        ['chapters-with-lessons'], // Refresh course structure
        ['course'], // Refresh course details (🔧 CRITICAL: includes timestamp)
        ['creator-courses'], // Refresh creator dashboard
        ['admin-courses'], // 🔧 NEW: Refresh admin course list with updated timestamps
      ],
      operationName: 'update-lesson', // Unique operation ID for toast deduplication
      showToast: !silent, // 🔧 FIX: Disable toast when silent=true (for autosave)
    }
  );
}

/**
 * DELETE LESSON - Lesson deletion
 * Critical: Content management
 */
export function useDeleteLesson() {
  return useApiMutation(
    (lessonId: string) => deleteLesson(lessonId),
    {
      operationName: 'delete-lesson',
      invalidateQueries: [
        ['lessons'],            // Refresh lesson lists
        ['course-chapters'],    // Refresh course-specific chapters
        ['chapters-with-lessons'], // Refresh chapters with lessons
        ['course'],             // Refresh course details
        ['creator-courses'],    // Update creator course list
        ['admin-courses'],      // Update admin course list
      ],
    }
  );
}

