'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { usersApi } from '@/lib/api/users';
import { api } from '@/lib/api/api-client';
import { 
  startOnboarding, 
  updateLearningPath, 
  updateProfileSetup, 
  getCourseRecommendations,
  completeOnboarding,
  skipOnboarding
} from '@/lib/api/onboarding';

// Types for student queries
interface LessonProgressUpdate {
  lessonId: string;
  progress: {
    watchPercentage: number;
    currentPosition: number;
    totalWatchTime: number;
  };
}

interface LessonCompletion {
  lessonId: string;
  courseId: string;
  quizScore?: number;
}

/**
 * STUDENT DASHBOARD - Primary student interface
 * Critical: 80% of users start here daily
 */
export function useStudentDashboardQuery(enabled: boolean = true) {
  return useApiQuery(
    ['student-dashboard'],
    () => usersApi.getDashboard(),
    {
      enabled,
      showToast: false, // Disable toasts for dashboard - use graceful degradation instead
      ...getCacheConfig('STUDENT_DASHBOARD') // Student dashboard - fresh data
    }
  );
}

/**
 * MY ENROLLED COURSES - Student course library
 * Critical: Primary navigation for learning
 */
export function useMyCoursesQuery() {
  return useApiQuery(
    ['my-courses'],
    async () => {
      return api.get<any>('/users/my-courses', { requireAuth: true });
    },
    {
      showToast: false, // Disable toasts for dashboard my-courses page - use graceful degradation
      ...getCacheConfig('USER_COURSES') // User courses - moderate freshness
    }
  );
}

/**
 * COURSE PROGRESS - Individual course progress
 * Critical: Learning progress tracking
 */
export function useCourseProgressQuery(courseId: string, enabled: boolean = true) {
  return useApiQuery(
    ['course-progress', courseId],
    async () => {
      return api.get<any>(`/progress/courses/${courseId}/progress`, { requireAuth: true });
    },
    {
      enabled: enabled && !!courseId,
      showToast: false, // Disable toasts for dashboard progress tracking - use graceful degradation
      ...getCacheConfig('COURSE_PROGRESS') // Course progress - fresh data
    }
  );
}

/**
 * UPDATE LESSON PROGRESS - Real-time video progress
 * Critical: Core learning functionality
 */
export function useUpdateLessonProgress() {
  return useApiMutation(
    async ({ lessonId, progress }: LessonProgressUpdate) => {
      return api.put<any>(`/progress/lessons/${lessonId}/progress`, progress, { requireAuth: true });
    },
    {
      invalidateQueries: [
        ['course-progress'], // Refresh course progress
        ['student-dashboard'], // Update dashboard stats
        ['lesson-progress'], // Refresh lesson details
      ],
      // Don't show toast for progress updates (too frequent)
      showToast: false,
    }
  );
}

/**
 * MARK LESSON COMPLETE - Lesson completion
 * Critical: Sequential learning progression
 */
export function useMarkLessonComplete() {
  return useApiMutation(
    async ({ lessonId, courseId, quizScore }: LessonCompletion) => {
      return api.post<any>(`/progress/lessons/${lessonId}/complete`, 
        { courseId, quizScore }, 
        { requireAuth: true }
      );
    },
    {
      invalidateQueries: [
        ['course-progress'], // Refresh course progress
        ['my-courses'], // Update course completion status
        ['student-dashboard'], // Update dashboard stats
      ],
      operationName: 'mark-lesson-complete', // Unique operation ID for toast deduplication
      showToast: false, // Disable toasts for dashboard lesson completion - use inline feedback
    }
  );
}

/**
 * MY CERTIFICATES - Student achievements
 * Medium-impact: Motivation and credentialing
 */
export function useMyCertificatesQuery() {
  return useApiQuery(
    ['my-certificates'],
    async () => {
      return api.get<any>('/users/certificates', { requireAuth: true });
    },
    {
      showToast: false, // Disable toasts for dashboard certificates page - use graceful degradation
      ...getCacheConfig('USER_CERTIFICATES') // User certificates - stable content
    }
  );
}

/**
 * PROGRESS STATISTICS - Learning analytics
 * Medium-impact: Student insights and motivation
 */
export function useProgressStatisticsQuery() {
  return useApiQuery(
    ['progress-statistics'],
    async () => {
      return api.get<any>('/users/progress-statistics', { requireAuth: true });
    },
    {
      showToast: false, // Disable toasts for dashboard statistics page - use graceful degradation
      ...getCacheConfig('PROGRESS_STATISTICS') // Progress statistics - moderate freshness
    }
  );
}

/**
 * RECENTLY ACCESSED COURSES - Quick navigation
 * High-impact: Improves learning continuation
 */
export function useRecentCoursesQuery() {
  return useApiQuery(
    ['recent-courses'],
    async () => {
      return api.get<any>('/users/recent-courses?limit=5', { requireAuth: true });
    },
    {
      showToast: false, // Disable toasts for dashboard recent courses - use graceful degradation
      ...getCacheConfig('RECENT_COURSES') // Recent courses - fresh data
    }
  );
}

/**
 * COURSE COMPLETION STATUS - Check if course is completed
 * Critical: Certificate eligibility and course completion logic
 */
export function useCourseCompletionQuery(courseId: string) {
  return useApiQuery(
    ['course-completion', courseId],
    async () => {
      const response = await api.get<any>(`/progress/courses/${courseId}/progress`, { requireAuth: true });
      
      const data = response.data;
      const completionData = {
        isCompleted: data.completionPercentage >= 100,
        completionPercentage: data.completionPercentage,
        certificateEligible: data.completionPercentage >= 80,
        completedLessons: data.completedLessons,
        totalLessons: data.totalLessons,
      };
      
      return {
        success: true,
        data: completionData,
        message: 'Course completion status retrieved successfully'
      };
    },
    {
      enabled: !!courseId,
      showToast: false, // Disable toasts for dashboard course completion status - use graceful degradation
      ...getCacheConfig('COURSE_COMPLETION') // Course completion - moderate freshness
    }
  );
}

