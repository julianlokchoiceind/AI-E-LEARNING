'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { CACHE_CONFIGS } from '@/lib/constants/cache-config';
import { 
  getCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse
} from '@/lib/api/courses';
import { enrollInCourse } from '@/lib/api/enrollments';
import { 
  getAdminCourses, 
  approveCourse, 
  rejectCourse, 
  toggleCourseFree 
} from '@/lib/api/admin';
import { getCourseAnalytics } from '@/lib/api/analytics';
import { 
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
import { ToastService } from '@/lib/toast/ToastService';

// Types for course queries
interface CoursesFilters {
  search?: string;
  category?: string;
  level?: string;
  pricing?: 'free' | 'paid' | 'all';
  sort?: 'newest' | 'popular' | 'rating' | 'price';
  page?: number;
  limit?: number;
}

interface CourseEnrollment {
  courseId: string;
  paymentMethod?: string;
}

// =============================================================================
// PUBLIC COURSE FUNCTIONS - Original useCourses.ts functions
// =============================================================================

/**
 * PUBLIC COURSES - Course catalog for all users
 * High-impact: Used by 100% of users browsing courses
 */
export function useCoursesQuery(filters: CoursesFilters = {}) {
  const { search = '', category = '', level = '', pricing = 'all', sort = 'newest', page = 1, limit = 12 } = filters;
  
  return useApiQuery(
    ['courses', { search, category, level, pricing, sort, page, limit }],
    () => getCourses(),
    CACHE_CONFIGS.PUBLIC_BROWSING // 3 minutes - catalog data
  );
}

/**
 * SINGLE COURSE - Course details page
 * High-impact: Used when viewing any course
 */
export function useCourseQuery(courseId: string, enabled: boolean = true) {
  return useApiQuery(
    ['course', courseId],
    () => getCourseById(courseId),
    {
      enabled: enabled && !!courseId,
      ...CACHE_CONFIGS.CONTENT_DETAILS, // 5 minutes - course details
    }
  );
}

/**
 * COURSE SEARCH - Real-time search
 * High-impact: Search functionality across platform
 */
export function useCourseSearchQuery(query: string, filters: Omit<CoursesFilters, 'search'> = {}) {
  return useApiQuery(
    ['course-search', query, filters],
    () => getCourses(),
    {
      enabled: query.length > 2, // Only search after 3 characters
      ...CACHE_CONFIGS.SEARCH, // 1 minute - search results
    }
  );
}

/**
 * CREATE COURSE - For creators and admins
 * Critical: Course creation workflow
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    () => createCourse(),
    {
      operationName: 'create-course',
      onSuccess: () => {
        // Invalidate all queries that start with 'admin-courses'
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const queryKey = query.queryKey;
            return Array.isArray(queryKey) && queryKey[0] === 'admin-courses';
          }
        });
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        queryClient.invalidateQueries({ queryKey: ['creator-courses'] });
      }
    }
  );
}

/**
 * UPDATE COURSE - Course editing
 * Critical: Content management workflow
 */
export function useUpdateCourse() {
  return useApiMutation(
    ({ courseId, data }: { courseId: string; data: any }) => updateCourse(courseId, data),
    {
      invalidateQueries: [
        ['course'], // Refresh course details
        ['courses'], // Refresh course catalog
        ['admin-courses'], // Refresh admin view
        ['creator-courses'], // Refresh creator dashboard
        ['course-editor'], // Refresh course editor data
      ],
      operationName: 'update-course', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * DELETE COURSE - Course deletion (SIMPLE VERSION - for Creator)
 * Critical: Content management
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (courseId: string) => deleteCourse(courseId),
    {
      operationName: 'delete-course',
      onSuccess: async (response, variables) => {
        // IMPORTANT: Remove the specific course query to prevent 404 errors
        queryClient.removeQueries({ 
          queryKey: ['course', variables],
          exact: true 
        });
        
        // Invalidate list queries
        await queryClient.invalidateQueries({ queryKey: ['courses'] });
        await queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
        await queryClient.invalidateQueries({ queryKey: ['creator-courses'] });
        await queryClient.invalidateQueries({ queryKey: ['creator-dashboard'] });
      }
    }
  );
}

/**
 * ENROLL IN COURSE - Student enrollment
 * Critical: Primary business action
 */
export function useEnrollInCourse() {
  return useApiMutation(
    ({ courseId }: CourseEnrollment) => enrollInCourse(courseId),
    {
      invalidateQueries: [
        ['my-courses'], // Refresh student courses
        ['course'], // Refresh course details (enrollment status)
        ['student-dashboard'], // Refresh dashboard
      ],
      operationName: 'enroll-course', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * FEATURED COURSES - Homepage and marketing
 * High-impact: First impression for new users
 */
export function useFeaturedCoursesQuery() {
  return useApiQuery(
    ['featured-courses'],
    () => getCourses(),
    CACHE_CONFIGS.FEATURED // 10 minutes - featured content
  );
}

/**
 * COURSE RECOMMENDATIONS - Personalized suggestions
 * Medium-impact: Improves user engagement
 */
export function useCourseRecommendationsQuery(userId?: string) {
  return useApiQuery(
    ['course-recommendations', userId],
    () => getCourses(),
    {
      enabled: !!userId,
      ...CACHE_CONFIGS.RECOMMENDATIONS, // 15 minutes - recommendations
    }
  );
}

// =============================================================================
// ADMIN COURSE FUNCTIONS - Consolidated from useAdminCourses.ts
// =============================================================================

interface AdminCoursesFilters {
  search?: string;
  status?: string;
  category?: string;
}

/**
 * Hook for admin courses list with React Query caching
 * Drop-in replacement for manual fetchCourses pattern
 */
export function useAdminCoursesQuery(filters: AdminCoursesFilters = {}) {
  const { search = '', status = '', category = '' } = filters;
  
  // Use stable query key when no filters to ensure invalidation works
  const hasFilters = search || status || category;
  const queryKey = hasFilters 
    ? ['admin-courses', { search, status, category }]
    : ['admin-courses'];
  
  return useApiQuery(
    queryKey,
    () => getAdminCourses({ search, status, category }),
    CACHE_CONFIGS.ADMIN // Always refetch for admin data (real-time updates)
  );
}

/**
 * Mutation for approving courses with automatic query invalidation
 */
export function useApproveCourse() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (courseId: string) => approveCourse(courseId),
    {
      operationName: 'approve-course',
      onSuccess: () => {
        // Invalidate all queries that start with 'admin-courses'
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const queryKey = query.queryKey;
            return Array.isArray(queryKey) && queryKey[0] === 'admin-courses';
          }
        });
      }
    }
  );
}

