'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getAdminCourses, approveCourse, rejectCourse, toggleCourseFree } from '@/lib/api/admin';
import { deleteCourse, createCourse } from '@/lib/api/courses';

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
  
  return useApiQuery(
    ['admin-courses', { search, status, category }],
    () => getAdminCourses({ search, status, category }),
    {
      staleTime: 3 * 60 * 1000, // 3 minutes for admin data
      gcTime: 5 * 60 * 1000, // 5 minutes cache
    }
  );
}

/**
 * Mutation for approving courses with automatic query invalidation
 */
export function useApproveCourse() {
  return useApiMutation(
    (courseId: string) => approveCourse(courseId),
    {
      invalidateQueries: [['admin-courses']],
    }
  );
}

/**
 * Mutation for rejecting courses with automatic query invalidation
 */
export function useRejectCourse() {
  return useApiMutation(
    ({ courseId, reason }: { courseId: string; reason: string }) => 
      rejectCourse(courseId, reason),
    {
      invalidateQueries: [['admin-courses']],
    }
  );
}

/**
 * Mutation for toggling course free status with automatic query invalidation
 */
export function useToggleCourseFree() {
  return useApiMutation(
    ({ courseId, isFree }: { courseId: string; isFree: boolean }) => 
      toggleCourseFree(courseId, isFree),
    {
      invalidateQueries: [['admin-courses']],
    }
  );
}

/**
 * Mutation for deleting courses with automatic query invalidation
 */
export function useDeleteCourse() {
  return useApiMutation(
    (courseId: string) => deleteCourse(courseId),
    {
      invalidateQueries: [['admin-courses']],
    }
  );
}

/**
 * Mutation for creating new courses with automatic query invalidation
 */
export function useCreateCourse() {
  return useApiMutation(
    () => createCourse(),
    {
      invalidateQueries: [['admin-courses']],
    }
  );
}