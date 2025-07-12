'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastService } from '@/lib/toast/ToastService';
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
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (chapterData: ChapterData) => createChapter(chapterData),
    {
      onSuccess: (data, variables) => {
        // Get the courseId from the chapter data
        const courseId = variables.course_id;
        
        // Invalidate specific queries with courseId
        queryClient.invalidateQueries({ queryKey: ['course-chapters', courseId] });
        queryClient.invalidateQueries({ queryKey: ['chapters', courseId] });
        queryClient.invalidateQueries({ queryKey: ['chapters-with-lessons', courseId] });
        queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        
        // Also invalidate general lists
        queryClient.invalidateQueries({ queryKey: ['creator-courses'] });
        queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      },
      operationName: 'create-chapter', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * UPDATE CHAPTER - Chapter editing
 * Critical: Content management workflow
 */
export function useUpdateChapter(silent: boolean = false) {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    ({ chapterId, data }: { chapterId: string; data: ChapterUpdateData }) => 
      updateChapter(chapterId, data),
    {
      onSuccess: async (response, variables) => {
        // Get the courseId from the response data
        const courseId = response.data?.course_id;
        
        if (courseId) {
          // Invalidate specific queries with courseId
          queryClient.invalidateQueries({ queryKey: ['course-chapters', courseId] });
          queryClient.invalidateQueries({ queryKey: ['chapters', courseId] });
          queryClient.invalidateQueries({ queryKey: ['chapters-with-lessons', courseId] });
          queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        }
        
        // Also invalidate chapter-specific queries
        queryClient.invalidateQueries({ queryKey: ['chapter', variables.chapterId] });
        queryClient.invalidateQueries({ queryKey: ['creator-courses'] });
      },
      operationName: 'update-chapter', // Unique operation ID for toast deduplication
      showToast: !silent, // 🔧 FIX: Disable toast when silent=true (for autosave)
    }
  );
}

/**
 * DELETE CHAPTER - Chapter deletion with optimistic update
 * Critical: Content management
 */