/**
 * ONBOARDING STATUS - Check if user needs onboarding
 * High-impact: First-time user experience
 */
export function useOnboardingStatusQuery(enabled: boolean = true) {
  return useApiQuery(
    ['onboarding-status'],
    async () => {
      return api.get<any>('/onboarding/status', { requireAuth: true });
    },
    {
      enabled,
      showToast: false, // Disable toasts for dashboard onboarding status - use graceful degradation
      ...getCacheConfig('ONBOARDING_STATUS') // Onboarding status - stable content
    }
  );
}

// =============================================================================
// ONBOARDING MUTATIONS - Student onboarding flow
// =============================================================================

/**
 * START ONBOARDING - Begin the onboarding process
 * Critical: First-time user experience
 */
export function useStartOnboarding() {
  return useApiMutation(
    (skipWelcome: boolean = false) => startOnboarding(skipWelcome),
    {
      invalidateQueries: [
        ['onboarding-status'], // Refresh onboarding status
        ['student-dashboard'], // Update dashboard
      ],
      operationName: 'start-onboarding', // Unique operation ID for toast deduplication
      showToast: false, // Disable toasts for dashboard onboarding - use inline feedback
    }
  );
}

/**
 * SKIP ONBOARDING - Skip the onboarding process
 * Medium-impact: Alternative path for experienced users
 */
export function useSkipOnboarding() {
  return useApiMutation(
    () => skipOnboarding(),
    {
      invalidateQueries: [
        ['onboarding-status'], // Refresh onboarding status
        ['student-dashboard'], // Update dashboard
      ],
      operationName: 'skip-onboarding', // Unique operation ID for toast deduplication
      showToast: false, // Disable toasts for dashboard onboarding - use inline feedback
    }
  );
}

/**
 * UPDATE LEARNING PATH - Set user's learning preferences
 * Critical: Personalization setup
 */
export function useUpdateLearningPath() {
  return useApiMutation(
    (pathData: {
      selected_paths: string[];
      skill_level: string;
      time_commitment: string;
      learning_goals: string[];
    }) => updateLearningPath(pathData),
    {
      invalidateQueries: [
        ['onboarding-status'], // Refresh onboarding status
      ],
      operationName: 'update-learning-path', // Unique operation ID for toast deduplication
      showToast: false, // Disable toasts for dashboard learning path setup - use inline feedback
    }
  );
}

/**
 * UPDATE PROFILE SETUP - Complete profile information
 * Medium-impact: Profile completion
 */
export function useUpdateProfileSetup() {
  return useApiMutation(
    (profileData: {
      bio: string;
      title: string;
      location: string;
      interests: string[];
      career_goals: string[];
      linkedin: string;
      github: string;
    }) => updateProfileSetup(profileData),
    {
      invalidateQueries: [
        ['onboarding-status'], // Refresh onboarding status
        ['student-dashboard'], // Update dashboard with profile
      ],
      operationName: 'update-profile-setup', // Unique operation ID for toast deduplication
      showToast: false, // Disable toasts for dashboard profile setup - use inline feedback
    }
  );
}

/**
 * GET COURSE RECOMMENDATIONS - Get personalized course suggestions
 * High-impact: Course discovery and engagement
 */
export function useCourseRecommendationsQuery(enabled: boolean = true) {
  return useApiQuery(
    ['course-recommendations'],
    () => getCourseRecommendations(),
    {
      enabled,
      showToast: false, // Disable toasts for dashboard course recommendations - use graceful degradation
      ...getCacheConfig('COURSE_RECOMMENDATIONS') // Course recommendations - stable content
    }
  );
}

/**
 * COMPLETE ONBOARDING - Finish the onboarding process
 * Critical: Final onboarding step
 */
export function useCompleteOnboarding() {
  return useApiMutation(
    (completionData: {
      selected_courses: string[];
      subscribe_to_newsletter: boolean;
      enable_notifications: boolean;
    }) => completeOnboarding(completionData),
    {
      invalidateQueries: [
        ['onboarding-status'], // Refresh onboarding status
        ['student-dashboard'], // Update dashboard
        ['my-courses'], // Refresh enrolled courses
      ],
      operationName: 'complete-onboarding', // Unique operation ID for toast deduplication
      showToast: false, // Disable toasts for dashboard onboarding completion - use inline feedback
    }
  );
}

// =============================================================================
// MISSING FUNCTIONS - Progress export functionality
// =============================================================================

/**
 * Export student progress data
 * FIXED: Use download() method for binary data (PDF/CSV) instead of get()
 */
export function useExportProgress() {
  return useApiMutation(
    async (params?: { format?: 'pdf' | 'csv'; courseIds?: string[] }) => {
      const { format = 'pdf', courseIds } = params || {};
      
      // Use download() method which returns Blob for binary data
      const blob = await api.download(`/progress/export/${format}`, { requireAuth: true });
      
      // Return blob wrapped in StandardResponse format for consistency
      return {
        success: true,
        data: blob,
        message: `Progress exported as ${format.toUpperCase()} successfully`
      };
    },
    {
      // No need to invalidate queries for export
      operationName: 'export-progress', // Unique operation ID for toast deduplication
      showToast: false, // We'll show custom toast in component
    }
  );
}