'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { 
  getCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  enrollInCourse
} from '@/lib/api/courses';

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

/**
 * PUBLIC COURSES - Course catalog for all users
 * High-impact: Used by 100% of users browsing courses
 */
export function useCoursesQuery(filters: CoursesFilters = {}) {
  const { search = '', category = '', level = '', pricing = 'all', sort = 'newest', page = 1, limit = 12 } = filters;
  
  return useApiQuery(
    ['courses', { search, category, level, pricing, sort, page, limit }],
    () => getCourses(),
    {
      staleTime: 3 * 60 * 1000, // 3 minutes - catalog data
      gcTime: 10 * 60 * 1000, // 10 minutes cache
    }
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
      staleTime: 5 * 60 * 1000, // 5 minutes - course details
      gcTime: 15 * 60 * 1000, // 15 minutes cache
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
      staleTime: 1 * 60 * 1000, // 1 minute - search results
      gcTime: 5 * 60 * 1000, // 5 minutes cache
    }
  );
}

/**
 * CREATE COURSE - For creators and admins
 * Critical: Course creation workflow
 */
export function useCreateCourse() {
  return useApiMutation(
    () => createCourse(),
    {
      invalidateQueries: [
        ['courses'], // Refresh course catalog
        ['admin-courses'], // Refresh admin view
        ['creator-courses'], // Refresh creator dashboard
      ],
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
      ],
    }
  );
}

/**
 * DELETE COURSE - Course deletion
 * Critical: Content management
 */
export function useDeleteCourse() {
  return useApiMutation(
    (courseId: string) => deleteCourse(courseId),
    {
      invalidateQueries: [
        ['courses'], // Refresh course catalog
        ['admin-courses'], // Refresh admin view
        ['creator-courses'], // Refresh creator dashboard
      ],
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
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - featured content
      gcTime: 30 * 60 * 1000, // 30 minutes cache
    }
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
      staleTime: 15 * 60 * 1000, // 15 minutes - recommendations
      gcTime: 60 * 60 * 1000, // 1 hour cache
    }
  );
}

/**
 * CREATOR DASHBOARD - Creator's courses and stats
 * Critical: Creator workflow and revenue tracking
 */
export function useCreatorDashboardQuery(enabled: boolean = true) {
  return useApiQuery(
    ['creator-dashboard'],
    async () => {
      // Fetch creator's courses with stats
      const response = await getCourses();
      
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      const courses = response.data?.courses || [];
      
      // Calculate stats from courses data
      const totalStudents = courses.reduce((sum: number, course: any) => 
        sum + (course.stats?.total_enrollments || 0), 0
      );
      const totalRevenue = courses.reduce((sum: number, course: any) => 
        sum + (course.stats?.total_revenue || 0), 0
      );
      const avgRating = courses.length > 0
        ? courses.reduce((sum: number, course: any) => 
            sum + (course.stats?.average_rating || 0), 0
          ) / courses.length
        : 0;

      return {
        success: true,
        data: {
          courses,
          stats: {
            totalCourses: courses.length,
            totalStudents,
            totalRevenue,
            avgRating,
          }
        },
        message: 'Creator dashboard data retrieved successfully'
      };
    },
    {
      enabled,
      staleTime: 2 * 60 * 1000, // 2 minutes - creator data changes frequently
      gcTime: 5 * 60 * 1000, // 5 minutes cache
    }
  );
}