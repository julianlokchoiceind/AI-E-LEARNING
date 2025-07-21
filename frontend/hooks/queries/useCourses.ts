'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { 
  getCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  type CourseDetailData
} from '@/lib/api/courses';
import { StandardResponse } from '@/lib/types/api';
import { enrollInCourse } from '@/lib/api/enrollments';
import { api } from '@/lib/api/api-client';
import { 
  getAdminCourses, 
  approveCourse, 
  rejectCourse, 
  toggleCourseFree,
  getAdminStatistics
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
      console.log('🔧 [CACHE DEBUG] useCoursesQuery fetching:', {
        filters: { search, category, level, pricing, sort, page, limit },
        queryString,
        url: `/courses?${queryString}`,
        timestamp: new Date().toISOString()
      });
      return getCourses(queryString);
    },
    getCacheConfig('COURSE_CATALOG') // 30s fresh - public browsing with admin→public sync
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
 * CREATE COURSE - For creators and admins with optimistic updates
 * Critical: Course creation workflow with instant feedback
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();
  
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
      optimistic: {
        // Optimistic update: Add temporary course immediately
        onMutate: async () => {
          // Cancel any outgoing refetches
          await queryClient.cancelQueries({ 
            predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'admin-courses'
          });
          
          // Snapshot previous values
          const previousAdminCourses = queryClient.getQueryData(['admin-courses']);
          const previousCourses = queryClient.getQueryData(['courses']);
          const previousCreatorCourses = queryClient.getQueryData(['creator-courses']);
          
          // Generate temporary course data
          const tempCourse = {
            id: `temp-${Date.now()}`, // Temporary ID
            title: `Untitled Course #${Math.floor(Math.random() * 100)} (${new Date().toLocaleDateString()})`,
            description: "New course being created...",
            status: 'draft',
            creator_name: 'You',
            total_lessons: 0,
            total_chapters: 0,
            total_duration: 0,
            pricing: {
              is_free: false,
              price: 0,
              currency: 'USD'
            },
            stats: {
              total_enrollments: 0,
              average_rating: 0,
              total_reviews: 0
            },
            created_at: new Date().toISOString(),
            category: 'programming',
            level: 'beginner',
            thumbnail: null
          };
          
          // Optimistically add new course to admin courses (at the top)
          queryClient.setQueryData(['admin-courses'], (old: any) => {
            if (!old) return old;
            
            const courses = old?.data?.courses || old?.courses || [];
            const updatedCourses = [tempCourse, ...courses];
            
            // Maintain same structure
            if (old?.data?.courses) {
              return {
                ...old,
                data: {
                  ...old.data,
                  courses: updatedCourses,
                  total: updatedCourses.length
                }
              };
            }
            
            return {
              ...old,
              courses: updatedCourses,
              total: updatedCourses.length
            };
          });
          
          return { 
            previousAdminCourses, 
            previousCourses, 
            previousCreatorCourses,
            tempCourse 
          };
        },
        
        // Replace temp course with real course on success
        onError: (error, variables, context) => {
          // Rollback all optimistic updates
          if (context?.previousAdminCourses) {
            queryClient.setQueryData(['admin-courses'], context.previousAdminCourses);
          }
          if (context?.previousCourses) {
            queryClient.setQueryData(['courses'], context.previousCourses);
          }
          if (context?.previousCreatorCourses) {
            queryClient.setQueryData(['creator-courses'], context.previousCreatorCourses);
          }
        },
        
        // Always refetch to ensure consistency and get real course data
        onSettled: () => {
          queryClient.invalidateQueries({ 
            queryKey: ['admin-courses'],
            refetchType: 'active'
          });
          queryClient.invalidateQueries({ queryKey: ['courses'] });
          queryClient.invalidateQueries({ queryKey: ['creator-courses'] });
        }
      }
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
      console.log('🔧 [CACHE DEBUG] useUpdateCourse called:', {
        courseId,
        hasStatusChange: data?.status ? true : false,
        newStatus: data?.status,
        silent,
        timestamp: new Date().toISOString()
      });
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
      ],
      operationName: 'update-course', // Unique operation ID for toast deduplication
      showToast: !silent, // 🔧 FIX: Disable toast when silent=true (for autosave)
      onSuccess: (response, variables) => {
        console.log('🔧 [CACHE DEBUG] useUpdateCourse success - cache invalidated:', {
          courseId: variables.courseId,
          hasStatusChange: variables.data?.status ? true : false,
          newStatus: variables.data?.status,
          invalidatedCaches: ['course', 'courses', 'admin-courses', 'creator-courses', 'course-editor', 'course-chapters', 'featured-courses', 'course-search'],
          timestamp: new Date().toISOString()
        });
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
 * ENROLL IN COURSE - Student enrollment with comprehensive optimistic updates
 * Critical: Primary business action with instant feedback across entire platform
 */
export function useEnrollInCourse() {
  const queryClient = useQueryClient();
  
  // Using native React Query for complex multi-cache optimistic updates
  const mutation = useMutation({
    mutationFn: ({ courseId, enrollmentData }: { courseId: string; enrollmentData?: any }) => 
      enrollInCourse(courseId, enrollmentData),
    
    // Comprehensive optimistic update across all enrollment-related caches
    onMutate: async ({ courseId, enrollmentData }) => {
      // Cancel all outgoing refetches for enrollment-related queries
      await queryClient.cancelQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'my-courses' || key === 'student-dashboard' || 
                 key === 'course' || key === 'enrollment' || key === 'recent-courses';
        }
      });
      
      // Snapshot all previous values for comprehensive rollback
      const previousMyCourses = queryClient.getQueryData(['my-courses']);
      const previousDashboard = queryClient.getQueryData(['student-dashboard']);
      const previousCourse = queryClient.getQueryData(['course', courseId]);
      const previousEnrollment = queryClient.getQueryData(['enrollment', courseId]);
      const previousRecentCourses = queryClient.getQueryData(['recent-courses']);
      
      // Generate comprehensive optimistic enrollment data
      const optimisticEnrollment = {
        id: `temp-enrollment-${Date.now()}`,
        user_id: 'current-user', // Will be corrected by backend
        course_id: courseId,
        enrollment_type: enrollmentData?.enrollment_type || 'free' as const,
        payment_id: enrollmentData?.payment_id || null,
        progress: {
          lessons_completed: 0,
          total_lessons: 0, // Will be updated with real course data
          completion_percentage: 0,
          total_watch_time: 0,
          current_lesson_id: null,
          is_completed: false,
          completed_at: null
        },
        certificate: {
          is_issued: false,
          issued_at: null,
          certificate_id: null,
          final_score: null,
          verification_url: null
        },
        is_active: true,
        expires_at: null,
        enrolled_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 1. OPTIMISTICALLY UPDATE MY-COURSES LIST
      queryClient.setQueryData(['my-courses'], (old: any) => {
        if (!old) return old;
        
        // Get course data from course cache to populate my-courses entry
        const courseData = queryClient.getQueryData<CachedCourseData>(['course', courseId]);
        const course = courseData?.data || courseData || {};
        
        const optimisticCourseEntry = {
          id: courseId,
          title: course.title || 'Loading...',
          description: course.description || '',
          thumbnail: course.thumbnail || null,
          instructor_name: course.creator_name || 'Unknown',
          progress: {
            completion_percentage: 0,
            lessons_completed: 0,
            total_lessons: course.total_lessons || 0,
            last_accessed: new Date().toISOString()
          },
          enrollment: optimisticEnrollment,
          enrolled_at: new Date().toISOString()
        };
        
        // Add to my courses list
        const courses = old?.data?.courses || old?.courses || [];
        const updatedCourses = [optimisticCourseEntry, ...courses];
        
        // Maintain same structure
        if (old?.data?.courses) {
          return {
            ...old,
            data: {
              ...old.data,
              courses: updatedCourses,
              total: updatedCourses.length
            }
          };
        }
        
        return {
          ...old,
          courses: updatedCourses,
          total: updatedCourses.length
        };
      });
      
      // 2. OPTIMISTICALLY UPDATE STUDENT DASHBOARD
      queryClient.setQueryData(['student-dashboard'], (old: any) => {
        if (!old) return old;
        
        // Update enrollment statistics
        const currentStats = old?.data?.stats || old?.stats || {};
        const updatedStats = {
          ...currentStats,
          courses_enrolled: (currentStats.courses_enrolled || 0) + 1,
          last_activity: new Date().toISOString()
        };
        
        // Maintain same structure
        if (old?.data?.stats) {
          return {
            ...old,
            data: {
              ...old.data,
              stats: updatedStats
            }
          };
        }
        
        return {
          ...old,
          stats: updatedStats
        };
      });
      
      // 3. OPTIMISTICALLY UPDATE COURSE DETAIL (enrollment status)
      queryClient.setQueryData(['course', courseId], (old: any) => {
        if (!old) return old;
        
        // Mark course as enrolled
        const updatedCourse = {
          ...(old?.data || old),
          is_enrolled: true,
          enrollment_status: 'enrolled',
          enrollment_type: enrollmentData?.enrollment_type || 'free',
          enrollment_date: new Date().toISOString()
        };
        
        // Maintain same structure
        if (old?.data) {
          return {
            ...old,
            data: updatedCourse
          };
        }
        
        return updatedCourse;
      });
      
      // 4. OPTIMISTICALLY CREATE ENROLLMENT RECORD
      queryClient.setQueryData(['enrollment', courseId], {
        success: true,
        data: optimisticEnrollment,
        message: 'Enrollment created successfully'
      });
      
      // 5. OPTIMISTICALLY UPDATE RECENT COURSES
      queryClient.setQueryData(['recent-courses'], (old: any) => {
        if (!old) return old;
        
        const courseData = queryClient.getQueryData<CachedCourseData>(['course', courseId]);
        const course = courseData?.data || courseData || {};
        
        const recentCourseEntry = {
          id: courseId,
          title: course.title || 'Loading...',
          thumbnail: course.thumbnail || null,
          last_accessed: new Date().toISOString(),
          progress: { completion_percentage: 0 }
        };
        
        const recentCourses = old?.data?.courses || old?.courses || [];
        const updatedRecent = [recentCourseEntry, ...recentCourses.slice(0, 4)]; // Keep max 5
        
        // Maintain same structure
        if (old?.data?.courses) {
          return {
            ...old,
            data: {
              ...old.data,
              courses: updatedRecent
            }
          };
        }
        
        return {
          ...old,
          courses: updatedRecent
        };
      });
      
      return { 
        previousMyCourses, 
        previousDashboard, 
        previousCourse, 
        previousEnrollment, 
        previousRecentCourses,
        courseId,
        optimisticEnrollment 
      };
    },
    
    // Comprehensive rollback on error
    onError: (error: any, variables, context: any) => {
      // Rollback all optimistic updates
      if (context?.previousMyCourses) {
        queryClient.setQueryData(['my-courses'], context.previousMyCourses);
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(['student-dashboard'], context.previousDashboard);
      }
      if (context?.previousCourse) {
        queryClient.setQueryData(['course', context.courseId], context.previousCourse);
      }
      if (context?.previousEnrollment) {
        queryClient.setQueryData(['enrollment', context.courseId], context.previousEnrollment);
      }
      if (context?.previousRecentCourses) {
        queryClient.setQueryData(['recent-courses'], context.previousRecentCourses);
      }
    },
    
    // Ensure data consistency after enrollment
    onSettled: () => {
      // Invalidate all enrollment-related queries for fresh data
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['course'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['recent-courses'] });
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (data: { courseId: string; enrollmentData?: any }, options?: { onSuccess?: (response: any) => void; onError?: (error: any) => void }) => {
      mutation.mutate(data, {
        onSuccess: (response) => {
          ToastService.success(response?.message || 'Successfully enrolled in course!', 'enroll-course');
          if (options?.onSuccess) {
            options.onSuccess(response);
          }
        },
        onError: (error: any) => {
          ToastService.error(error?.message || 'Something went wrong', 'enroll-course-error');
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
 * Mutation for approving courses with optimistic updates
 * Provides instant UI feedback while API call happens in background
 */
export function useApproveCourse() {
  const queryClient = useQueryClient();
  
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
      ],
      optimistic: {
        // Optimistic update: Update UI immediately before API call
        onMutate: async (courseId: string) => {
          // Cancel any outgoing refetches
          await queryClient.cancelQueries({ 
            predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'admin-courses'
          });
          
          // Snapshot the previous value
          const previousCourses = queryClient.getQueryData(['admin-courses']);
          
          // Optimistically update course status to 'published'
          queryClient.setQueryData(['admin-courses'], (old: any) => {
            if (!old) return old;
            
            // Handle different data structures from useApiQuery
            const courses = old?.data?.courses || old?.courses || [];
            const updatedCourses = courses.map((course: any) => {
              const id = course.id;
              if (id === courseId) {
                return {
                  ...course,
                  status: 'published'
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
          
          return { previousCourses, courseId };
        },
        
        // Rollback on error
        onError: (error, courseId, context) => {
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
      }
    }
  );
}

/**
 * Mutation for rejecting courses with optimistic updates
 * Provides instant UI feedback while API call happens in background
 */
export function useRejectCourse() {
  const queryClient = useQueryClient();
  
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
      ],
      optimistic: {
        // Optimistic update: Update UI immediately before API call
        onMutate: async ({ courseId, reason }: { courseId: string; reason: string }) => {
          // Cancel any outgoing refetches
          await queryClient.cancelQueries({ 
            predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'admin-courses'
          });
          
          // Snapshot the previous value
          const previousCourses = queryClient.getQueryData(['admin-courses']);
          
          // Optimistically update course status to 'rejected' with reason
          queryClient.setQueryData(['admin-courses'], (old: any) => {
            if (!old) return old;
            
            // Handle different data structures from useApiQuery
            const courses = old?.data?.courses || old?.courses || [];
            const updatedCourses = courses.map((course: any) => {
              const id = course.id;
              if (id === courseId) {
                return {
                  ...course,
                  status: 'rejected',
                  rejection_reason: reason
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
          
          return { previousCourses, courseId, reason };
        },
        
        // Rollback on error
        onError: (error, variables, context) => {
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
    
    // Optimistic update - Update UI immediately for ALL paginated admin-courses queries
    onMutate: async ({ courseId, isFree }) => {
      // Cancel any outgoing refetches for all admin-courses queries
      await queryClient.cancelQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'admin-courses'
      });
      
      // Get all admin-courses cache keys
      const cacheKeys = queryClient.getQueryCache().findAll({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'admin-courses'
      });

      // Store snapshots for all admin-courses caches
      const previousData = cacheKeys.map(cache => ({
        queryKey: cache.queryKey,
        data: cache.state.data
      }));
      
      // Optimistically update all admin-courses queries
      cacheKeys.forEach(cache => {
        queryClient.setQueryData(cache.queryKey, (old: any) => {
          if (!old) return old;
          
          // Handle different data structures
          const courses = old?.data?.courses || old?.courses || [];
          const updatedCourses = courses.map((course: any) => {
            const id = course.id;
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
      });
      
      return { previousData, courseId, isFree };
    },
    
    // Rollback on error - restore all admin-courses cache snapshots
    onError: (error: any, variables, context: any) => {
      if (context?.previousData) {
        // Restore all admin-courses cache snapshots
        context.previousData.forEach(({ queryKey, data }: { queryKey: any; data: any }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['admin-courses'],
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course'] });
      queryClient.invalidateQueries({ queryKey: ['featured-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-search'] });
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
    
    // Optimistic update: Update UI immediately before API call for ALL paginated queries
    onMutate: async (courseId: string) => {
        
        // Cancel any outgoing refetches for all admin-courses queries
        await queryClient.cancelQueries({ 
          predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'admin-courses'
        });
        
        // Get all admin-courses cache keys
        const cacheKeys = queryClient.getQueryCache().findAll({
          predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'admin-courses'
        });
        
        // Store snapshots for all admin-courses caches
        const previousData = cacheKeys.map(cache => ({
          queryKey: cache.queryKey,
          data: cache.state.data
        }));
        
        // Optimistically update all admin-courses queries
        cacheKeys.forEach(cache => {
          queryClient.setQueryData(cache.queryKey, (old: any) => {
          
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
            const id = course.id;
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
        });
        
        // Return context with previous data for potential rollback
        return { previousData, courseId };
      },
      
      // On error: rollback optimistic update for all admin-courses queries
      onError: (error: any, courseId: string, context: any) => {
        
        // Restore all admin-courses cache snapshots
        if (context?.previousData) {
          context.previousData.forEach(({ queryKey, data }: { queryKey: any; data: any }) => {
            queryClient.setQueryData(queryKey, data);
          });
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
        
        // Also invalidate public caches so deleted course disappears from public view
        await queryClient.invalidateQueries({ queryKey: ['courses'] });
        await queryClient.invalidateQueries({ queryKey: ['course'] });
        await queryClient.invalidateQueries({ queryKey: ['featured-courses'] });
        await queryClient.invalidateQueries({ queryKey: ['course-search'] });
        
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
 * Mutation for creating new chapters with optimistic updates
 * Critical: Instant chapter addition for course builder workflow
 */
export function useCreateChapter() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: ({ courseId, chapterData }: { courseId: string; chapterData: any }) => 
      createChapter({ course_id: courseId, ...chapterData }),
    
    // Optimistic update: Add chapter immediately to UI
    onMutate: async ({ courseId, chapterData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'course-chapters'
      });
      
      // Snapshot previous data for rollback
      const previousData = queryClient.getQueryData(['course-chapters', courseId]);
      
      // Generate optimistic chapter data
      const tempChapter = {
        id: `temp-${Date.now()}`, // Temporary ID
        course_id: courseId,
        title: chapterData.title || `Untitled Chapter #${Math.floor(Math.random() * 100)}`,
        description: chapterData.description || '',
        order: 999, // Will be corrected by backend
        total_lessons: 0,
        total_duration: 0,
        status: 'draft',
        lessons: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Optimistically add new chapter to course chapters
      queryClient.setQueryData(['course-chapters', courseId], (old: any) => {
        if (!old) return old;
        
        // Handle different data structures
        const chapters = old?.data?.chapters || old?.chapters || [];
        const updatedChapters = [...chapters, tempChapter];
        
        // Maintain same structure
        if (old?.data?.chapters) {
          return {
            ...old,
            data: {
              ...old.data,
              chapters: updatedChapters,
              total_chapters: updatedChapters.length
            }
          };
        }
        
        return {
          ...old,
          chapters: updatedChapters,
          total_chapters: updatedChapters.length
        };
      });
      
      return { previousData, courseId, tempChapter };
    },
    
    // Rollback on error
    onError: (error: any, variables, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(['course-chapters', context.courseId], context.previousData);
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: (data, error, variables) => {
      // Invalidate with specific courseId
      queryClient.invalidateQueries({ queryKey: ['course-chapters', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-editor', variables.courseId] });
      // Also invalidate general lists
      queryClient.invalidateQueries({ queryKey: ['chapters', variables.courseId] });
      // Invalidate course and search cache since chapter count/structure changed
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-search'] });
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (data: { courseId: string; chapterData: any }, options?: { onSuccess?: (response: any) => void; onError?: (error: any) => void }) => {
      mutation.mutate(data, {
        onSuccess: (response) => {
          ToastService.success(response?.message || 'Chapter created successfully', 'create-chapter');
          if (options?.onSuccess) {
            options.onSuccess(response);
          }
        },
        onError: (error: any) => {
          ToastService.error(error?.message || 'Something went wrong', 'create-chapter-error');
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
 * Mutation for updating chapter data with optimistic updates
 * Critical: Instant chapter edits for content management workflow
 */
export function useUpdateChapter() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: ({ chapterId, chapterData }: { chapterId: string; chapterData: any }) => 
      updateChapter(chapterId, chapterData),
    
    // Optimistic update: Update chapter data immediately
    onMutate: async ({ chapterId, chapterData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'course-chapters'
      });
      
      // Store snapshots for all course-chapters caches
      const cacheKeys = queryClient.getQueryCache().findAll({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'course-chapters'
      });
      
      const snapshots: any[] = [];
      
      // Update all course-chapters caches that contain this chapter
      cacheKeys.forEach((cache) => {
        const data = queryClient.getQueryData(cache.queryKey);
        snapshots.push({ key: cache.queryKey, data });
        
        // Optimistically update chapter data
        queryClient.setQueryData(cache.queryKey, (old: any) => {
          if (!old) return old;
          
          // Handle different data structures
          const chapters = old?.data?.chapters || old?.chapters || [];
          
          const updatedChapters = chapters.map((chapter: any) => {
            if (chapter.id === chapterId) {
              return {
                ...chapter,
                ...chapterData,
                updated_at: new Date().toISOString()
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
      
      return { snapshots, chapterId, chapterData };
    },
    
    // Rollback on error
    onError: (error: any, variables, context: any) => {
      if (context?.snapshots) {
        context.snapshots.forEach((snapshot: any) => {
          queryClient.setQueryData(snapshot.key, snapshot.data);
        });
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: (data, error, variables) => {
      // Need to extract courseId from the response or cache
      if (data?.data?.course_id) {
        queryClient.invalidateQueries({ queryKey: ['course-chapters', data.data.course_id] });
        queryClient.invalidateQueries({ queryKey: ['chapters', data.data.course_id] });
        queryClient.invalidateQueries({ queryKey: ['course', data.data.course_id] });
        queryClient.invalidateQueries({ queryKey: ['course-search'] });
      }
      // Also invalidate the specific chapter
      queryClient.invalidateQueries({ queryKey: ['chapter', variables.chapterId] });
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (data: { chapterId: string; chapterData: any }, options?: { onSuccess?: (response: any) => void; onError?: (error: any) => void }) => {
      mutation.mutate(data, {
        onSuccess: (response) => {
          ToastService.success(response?.message || 'Chapter updated successfully', 'update-chapter');
          if (options?.onSuccess) {
            options.onSuccess(response);
          }
        },
        onError: (error: any) => {
          ToastService.error(error?.message || 'Something went wrong', 'update-chapter-error');
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
 * Mutation for creating new lessons with optimistic updates
 * Critical: Instant lesson addition for course builder workflow
 */
export function useCreateLesson() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: (lessonData: any) => 
      createLesson(lessonData),
    
    // Optimistic update: Add lesson immediately to chapter
    onMutate: async (lessonData: any) => {
      const chapterId = lessonData.chapter_id;
      const courseId = lessonData.course_id;
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'course-chapters'
      });
      
      // Store snapshots for all course-chapters caches
      const cacheKeys = queryClient.getQueryCache().findAll({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'course-chapters'
      });
      
      const snapshots: any[] = [];
      
      // Generate optimistic lesson data
      const tempLesson = {
        id: `temp-${Date.now()}`, // Temporary ID
        chapter_id: chapterId,
        course_id: courseId,
        title: lessonData.title || `Untitled Lesson #${Math.floor(Math.random() * 100)}`,
        description: lessonData.description || '',
        order: 999, // Will be corrected by backend
        video: lessonData.video || null,
        content: lessonData.content || '',
        resources: lessonData.resources || [],
        has_quiz: false,
        quiz_required: false,
        status: 'draft',
        unlock_conditions: {
          previous_lesson_required: true,
          quiz_pass_required: false,
          minimum_watch_percentage: 80
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add lesson to relevant chapter in all caches
      cacheKeys.forEach((cache) => {
        const data = queryClient.getQueryData(cache.queryKey);
        snapshots.push({ key: cache.queryKey, data });
        
        // Optimistically add new lesson to chapter
        queryClient.setQueryData(cache.queryKey, (old: any) => {
          if (!old) return old;
          
          // Handle different data structures
          const chapters = old?.data?.chapters || old?.chapters || [];
          
          const updatedChapters = chapters.map((chapter: any) => {
            if (chapter.id === chapterId) {
              const existingLessons = chapter.lessons || [];
              return {
                ...chapter,
                lessons: [...existingLessons, tempLesson],
                total_lessons: existingLessons.length + 1,
                total_duration: chapter.total_duration || 0 // Keep existing or default
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
      
      return { snapshots, chapterId, courseId, tempLesson };
    },
    
    // Rollback on error
    onError: (error: any, variables, context: any) => {
      if (context?.snapshots) {
        context.snapshots.forEach((snapshot: any) => {
          queryClient.setQueryData(snapshot.key, snapshot.data);
        });
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['course-chapters'] });
      queryClient.invalidateQueries({ queryKey: ['course'] }); // Update lesson count
      queryClient.invalidateQueries({ queryKey: ['course-search'] }); // Update search results
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (data: any, options?: { onSuccess?: (response: any) => void; onError?: (error: any) => void }) => {
      mutation.mutate(data, {
        onSuccess: (response) => {
          ToastService.success(response?.message || 'Lesson created successfully', 'create-lesson');
          if (options?.onSuccess) {
            options.onSuccess(response);
          }
        },
        onError: (error: any) => {
          ToastService.error(error?.message || 'Something went wrong', 'create-lesson-error');
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
 * Mutation for updating lesson data with optimistic updates
 * Critical: Instant lesson edits for content management workflow
 */
export function useUpdateLesson() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: any }) => 
      updateLesson(lessonId, data),
    
    // Optimistic update: Update lesson data immediately
    onMutate: async ({ lessonId, data: lessonData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'course-chapters'
      });
      
      // Store snapshots for all course-chapters caches
      const cacheKeys = queryClient.getQueryCache().findAll({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'course-chapters'
      });
      
      const snapshots: any[] = [];
      
      // Update lesson in all relevant caches
      cacheKeys.forEach((cache) => {
        const data = queryClient.getQueryData(cache.queryKey);
        snapshots.push({ key: cache.queryKey, data });
        
        // Optimistically update lesson data
        queryClient.setQueryData(cache.queryKey, (old: any) => {
          if (!old) return old;
          
          // Handle different data structures
          const chapters = old?.data?.chapters || old?.chapters || [];
          
          const updatedChapters = chapters.map((chapter: any) => {
            if (chapter.lessons && Array.isArray(chapter.lessons)) {
              const updatedLessons = chapter.lessons.map((lesson: any) => {
                if (lesson.id === lessonId) {
                  return {
                    ...lesson,
                    ...lessonData,
                    updated_at: new Date().toISOString()
                  };
                }
                return lesson;
              });
              
              // Only update chapter if lessons changed
              if (updatedLessons !== chapter.lessons) {
                return {
                  ...chapter,
                  lessons: updatedLessons
                };
              }
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
      
      return { snapshots, lessonId, lessonData };
    },
    
    // Rollback on error
    onError: (error: any, variables, context: any) => {
      if (context?.snapshots) {
        context.snapshots.forEach((snapshot: any) => {
          queryClient.setQueryData(snapshot.key, snapshot.data);
        });
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['course-chapters'] });
      queryClient.invalidateQueries({ queryKey: ['course'] }); // Update lesson data
      queryClient.invalidateQueries({ queryKey: ['course-search'] }); // Update search results
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (data: { lessonId: string; data: any }, options?: { onSuccess?: (response: any) => void; onError?: (error: any) => void }) => {
      mutation.mutate(data, {
        onSuccess: (response) => {
          ToastService.success(response?.message || 'Lesson updated successfully', 'update-lesson');
          if (options?.onSuccess) {
            options.onSuccess(response);
          }
        },
        onError: (error: any) => {
          ToastService.error(error?.message || 'Something went wrong', 'update-lesson-error');
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
            const chapterIdMatch = chapter.id === chapterId;
            
            if (chapterIdMatch && chapter.lessons) {
              // Sort lessons based on new order
              const reorderedLessons = [...chapter.lessons].sort((a: any, b: any) => {
                const aId = a.id;
                const bId = b.id;
                const aOrder = orderMap.get(aId) || a.order || 999;
                const bOrder = orderMap.get(bId) || b.order || 999;
                return aOrder - bOrder;
              });
              
              // Update order property on each lesson
              const updatedLessons = reorderedLessons.map((lesson: any, index: number) => {
                const lessonId = lesson.id;
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
export function useCreatorDashboardQuery(enabled: boolean = true) {
  return useApiQuery(
    ['creator-analytics-overview', '30days'],
    () => api.get('/analytics/creator/overview?time_range=30days', { requireAuth: true }),
    {
      enabled: enabled,
      ...getCacheConfig('USER_DASHBOARD') // 2min moderate - dashboard can have slight delay
    }
  );
}

/**
 * Hook for creator's course list
 */
export function useCreatorCoursesQuery(enabled: boolean = true) {
  return useApiQuery(
    ['creator-courses'],
    () => api.get('/courses', { requireAuth: true }),
    {
      enabled: enabled,
      ...getCacheConfig('CONTENT_CREATION') // Realtime - CRUD operations need immediate updates
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