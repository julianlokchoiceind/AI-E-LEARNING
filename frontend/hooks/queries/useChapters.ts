'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { 
  getChaptersByCourse, 
  getChapterById, 
  createChapter, 
  updateChapter, 
  deleteChapter,
  reorderChapters,
  getChaptersWithLessons
} from '@/lib/api/chapters';

// Types for chapter operations
interface ChapterData {
  course_id: string;
  title: string;
  description?: string;
}

interface ChapterUpdateData {
  title?: string;
  description?: string;
  order?: number;
}

interface ReorderData {
  courseId: string;
  chapterOrders: Array<{ id: string; order: number }>;
}

/**
 * COURSE CHAPTERS - Chapter list for course management
 * High-impact: Used in course editors and learning interface
 */
export function useChaptersQuery(courseId: string, enabled: boolean = true) {
  return useApiQuery(
    ['chapters', courseId],
    () => getChaptersByCourse(courseId),
    {
      enabled: enabled && !!courseId,
      ...getCacheConfig('COURSE_CHAPTERS') // Course chapters - fresh data
    }
  );
}

/**
 * SINGLE CHAPTER - Chapter details
 * Medium-impact: Used in chapter editing
 */
export function useChapterQuery(chapterId: string, enabled: boolean = true) {
  return useApiQuery(
    ['chapter', chapterId],
    () => getChapterById(chapterId),
    {
      enabled: enabled && !!chapterId,
      ...getCacheConfig('CHAPTER_DETAILS') // Chapter details - moderate freshness
    }
  );
}

/**
 * CREATE CHAPTER - For course creation workflow
 * Critical: Content creation process
 */
export function useCreateChapter() {
  return useApiMutation(
    (chapterData: ChapterData) => createChapter(chapterData),
    {
      operationName: 'create-chapter',
      invalidateQueries: [
        ['course-chapters'],      // Refresh course chapters
        ['chapters'],             // Refresh general chapter lists
        ['chapters-with-lessons'], // Refresh chapters with lessons
        ['course'],               // Update course details
        ['creator-courses'],      // Update creator dashboard
        ['admin-courses'],        // Update admin view
      ],
    }
  );
}

/**
 * UPDATE CHAPTER - Chapter editing
 * Critical: Content management workflow
 */
export function useUpdateChapter(silent: boolean = false) {
  return useApiMutation(
    ({ chapterId, data }: { chapterId: string; data: ChapterUpdateData }) => 
      updateChapter(chapterId, data),
    {
      operationName: 'update-chapter',
      showToast: !silent,
      invalidateQueries: [
        ['course-chapters'],      // Refresh course chapters
        ['chapters'],             // Refresh general chapter lists
        ['chapters-with-lessons'], // Refresh chapters with lessons
        ['chapter'],              // Refresh specific chapter
        ['course'],               // Update course details
        ['creator-courses'],      // Update creator dashboard
      ],
    }
  );
}

/**
 * DELETE CHAPTER - Chapter deletion
 * Critical: Content management
 */
export function useDeleteChapter() {
  return useApiMutation(
    (chapterId: string) => deleteChapter(chapterId),
    {
      operationName: 'delete-chapter',
      invalidateQueries: [
        ['chapters'],           // Refresh chapter lists
        ['course-chapters'],    // Refresh course-specific chapters
        ['chapters-with-lessons'], // Refresh chapters with lessons
        ['creator-courses'],    // Update creator course list
        ['admin-courses'],      // Update admin course list
      ],
    }
  );
}

/**
 * REORDER CHAPTERS - Chapter organization
 * Medium-impact: Course structure management
 */
export function useReorderChapters() {
  return useApiMutation(
    ({ courseId, chapterOrders }: ReorderData) => 
      reorderChapters(courseId, { chapter_orders: chapterOrders.map(order => ({ chapter_id: order.id, new_order: order.order })) }),
    {
      operationName: 'reorder-chapters',
      invalidateQueries: [
        ['chapters'],           // Refresh chapter lists
        ['chapters-with-lessons'], // Refresh chapters with lessons
        ['course'],             // Refresh course data
      ],
    }
  );
}

/**
 * CHAPTERS WITH LESSONS - Course structure with lessons
 * High-impact: Used in course learning interface and editor
 */
export function useChaptersWithLessonsQuery(courseId: string, enabled: boolean = true) {
  return useApiQuery(
    ['chapters-with-lessons', courseId],
    () => getChaptersWithLessons(courseId),
    {
      enabled: enabled && !!courseId,
      ...getCacheConfig('CHAPTERS_WITH_LESSONS') // Chapters with lessons - fresh data
    }
  );
}