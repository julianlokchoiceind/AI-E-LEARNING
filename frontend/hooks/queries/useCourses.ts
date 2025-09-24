'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useQueryClient } from '@tanstack/react-query';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { 
  getCourses,
  getCreatorCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  type CourseDetailData
} from '@/lib/api/courses';
import { StandardResponse } from '@/lib/types/api';
import { enrollInCourse, type Enrollment, type EnrollmentCreate } from '@/lib/api/enrollments';
import { api } from '@/lib/api/api-client';
import {
  getAdminCourses,
  approveCourse,
  rejectCourse,
  toggleCourseFree,
  bulkCourseAction,
  getAdminStatistics,
  updateCourseStatus
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

// Cache data type definitions
type CachedCourseData = StandardResponse<CourseDetailData> | CourseDetailData | null;
type CachedCoursesData = StandardResponse<any> | any | null;

// =============================================================================
// PUBLIC COURSE FUNCTIONS - Original useCourses.ts functions
// =============================================================================

/**
 * PUBLIC COURSES - Course catalog for all users
 * High-impact: Used by 100% of users browsing courses
 */
export function useCoursesQuery(filters: CoursesFilters = {}) {
  const { search = '', category = '', level = '', pricing = 'all', sort = 'newest', page = 1, limit = 12 } = filters;
  
  // Build query string from filters
  const buildQueryString = () => {
    const params = new URLSearchParams();
    
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (level) params.append('level', level);
    if (pricing !== 'all') params.append('is_free', pricing === 'free' ? 'true' : 'false');
    if (sort) params.append('sort', sort);
    if (page > 1) params.append('page', page.toString());
    if (limit !== 12) params.append('per_page', limit.toString());
    
    return params.toString();
  };
  
  return useApiQuery(
    ['courses', { search, category, level, pricing, sort, page, limit }],
    () => {
      const queryString = buildQueryString();
      return getCourses(queryString);
    },
    {
      showToast: false, // Disable toasts for public course catalog - use graceful degradation
      ...getCacheConfig('COURSE_CATALOG') // 30s fresh - public browsing with admin→public sync
    }
  );
}

/**
 * SINGLE COURSE - Course details page
 * High-impact: Used when viewing any course
 */
export function useCourseQuery(courseId: string, enabled: boolean = true) {
  return useApiQuery<CourseDetailData>(
    ['course', courseId],
    () => getCourseById(courseId),
    {
      enabled: enabled && !!courseId,
      showToast: false, // Disable toasts for public course pages - use ErrorState instead
      ...getCacheConfig('COURSE_DETAILS') // 30s fresh - course detail pages
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
      ...getCacheConfig('COURSE_CATALOG'), // 30s fresh - search results same as catalog
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
      operationName: 'create-course',
      invalidateQueries: [
        ['courses'],          // Refresh public course list
        ['admin-courses'],    // Refresh admin view
        ['creator-courses'],  // Refresh creator dashboard
        ['featured-courses'], // Update featured list
      ],
    }
  );
}

/**
 * UPDATE COURSE - Course editing
 * Critical: Content management workflow
 */
export function useUpdateCourse(silent: boolean = false) {
  return useApiMutation(
    ({ courseId, data }: { courseId: string; data: any }) => {
      return updateCourse(courseId, data);
    },
    {
      invalidateQueries: [
        ['course'], // Refresh course details
        ['courses'], // Refresh course catalog - PUBLIC ✅
        ['admin-courses'], // Refresh admin view
        ['creator-courses'], // Refresh creator dashboard
        ['course-editor'], // Refresh course editor data
        ['course-chapters'], // Refresh course chapters (missing!)
        ['featured-courses'], // Update featured content - PUBLIC ✅
        ['course-search'], // Update search results - PUBLIC ✅
        ['learn-page'], // 🚀 NEW: Invalidate consolidated learn page cache
      ],
      operationName: 'update-course', // Unique operation ID for toast deduplication
      showToast: !silent, // 🔧 FIX: Disable toast when silent=true (for autosave)
      onSuccess: (response, variables) => {
        // Course updated successfully
      }
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
      invalidateQueries: [
        ['courses'],          // Refresh course lists
        ['admin-courses'],    // Refresh admin view
        ['creator-courses'],  // Refresh creator dashboard
        ['my-courses'],       // Remove from enrolled courses
        ['creator-dashboard'], // Update creator dashboard
      ],
      onSuccess: async (response, variables) => {
        // IMPORTANT: Remove the specific course query to prevent 404 errors
        queryClient.removeQueries({ 
          queryKey: ['course', variables],
          exact: true 
        });
      }
    }
  );
}

/**
 * ENROLL IN COURSE - Student enrollment
 * Critical: Primary business action
 */
export function useEnrollInCourse() {
  const queryClient = useQueryClient();
  
  return useApiMutation<
    Enrollment,
    { courseId: string; enrollmentData?: EnrollmentCreate }
  >(
    ({ courseId, enrollmentData }) => 
      enrollInCourse(courseId, enrollmentData),
    {
      operationName: 'enroll-course',
      showToast: false, // Disable automatic toast - courses page uses inline messages
      invalidateQueries: [
        ['course'],           // Refresh course details to get continue_lesson_id
        ['my-courses'],       // Refresh student's enrolled courses
        ['student-dashboard'], // Update dashboard stats
        ['enrollment'],       // Update enrollment records
        ['recent-courses'],   // Update recent courses list
        ['admin-courses'],    // Update admin view stats
        ['creator-courses'],  // Update creator dashboard stats
        ['learn-page'],       // 🚀 NEW: Invalidate consolidated learn page cache
      ],
      onSuccess: (response, variables) => {
        // Invalidate the specific course to get fresh data with continue_lesson_id
        queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
        // Also invalidate the specific enrollment query
        queryClient.invalidateQueries({ 
          queryKey: ['enrollment', variables.courseId],
          exact: true 
        });
        // 🚀 NEW: Invalidate learn page cache for this course
        queryClient.invalidateQueries({ 
          queryKey: ['learn-page', variables.courseId],
          exact: false // Invalidate all lessons in this course
        });
      }
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
    getCacheConfig('RECOMMENDATIONS') // 10min stable - featured content
  );
}

/**
 * CATEGORY STATISTICS - Homepage categories display
 * Medium-impact: Shows course count by category for homepage
 */
export function useCategoryStatsQuery() {
  return useApiQuery(
    ['category-stats'],
    async () => {
      const response = await api.get<StandardResponse<Record<string, number>>>('/courses/categories/stats', { requireAuth: false });
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      return response;
    },
    {
      showToast: false, // Disable toasts - use graceful degradation
      ...getCacheConfig('COURSE_CATALOG'), // Homepage content
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
      ...getCacheConfig('RECOMMENDATIONS'), // 10min stable - personalized recommendations
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
  page?: number;
  per_page?: number;
}

/**
 * Hook for admin courses list with React Query caching
 * Drop-in replacement for manual fetchCourses pattern
 */
export function useAdminCoursesQuery(filters: AdminCoursesFilters = {}) {
  const { search = '', status = '', category = '', page = 1, per_page = 20 } = filters;
  
  // Always include pagination in query key for proper caching
  const queryKey = ['admin-courses', { search, status, category, page, per_page }];
  
  return useApiQuery(
    queryKey,
    () => getAdminCourses({ search, status, category, page, per_page }),
    {
      ...getCacheConfig('ADMIN_OPERATIONS'), // Realtime - admin data needs immediate updates
      keepPreviousData: true, // Smooth pagination transitions
    }
  );
}

/**
 * Mutation for approving courses
 * Critical: Admin course approval workflow
 */
export function useApproveCourse() {
  return useApiMutation(
    (courseId: string) => approveCourse(courseId),
    {
      operationName: 'approve-course',
      invalidateQueries: [
        ['admin-courses'],        // Refresh all admin course queries (with pagination)
        ['admin-course-statistics'], // Refresh statistics for Quick Stats
        ['courses'],              // Update public catalog
        ['course'],               // Update course details
        ['featured-courses'],     // Update featured content
        ['course-search'],        // Update search results
        ['creator-courses'],      // Update creator dashboard
      ],
    }
  );
}

/**
 * Mutation for updating course status
 * Used for publish/unpublish archived courses
 */
export function useUpdateCourseStatus() {
  return useApiMutation(
    ({ courseId, status }: { courseId: string; status: string }) => updateCourseStatus(courseId, status),
    {
      operationName: 'update-course-status',
      invalidateQueries: [
        ['admin-courses'],        // Refresh all admin course queries (with pagination)
        ['admin-course-statistics'], // Refresh statistics for Quick Stats
        ['courses'],              // Update public catalog
        ['course'],               // Update course details
        ['featured-courses'],     // Update featured content
        ['course-search'],        // Update search results
        ['creator-courses'],      // Update creator dashboard
      ],
    }
  );
}

/**
 * Mutation for rejecting courses
 * Critical: Admin course rejection workflow
 */
export function useRejectCourse() {
  return useApiMutation(
    ({ courseId, reason }: { courseId: string; reason: string }) => 
      rejectCourse(courseId, reason),
    {
      operationName: 'reject-course',
      invalidateQueries: [
        ['admin-courses'],        // Refresh all admin course queries (with pagination)
        ['admin-course-statistics'], // Refresh statistics for Quick Stats
        ['courses'],              // Update public catalog
        ['course'],               // Update course details
        ['featured-courses'],     // Update featured content
        ['course-search'],        // Update search results
        ['creator-courses'],      // Update creator dashboard
      ],
    }
  );
}

/**
 * Mutation for toggling course free status
 * Critical: Admin pricing management
 */
export function useToggleCourseFree() {
  return useApiMutation(
    ({ courseId, isFree }: { courseId: string; isFree: boolean }) => 
      toggleCourseFree(courseId, isFree),
    {
      operationName: 'toggle-course-free',
      invalidateQueries: [
        ['admin-courses'],        // Refresh all admin course queries  
        ['admin-course-statistics'], // Refresh statistics
        ['courses'],              // Update public catalog
        ['course'],               // Update course details
        ['featured-courses'],     // Update featured content
        ['course-search'],        // Update search results
        ['creator-courses'],      // Update creator dashboard
      ],
    }
  );
}

/**
 * Delete a course (ADMIN VERSION)
 * Critical: Admin course deletion
 */
export function useDeleteCourseAdmin() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (courseId: string) => deleteCourse(courseId),
    {
      operationName: 'delete-course',
      invalidateQueries: [
        ['admin-courses'],        // Refresh all admin course queries
        ['admin-course-statistics'], // Refresh statistics
        ['courses'],              // Update public catalog
        ['course'],               // Update course details
        ['featured-courses'],     // Update featured content
        ['course-search'],        // Update search results
        ['creator-courses'],      // Update creator dashboard
        ['my-courses'],           // Remove from enrolled courses
      ],
      onSuccess: async (response, variables) => {
        // IMPORTANT: Remove the specific course query to prevent 404 errors
        queryClient.removeQueries({ 
          queryKey: ['course', variables],
          exact: true 
        });
      }
    }
  );
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
      ...getCacheConfig('CONTENT_CREATION') // Realtime - creator editing needs immediate updates
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
      ...getCacheConfig('CONTENT_CREATION') // Realtime - creator editing needs immediate updates
    }
  );
}

