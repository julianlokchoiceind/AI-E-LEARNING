'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getAdminCourses, approveCourse, rejectCourse, toggleCourseFree } from '@/lib/api/admin';
import { deleteCourse, createCourse } from '@/lib/api/courses';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { CACHE_CONFIGS } from '@/lib/constants/cache-config';
import { ToastService } from '@/lib/toast/ToastService';

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
 * Mutation for deleting courses with optimistic updates
 * Provides instant UI feedback while API call happens in background
 */
export function useDeleteCourse() {
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

/**
 * Mutation for creating new courses with automatic query invalidation
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
      }
    }
  );
}