export function useDeleteChapter() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: (chapterId: string) => deleteChapter(chapterId),
    
    // Optimistic update - Update UI immediately
    onMutate: async (chapterId: string) => {
      // Cancel any outgoing refetches for chapter-related queries
      await queryClient.cancelQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && 
          (query.queryKey[0] === 'chapters' || query.queryKey[0] === 'course-chapters')
      });
      
      // Get all chapter-related cache keys (including course-chapters)
      const cacheKeys = queryClient.getQueryCache().findAll({
        predicate: (query) => Array.isArray(query.queryKey) && 
          (query.queryKey[0] === 'chapters' || query.queryKey[0] === 'course-chapters')
      });
      
      // Store snapshots for rollback
      const snapshots: any[] = [];
      
      // Update all chapter caches
      cacheKeys.forEach((cache) => {
        const data = queryClient.getQueryData(cache.queryKey);
        snapshots.push({ key: cache.queryKey, data });
        
        // Optimistically remove chapter from list
        queryClient.setQueryData(cache.queryKey, (old: any) => {
          if (!old) return old;
          
          // Handle different data structures
          const chapters = old?.data?.chapters || old?.chapters || [];
          const filteredChapters = chapters.filter((chapter: any) => {
            return chapter.id !== chapterId;
          });
          
          // Maintain same structure
          if (old?.data?.chapters) {
            return {
              ...old,
              data: {
                ...old.data,
                chapters: filteredChapters,
                total: filteredChapters.length
              }
            };
          }
          
          return {
            ...old,
            chapters: filteredChapters,
            total: filteredChapters.length
          };
        });
      });
      
      return { snapshots, chapterId };
    },
    
    // Rollback on error
    onError: (error: any, chapterId: string, context: any) => {
      if (context?.snapshots) {
        context.snapshots.forEach((snapshot: any) => {
          queryClient.setQueryData(snapshot.key, snapshot.data);
        });
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      // Minimal invalidation - only refresh specific queries that need server sync
      queryClient.invalidateQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && 
          (query.queryKey[0] === 'chapters' || query.queryKey[0] === 'course-chapters'),
        refetchType: 'active' // Only refetch if query is actively used
      });
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (chapterId: string, options?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
      mutation.mutate(chapterId, {
        onSuccess: (response) => {
          // Toast handled manually since using useMutation (not useApiMutation)
          ToastService.success(response?.message || 'Something went wrong', 'delete-chapter');
          if (options?.onSuccess) {
            options.onSuccess();
          }
        },
        onError: (error: any) => {
          // Toast handled manually since using useMutation (not useApiMutation)
          ToastService.error(error?.message || 'Something went wrong', 'delete-chapter-error');
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

/**
 * REORDER CHAPTERS - Chapter organization with optimistic updates
 * Medium-impact: Course structure management
 */
export function useReorderChapters() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: ({ courseId, chapterOrders }: ReorderData) => 
      reorderChapters(courseId, { chapter_orders: chapterOrders.map(order => ({ chapter_id: order.id, new_order: order.order })) }),
    
    // Optimistic update - Update UI immediately
    onMutate: async ({ courseId, chapterOrders }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && 
          (query.queryKey[0] === 'chapters' || query.queryKey[0] === 'chapters-with-lessons')
      });
      
      // Get all chapter-related cache keys for this course
      const cacheKeys = queryClient.getQueryCache().findAll({
        predicate: (query) => Array.isArray(query.queryKey) && 
          (query.queryKey[0] === 'chapters' || query.queryKey[0] === 'chapters-with-lessons') &&
          query.queryKey[1] === courseId
      });
      
      // Store snapshots for rollback
      const snapshots: any[] = [];
      
      // Create a map for quick order lookup
      const orderMap = new Map(chapterOrders.map(item => [item.id, item.order]));
      
      // Update all chapter caches
      cacheKeys.forEach((cache) => {
        const data = queryClient.getQueryData(cache.queryKey);
        snapshots.push({ key: cache.queryKey, data });
        
        // Optimistically reorder chapters
        queryClient.setQueryData(cache.queryKey, (old: any) => {
          if (!old) return old;
          
          // Handle different data structures
          const chapters = old?.data?.chapters || old?.chapters || [];
          
          // Sort chapters based on new order
          const reorderedChapters = [...chapters].sort((a: any, b: any) => {
            const aId = a.id;
            const bId = b.id;
            const aOrder = orderMap.get(aId) || a.order || 999;
            const bOrder = orderMap.get(bId) || b.order || 999;
            return aOrder - bOrder;
          });
          
          // Update order property on each chapter
          const updatedChapters = reorderedChapters.map((chapter: any, index: number) => {
            const chapterId = chapter.id;
            const newOrder = orderMap.get(chapterId);
            return {
              ...chapter,
              order: newOrder || index + 1
            };
          });
          
          // Maintain same structure
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
      
      return { snapshots, courseId, chapterOrders };
    },
    
    // Rollback on error
    onError: (error: any, variables: ReorderData, context: any) => {
      if (context?.snapshots) {
        context.snapshots.forEach((snapshot: any) => {
          queryClient.setQueryData(snapshot.key, snapshot.data);
        });
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['chapters-with-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['course'] });
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (data: ReorderData, options?: { onSuccess?: (response: any) => void; onError?: (error: any) => void }) => {
      mutation.mutate(data, {
        onSuccess: (response) => {
          // Toast handled manually since using useMutation (not useApiMutation)
          ToastService.success(response?.message || 'Chapters reordered successfully', 'reorder-chapters');
          if (options?.onSuccess) {
            options.onSuccess(response);
          }
        },
        onError: (error: any) => {
          // Toast handled manually since using useMutation (not useApiMutation)
          ToastService.error(error?.message || 'Failed to reorder chapters', 'reorder-chapters-error');
          if (options?.onError) {
            options.onError(error);
          }
        }
      });
    },
    mutateAsync: (data: ReorderData) => mutation.mutateAsync(data),
    loading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
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