/**
 * Hook for fetching chapters with lessons - PUBLIC endpoint
 * Used by: Course detail page for unauthenticated users
 * Migrated from: useLearning.ts
 */
export function useCourseChaptersPublicQuery(courseId: string) {
  return useApiQuery(
    ['course-chapters-public', courseId],
    async (): Promise<StandardResponse<any>> => {
      // Use public endpoint that works without authentication (for preview mode)
      const response = await api.get<StandardResponse<any>>(`/courses/${courseId}/chapters-with-lessons-public`, { requireAuth: false });
      
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      // Return the full StandardResponse
      return response;
    },
    {
      enabled: !!courseId,
      showToast: false, // Disable toasts for public course chapter queries - use graceful degradation
      ...getCacheConfig('COURSE_STRUCTURE') // Course structure - moderate freshness
    }
  );
}

/**
 * Mutation for creating new chapters
 * Critical: Chapter creation for course builder workflow
 */
export function useCreateChapter() {
  return useApiMutation(
    ({ courseId, chapterData }: { courseId: string; chapterData: any }) => 
      createChapter({ course_id: courseId, ...chapterData }),
    {
      operationName: 'create-chapter',
      invalidateQueries: [
        ['course-chapters'],      // Refresh course chapters
        ['course-editor'],        // Refresh course editor
        ['chapters'],             // Refresh general chapter lists
        ['course'],               // Update course details
        ['course-search'],        // Update search results
        ['creator-courses'],      // Update creator dashboard
        ['admin-courses'],        // Update admin view
      ],
    }
  );
}

