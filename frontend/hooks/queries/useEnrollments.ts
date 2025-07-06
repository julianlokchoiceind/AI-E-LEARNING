'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { 
  getCourseEnrollment,
  getMyEnrollments
} from '@/lib/api/enrollments';

/**
 * SINGLE ENROLLMENT - Check if user is enrolled in a course
 * High-impact: Used for access control and enrollment status
 */
export function useEnrollmentQuery(courseId: string, enabled: boolean = true) {
  return useApiQuery(
    ['enrollment', courseId],
    async () => {
      try {
        const response = await getCourseEnrollment(courseId);
        return response;
      } catch (error: any) {
        // If 404, user is not enrolled (expected)
        if (error.status === 404 || error.message?.includes('not enrolled')) {
          return { success: false, data: null, message: 'Not enrolled' };
        }
        throw error;
      }
    },
    {
      enabled: enabled && !!courseId,
      staleTime: 5 * 60 * 1000, // 5 minutes - enrollment status
      gcTime: 15 * 60 * 1000, // 15 minutes cache
    }
  );
}

/**
 * USER ENROLLMENTS - All user's enrolled courses
 * Medium-impact: Used in student dashboard and my courses page
 */
export function useEnrollmentsQuery(enabled: boolean = true) {
  return useApiQuery(
    ['enrollments'],
    () => getMyEnrollments(),
    {
      enabled,
      staleTime: 3 * 60 * 1000, // 3 minutes - user data
      gcTime: 10 * 60 * 1000, // 10 minutes cache
    }
  );
}