/**
 * Mutation for rejecting courses with automatic query invalidation
 */
export function useRejectCourse() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    ({ courseId, reason }: { courseId: string; reason: string }) => 
      rejectCourse(courseId, reason),
    {
      operationName: 'reject-course',
      onSuccess: () => {
        // Invalidate all queries that start with 'admin-courses'
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const queryKey = query.queryKey;
            return Array.isArray(queryKey) && queryKey[0] === 'admin-courses';
          }
        });
      }
    }
  );
}

/**
 * Mutation for toggling course free status with optimistic update
 */
export function useToggleCourseFree() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: ({ courseId, isFree }: { courseId: string; isFree: boolean }) => 
      toggleCourseFree(courseId, isFree),
    
    // Optimistic update - Update UI immediately
    onMutate: async ({ courseId, isFree }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'admin-courses'
      });
      
      // Snapshot previous value
      const previousCourses = queryClient.getQueryData(['admin-courses']);
      
      // Optimistically update course free status
      queryClient.setQueryData(['admin-courses'], (old: any) => {
        if (!old) return old;
        
        // Handle different data structures
        const courses = old?.data?.courses || old?.courses || [];
        const updatedCourses = courses.map((course: any) => {
          const id = course._id || course.id;
          if (id === courseId) {
            return {
              ...course,
              pricing: {
                ...course.pricing,
                is_free: isFree
              }
            };
          }
          return course;
        });
        
        // Maintain same structure
        if (old?.data?.courses) {
          return {
            ...old,
            data: {
              ...old.data,
              courses: updatedCourses
            }
          };
        }
        
        return {
          ...old,
          courses: updatedCourses
        };
      });
      
      return { previousCourses, courseId, isFree };
    },
    
    // Rollback on error
    onError: (error: any, variables, context: any) => {
      if (context?.previousCourses) {
        queryClient.setQueryData(['admin-courses'], context.previousCourses);
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['admin-courses'],
        refetchType: 'active'
      });
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (data: { courseId: string; isFree: boolean }, options?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
      mutation.mutate(data, {
        onSuccess: (response) => {
          // Toast handled by useApiMutation pattern - using explicit ID for optimistic updates
          const status = data.isFree ? 'free' : 'paid';
          ToastService.success(response?.message || 'Something went wrong', 'toggle-course-free');
          if (options?.onSuccess) {
            options.onSuccess();
          }
        },
        onError: (error: any) => {
          // Toast handled by useApiMutation pattern - using explicit ID for optimistic updates
          ToastService.error(error?.message || 'Something went wrong', 'toggle-course-free-error');
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
 * Delete a course with optimistic updates (ADMIN VERSION)
 * Provides instant UI feedback while API call happens in background
 */
export function useDeleteCourseOptimistic() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (courseId: string) => deleteCourse(courseId),
    
    // Optimistic update: Update UI immediately before API call
    onMutate: async (courseId: string) => {
        
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({ 
          predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'admin-courses'
        });
        
        // Snapshot the previous value
        const previousAdminCourses = queryClient.getQueryData(['admin-courses']);
        
        // Optimistically update the admin courses list
        queryClient.setQueryData(['admin-courses'], (old: any) => {
          
          // The cache data is wrapped by useApiQuery
          if (!old) {
            return old;
          }
          
          // Check different possible data structures
          let courses = null;
          let total = 0;
          
          // Structure 1: Direct data.courses
          if (old?.data?.courses) {
            courses = old.data.courses;
            total = old.data.total || courses.length;
          }
          // Structure 2: Success response with data.data.courses
          else if (old?.success && old?.data?.data?.courses) {
            courses = old.data.data.courses;
            total = old.data.data.total || courses.length;
          }
          // Structure 3: Direct courses array
          else if (Array.isArray(old?.courses)) {
            courses = old.courses;
            total = old.total || courses.length;
          }
          
          if (!courses) {
            return old;
          }
          
          
          const filteredCourses = courses.filter((course: any) => {
            const id = course._id || course.id;
            return id !== courseId;
          });
          
          
          // Reconstruct the data in the same structure
          let updatedData;
          
          // Structure 1: Direct data.courses
          if (old?.data?.courses) {
            updatedData = {
              ...old,
              data: {
                ...old.data,
                courses: filteredCourses,
                total: filteredCourses.length
              }
            };
          }
          // Structure 2: Success response with data.data.courses
          else if (old?.success && old?.data?.data?.courses) {
            updatedData = {
              ...old,
              data: {
                ...old.data,
                data: {
                  ...old.data.data,
                  courses: filteredCourses,
                  total: filteredCourses.length
                }
              }
            };
          }
          // Structure 3: Direct courses array
          else {
            updatedData = {
              ...old,
              courses: filteredCourses,
              total: filteredCourses.length
            };
          }
          
          return updatedData;
        });
        
        // Return context with previous data for potential rollback
        return { previousAdminCourses, courseId };
      },
      
      // On error: rollback optimistic update
      onError: (error: any, courseId: string, context: any) => {
        
        // Restore previous data
        if (context?.previousAdminCourses) {
          queryClient.setQueryData(['admin-courses'], context.previousAdminCourses);
        }
      },
      
      // On success: confirm the optimistic update worked
      onSuccess: (response: any, courseId: string) => {
        
        // Since optimistic update already removed the course from UI,
        // we just need to ensure cache consistency
      },
      
      // Always refetch to ensure data consistency after mutation settles
      onSettled: async (data: any, error: any, courseId: string) => {
        
        // Invalidate admin courses to ensure fresh data
        // Only invalidate active queries to avoid unnecessary network requests
        await queryClient.invalidateQueries({ 
          queryKey: ['admin-courses'],
          refetchType: 'active' // Only refetch currently active queries
        });
        
      }
  });
  
  // Return a wrapper that matches the useApiMutation interface
  return {
    mutate: (courseId: string, options?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
      mutation.mutate(courseId, {
        onSuccess: (response) => {
          // Toast handled by useApiMutation pattern - using explicit ID for optimistic updates
          ToastService.success(response?.message || 'Something went wrong', 'delete-course');
          // Call optional onSuccess callback
          if (options?.onSuccess) {
            options.onSuccess();
          }
        },
        onError: (error: any) => {
          // Toast handled by useApiMutation pattern - using explicit ID for optimistic updates
          ToastService.error(error?.message || 'Something went wrong', 'delete-course-error');
          // Call optional onError callback
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

// =============================================================================
// CREATOR COURSE FUNCTIONS - Consolidated from useCreatorCourses.ts
// =============================================================================

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
 * Mutation for reordering lessons within a chapter with optimistic updates
 */
export function useReorderLessons() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: ({ chapterId, reorderData }: { chapterId: string; reorderData: any }) => 
      reorderLessons(chapterId, reorderData),
    
    // Optimistic update - Update UI immediately
    onMutate: async ({ chapterId, reorderData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && 
          (query.queryKey[0] === 'course-chapters' || query.queryKey[0] === 'chapters-with-lessons')
      });
      
      // Get all chapter-related cache keys
      const cacheKeys = queryClient.getQueryCache().findAll({
        predicate: (query) => Array.isArray(query.queryKey) && 
          (query.queryKey[0] === 'course-chapters' || query.queryKey[0] === 'chapters-with-lessons')
      });
      
      // Store snapshots for rollback
      const snapshots: any[] = [];
      
      // Create a map for quick order lookup from reorderData
      const orderMap = new Map(
        reorderData.lesson_orders.map((item: any) => [item.lesson_id, item.new_order])
      );
      
      // Update all chapter caches
      cacheKeys.forEach((cache) => {
        const data = queryClient.getQueryData(cache.queryKey);
        snapshots.push({ key: cache.queryKey, data });
        
        // Optimistically reorder lessons
        queryClient.setQueryData(cache.queryKey, (old: any) => {
          if (!old) return old;
          
          // Handle different data structures
          const chapters = old?.data?.chapters || old?.chapters || [];
          
          // Update lessons within the specific chapter
          const updatedChapters = chapters.map((chapter: any) => {
            const chapterIdMatch = (chapter._id || chapter.id) === chapterId;
            
            if (chapterIdMatch && chapter.lessons) {
              // Sort lessons based on new order
              const reorderedLessons = [...chapter.lessons].sort((a: any, b: any) => {
                const aId = a._id || a.id;
                const bId = b._id || b.id;
                const aOrder = orderMap.get(aId) || a.order || 999;
                const bOrder = orderMap.get(bId) || b.order || 999;
                return aOrder - bOrder;
              });
              
              // Update order property on each lesson
              const updatedLessons = reorderedLessons.map((lesson: any, index: number) => {
                const lessonId = lesson._id || lesson.id;
                const newOrder = orderMap.get(lessonId);
                return {
                  ...lesson,
                  order: newOrder || index + 1
                };
              });
              
              return {
                ...chapter,
                lessons: updatedLessons
              };
            }
            
            return chapter;
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
      
      return { snapshots, chapterId, reorderData };
    },
    
    // Rollback on error
    onError: (error: any, variables: { chapterId: string; reorderData: any }, context: any) => {
      if (context?.snapshots) {
        context.snapshots.forEach((snapshot: any) => {
          queryClient.setQueryData(snapshot.key, snapshot.data);
        });
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['course-chapters'] });
      queryClient.invalidateQueries({ queryKey: ['chapters-with-lessons'] });
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (data: { chapterId: string; reorderData: any }, options?: { onSuccess?: (response: any) => void; onError?: (error: any) => void }) => {
      mutation.mutate(data, {
        onSuccess: (response) => {
          // Toast handled manually since using useMutation (not useApiMutation)
          ToastService.success(response?.message || 'Lessons reordered successfully', 'reorder-lessons');
          if (options?.onSuccess) {
            options.onSuccess(response);
          }
        },
        onError: (error: any) => {
          // Toast handled manually since using useMutation (not useApiMutation)
          ToastService.error(error?.message || 'Failed to reorder lessons', 'reorder-lessons-error');
          if (options?.onError) {
            options.onError(error);
          }
        }
      });
    },
    mutateAsync: (data: { chapterId: string; reorderData: any }) => mutation.mutateAsync(data),
    loading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
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