/**
 * Mutation for updating chapter data
 * Critical: Chapter editing for content management workflow
 */
export function useUpdateChapter(silent: boolean = false) {
  return useApiMutation(
    ({ chapterId, chapterData }: { chapterId: string; chapterData: any }) => 
      updateChapter(chapterId, chapterData),
    {
      operationName: 'update-chapter',
      showToast: !silent,
      invalidateQueries: [
        ['course-chapters'],      // Refresh course chapters
        ['chapters'],             // Refresh general chapter lists
        ['chapter'],              // Refresh specific chapter
        ['course'],               // Update course details
        ['course-search'],        // Update search results
        ['creator-courses'],      // Update creator dashboard
        ['admin-courses'],        // Update admin view
        ['learn-page'],           // 🚀 NEW: Invalidate consolidated learn page cache
      ],
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
 * Critical: Lesson creation for course builder workflow
 */
export function useCreateLesson() {
  return useApiMutation(
    (lessonData: any) => createLesson(lessonData),
    {
      operationName: 'create-lesson',
      invalidateQueries: [
        ['course-chapters'],      // Refresh course chapters
        ['lessons'],              // Refresh lesson lists
        ['chapters'],             // Refresh chapter details (lesson count)
        ['chapters-with-lessons'], // Refresh course structure
        ['course'],               // Update course details
        ['course-search'],        // Update search results
        ['creator-courses'],      // Update creator dashboard
        ['admin-courses'],        // Update admin view
      ],
    }
  );
}

/**
 * Mutation for updating lesson data
 * Critical: Lesson editing for content management workflow
 */
export function useUpdateLesson(silent: boolean = false) {
  return useApiMutation(
    ({ lessonId, data }: { lessonId: string; data: any }) => 
      updateLesson(lessonId, data),
    {
      operationName: 'update-lesson',
      showToast: !silent,
      invalidateQueries: [
        ['course-chapters'],      // Refresh course chapters
        ['lesson'],               // Refresh lesson details
        ['lessons'],              // Refresh lesson lists
        ['chapters-with-lessons'], // Refresh course structure
        ['course'],               // Update course details
        ['course-search'],        // Update search results
        ['creator-courses'],      // Update creator dashboard
        ['admin-courses'],        // Update admin view
        ['learn-page'],           // 🚀 NEW: Invalidate consolidated learn page cache
      ],
    }
  );
}


/**
 * Mutation for reordering lessons within a chapter
 * Medium-impact: Course structure management
 */
export function useReorderLessons() {
  return useApiMutation(
    ({ chapterId, reorderData }: { chapterId: string; reorderData: any }) => 
      reorderLessons(chapterId, reorderData),
    {
      operationName: 'reorder-lessons',
      invalidateQueries: [
        ['course-chapters'],      // Refresh course chapters
        ['chapters-with-lessons'], // Refresh chapters with lessons
        ['lessons'],              // Refresh lesson lists
        ['course'],               // Update course structure
      ],
    }
  );
}

/**
 * Hook for creator's dashboard data
 * Fetches creator's courses and calculates statistics
 */
export function useCreatorDashboardQuery(enabled: boolean = true) {
  return useApiQuery(
    ['creator-analytics-overview', '30days'],
    () => api.get<StandardResponse<any>>('/analytics/creator/overview?time_range=30days', { requireAuth: true }),
    {
      enabled: enabled,
      showToast: false, // Disable automatic error toasts - handled manually in component
      ...getCacheConfig('USER_DASHBOARD') // 2min moderate - dashboard can have slight delay
    }
  );
}

/**
 * Hook for creator's course list
 */
export function useCreatorCoursesQuery(
  filters: {
    search?: string;
    status?: string;
    category?: string;
    page?: number;
    per_page?: number;
  } = {},
  enabled: boolean = true
) {
  const { search = '', status = '', category = '', page = 1, per_page = 20 } = filters;
  
  // Always include pagination in query key for proper caching
  const queryKey = ['creator-courses', { search, status, category, page, per_page }];
  
  return useApiQuery(
    queryKey,
    () => getCreatorCourses({ search, status, category, page, per_page }),
    {
      enabled: enabled,
      showToast: false, // Disable automatic error toasts - handled manually in component
      ...getCacheConfig('CONTENT_CREATION'), // Realtime - CRUD operations need immediate updates
      keepPreviousData: true, // Smooth pagination transitions
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
      ...getCacheConfig('USER_DASHBOARD'), // 2min moderate - analytics for creator dashboard
    }
  );
}

// =============================================================================
// ADMIN STATISTICS FUNCTIONS - Dashboard Quick Stats  
// =============================================================================

/**
 * ADMIN STATISTICS - Course counts for dashboard Quick Stats
 * Critical: Provides real database totals, independent from pagination
 */
export function useAdminStatistics() {
  return useApiQuery(
    ['admin-course-statistics'],
    () => getAdminStatistics(),
    {
      ...getCacheConfig('ADMIN_OPERATIONS'), // Realtime - admin data needs immediate updates
      staleTime: 30 * 1000, // 30 seconds - Statistics can be slightly stale for performance
    }
  );
}

/**
 * COURSE BULK ACTIONS - Bulk operations on courses (Following FAQ pattern)
 * Medium-impact: Admin efficiency
 */
export function useBulkCourseActions() {
  return useApiMutation(
    async ({ action, courseIds }: { action: 'delete'; courseIds: string[] }) => {
      // Filter out any undefined/null IDs to prevent errors
      const validCourseIds = courseIds.filter(id => id && typeof id === 'string' && id.trim() !== '');

      if (validCourseIds.length === 0) {
        throw new Error('No valid course IDs provided for bulk action');
      }

      return await bulkCourseAction({
        course_ids: validCourseIds,
        action
      });
    },
    {
      operationName: 'bulk-course-action',
      invalidateQueries: [
        ['admin-courses'], // Refresh admin course list
        ['admin-course-statistics'], // Refresh statistics
      ],
    }
  );
}