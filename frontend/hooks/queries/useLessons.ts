'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastService } from '@/lib/toast/ToastService';
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
  return useApiQuery<Lesson>(
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
 * DELETE LESSON - Lesson deletion with optimistic update
 * Critical: Content management
 */
export function useDeleteLesson() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: (lessonId: string) => deleteLesson(lessonId),
    
    // Optimistic update - Update UI immediately
    onMutate: async (lessonId: string) => {
      // Cancel any outgoing refetches for lesson-related queries
      await queryClient.cancelQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && 
          (query.queryKey[0] === 'lessons' || query.queryKey[0] === 'course-chapters')
      });
      
      // Get all lesson-related cache keys (including course-chapters for nested lessons)
      const cacheKeys = queryClient.getQueryCache().findAll({
        predicate: (query) => Array.isArray(query.queryKey) && 
          (query.queryKey[0] === 'lessons' || query.queryKey[0] === 'course-chapters')
      });
      
      // Store snapshots for rollback
      const snapshots: any[] = [];
      
      // Update all lesson caches
      cacheKeys.forEach((cache) => {
        const data = queryClient.getQueryData(cache.queryKey);
        snapshots.push({ key: cache.queryKey, data });
        
        // Optimistically remove lesson from list
        queryClient.setQueryData(cache.queryKey, (old: any) => {
          if (!old) return old;
          
          // Handle course-chapters structure (lessons nested in chapters)
          if (cache.queryKey[0] === 'course-chapters') {
            const chapters = old?.data?.chapters || old?.chapters || [];
            
            const updatedChapters = chapters.map((chapter: any) => {
              if (chapter.lessons && Array.isArray(chapter.lessons)) {
                const filteredLessons = chapter.lessons.filter((lesson: any) => lesson.id !== lessonId);
                
                // Only update if lessons changed
                if (filteredLessons.length !== chapter.lessons.length) {
                  return {
                    ...chapter,
                    lessons: filteredLessons,
                    total_lessons: filteredLessons.length
                  };
                }
              }
              return chapter;
            });
            
            // Maintain same structure for course-chapters
            if (old?.data?.chapters) {
              return {
                ...old,
                data: {
                  ...old.data,
                  chapters: updatedChapters
                }
              };
            }
            
            return {
              ...old,
              chapters: updatedChapters
            };
          }
          
          // Handle direct lessons structure
          const lessons = old?.data?.lessons || old?.lessons || [];
          const filteredLessons = lessons.filter((lesson: any) => {
            const id = lesson.id;
            return id !== lessonId;
          });
          
          // Maintain same structure
          if (old?.data?.lessons) {
            return {
              ...old,
              data: {
                ...old.data,
                lessons: filteredLessons,
                total: filteredLessons.length
              }
            };
          }
          
          return {
            ...old,
            lessons: filteredLessons,
            total: filteredLessons.length
          };
        });
      });
      
      // Also update chapters-with-lessons cache
      const chaptersWithLessonsCaches = queryClient.getQueryCache().findAll({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'chapters-with-lessons'
      });
      
      chaptersWithLessonsCaches.forEach((cache) => {
        const data = queryClient.getQueryData(cache.queryKey);
        snapshots.push({ key: cache.queryKey, data });
        
        queryClient.setQueryData(cache.queryKey, (old: any) => {
          if (!old) return old;
          
          const chapters = old?.data?.chapters || old?.chapters || [];
          const updatedChapters = chapters.map((chapter: any) => {
            if (chapter.lessons) {
              return {
                ...chapter,
                lessons: chapter.lessons.filter((lesson: any) => {
                  const id = lesson.id;
                  return id !== lessonId;
                })
              };
            }
            return chapter;
          });
          
          if (old?.data?.chapters) {
            return {
              ...old,
              data: {
                ...old.data,
                chapters: updatedChapters
              }
            };
          }
          
          return {
            ...old,
            chapters: updatedChapters
          };
        });
      });
      
      return { snapshots, lessonId };
    },
    
    // Rollback on error
    onError: (error: any, lessonId: string, context: any) => {
      if (context?.snapshots) {
        context.snapshots.forEach((snapshot: any) => {
          queryClient.setQueryData(snapshot.key, snapshot.data);
        });
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      // Minimal invalidation - only refresh queries that need server sync
      queryClient.invalidateQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && 
          (query.queryKey[0] === 'lessons' || query.queryKey[0] === 'course-chapters'),
        refetchType: 'active' // Only refetch if query is actively used
      });
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (lessonId: string, options?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
      mutation.mutate(lessonId, {
        onSuccess: (response) => {
          // Toast handled manually since using useMutation (not useApiMutation)
          ToastService.success(response?.message || 'Something went wrong', 'delete-lesson');
          if (options?.onSuccess) {
            options.onSuccess();
          }
        },
        onError: (error: any) => {
          // Toast handled manually since using useMutation (not useApiMutation)
          ToastService.error(error?.message || 'Something went wrong', 'delete-lesson-error');
          if (options?.onError) {
            options.onError(error);
          }
        }
      });
    },
    mutateAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}

