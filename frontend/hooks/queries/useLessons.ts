'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
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
  order?: number;
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
      staleTime: 3 * 60 * 1000, // 3 minutes - lesson structure
      gcTime: 10 * 60 * 1000, // 10 minutes cache
    }
  );
}

/**
 * SINGLE LESSON - Lesson details
 * High-impact: Used in lesson editing and learning interface
 */
export function useLessonQuery(lessonId: string, enabled: boolean = true) {
  return useApiQuery(
    ['lesson', lessonId],
    () => getLesson(lessonId),
    {
      enabled: enabled && !!lessonId,
      staleTime: 2 * 60 * 1000, // 2 minutes - lesson content changes more frequently
      gcTime: 8 * 60 * 1000, // 8 minutes cache
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
      staleTime: 5 * 60 * 1000, // 5 minutes - preview content is more stable
      gcTime: 15 * 60 * 1000, // 15 minutes cache - keep longer for marketing
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
        ['chapters-with-lessons'], // Refresh course structure
        ['course'], // Refresh course details
        ['creator-courses'], // Refresh creator dashboard
        ['admin-courses'], // Refresh admin view
      ],
    }
  );
}

/**
 * UPDATE LESSON - Lesson editing
 * Critical: Content management workflow
 */
export function useUpdateLesson() {
  return useApiMutation(
    ({ lessonId, data }: { lessonId: string; data: LessonUpdateData }) => 
      updateLesson(lessonId, data),
    {
      invalidateQueries: [
        ['lesson'], // Refresh lesson details
        ['lessons'], // Refresh lesson lists
        ['chapters-with-lessons'], // Refresh course structure
        ['course'], // Refresh course details
        ['creator-courses'], // Refresh creator dashboard
      ],
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
      invalidateQueries: [
        ['lessons'], // Refresh lesson lists
        ['chapters'], // Refresh chapter details
        ['chapters-with-lessons'], // Refresh course structure
        ['course'], // Refresh course details
        ['creator-courses'], // Refresh creator dashboard
        ['admin-courses'], // Refresh admin view
      ],
    }
  );
}

