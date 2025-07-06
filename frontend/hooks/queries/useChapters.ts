'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
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
      staleTime: 3 * 60 * 1000, // 3 minutes - chapter structure
      gcTime: 10 * 60 * 1000, // 10 minutes cache
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
      staleTime: 5 * 60 * 1000, // 5 minutes - chapter details
      gcTime: 15 * 60 * 1000, // 15 minutes cache
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
      invalidateQueries: [
        ['chapters'], // Refresh chapter lists
        ['course'], // Refresh course details (chapter count)
        ['creator-courses'], // Refresh creator dashboard
        ['admin-courses'], // Refresh admin view
      ],
    }
  );
}

/**
 * UPDATE CHAPTER - Chapter editing
 * Critical: Content management workflow
 */
export function useUpdateChapter() {
  return useApiMutation(
    ({ chapterId, data }: { chapterId: string; data: ChapterUpdateData }) => 
      updateChapter(chapterId, data),
    {
      invalidateQueries: [
        ['chapter'], // Refresh chapter details
        ['chapters'], // Refresh chapter lists
        ['course'], // Refresh course details
        ['creator-courses'], // Refresh creator dashboard
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
      invalidateQueries: [
        ['chapters'], // Refresh chapter lists
        ['course'], // Refresh course details
        ['creator-courses'], // Refresh creator dashboard
        ['admin-courses'], // Refresh admin view
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
      invalidateQueries: [
        ['chapters'], // Refresh chapter lists
        ['course'], // Refresh course details
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
      staleTime: 2 * 60 * 1000, // 2 minutes - more dynamic content
      gcTime: 8 * 60 * 1000, // 8 minutes cache
    }
  );
}