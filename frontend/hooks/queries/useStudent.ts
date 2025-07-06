'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
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
export function useStudentDashboardQuery() {
  return useApiQuery(
    ['student-dashboard'],
    () => usersApi.getDashboard(),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes - recent activity
      gcTime: 10 * 60 * 1000, // 10 minutes cache
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
      staleTime: 5 * 60 * 1000, // 5 minutes - course list
      gcTime: 30 * 60 * 1000, // 30 minutes cache
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
      return api.get<any>(`/courses/${courseId}/progress`, { requireAuth: true });
    },
    {
      enabled: enabled && !!courseId,
      staleTime: 1 * 60 * 1000, // 1 minute - progress updates frequently
      gcTime: 10 * 60 * 1000, // 10 minutes cache
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
      return api.patch<any>(`/lessons/${lessonId}/progress`, progress, { requireAuth: true });
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
      return api.post<any>(`/lessons/${lessonId}/complete`, 
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
      staleTime: 10 * 60 * 1000, // 10 minutes - certificates don't change often
      gcTime: 60 * 60 * 1000, // 1 hour cache
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
      staleTime: 5 * 60 * 1000, // 5 minutes - stats update periodically
      gcTime: 30 * 60 * 1000, // 30 minutes cache
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
      staleTime: 3 * 60 * 1000, // 3 minutes - recent activity
      gcTime: 15 * 60 * 1000, // 15 minutes cache
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
      const response = await api.get<any>(`/courses/${courseId}/progress`, { requireAuth: true });
      
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
      staleTime: 2 * 60 * 1000, // 2 minutes - completion status
      gcTime: 10 * 60 * 1000, // 10 minutes cache
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
      return api.get<any>('/users/onboarding-status', { requireAuth: true });
    },
    {
      enabled,
      staleTime: 10 * 60 * 1000, // 10 minutes - onboarding status rarely changes
      gcTime: 30 * 60 * 1000, // 30 minutes cache
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
      staleTime: 15 * 60 * 1000, // 15 minutes - recommendations don't change often
      gcTime: 60 * 60 * 1000, // 1 hour cache
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
    }
  );
}

// =============================================================================
// MISSING FUNCTIONS - Progress export functionality
// =============================================================================

/**
 * Export student progress data
 */
export function useExportProgress() {
  return useApiMutation(
    async (params?: { format?: 'pdf' | 'excel' | 'csv'; courseIds?: string[] }) => {
      const { format = 'pdf', courseIds } = params || {};
      
      return api.post<any>('/student/export-progress', {
        format,
        course_ids: courseIds
      });
    },
    {
      // No need to invalidate queries for export
    }
  );
}