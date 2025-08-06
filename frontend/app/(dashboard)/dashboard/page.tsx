'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { InlineChatComponent } from '@/components/feature/InlineChatComponent';
import { AccessDenied } from '@/components/feature/AccessDenied';
import { ExportProgressModal } from '@/components/feature/ExportProgressModal';
import { OnboardingWizard } from '@/components/feature/OnboardingWizard';
import { useStudentDashboardQuery } from '@/hooks/queries/useStudent';
import { useOnboarding } from '@/hooks/useOnboarding';
import { formatDistanceToNow } from '@/lib/utils/formatters';
import { LoadingSpinner, EmptyState, CourseCardSkeleton } from '@/components/ui/LoadingStates';
import { ToastService } from '@/lib/toast/ToastService';

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    premium_status: boolean;
  };
  stats: {
    total_courses: number;
    completed_courses: number;
    in_progress_courses: number;
    total_hours_learned: number;
    current_streak: number;
    longest_streak: number;
  };
  recent_courses: Array<{
    id: string;
    title: string;
    thumbnail?: string;
    progress: number;
    last_accessed?: string;
    last_accessed_display?: string;
    continue_lesson_id?: string;
  }>;
  upcoming_lessons: Array<{
    course_id: string;
    course_title: string;
    lesson_title: string;
    estimated_time: number;
  }>;
  certificates_earned: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [showExportModal, setShowExportModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessError = searchParams.get('error');
  
  // React Query hook - automatic caching and state management
  // Only fetch when user is authenticated
  const { data: dashboardResponse, loading, execute: refetchDashboard } = useStudentDashboardQuery(!authLoading && !!user);
  
  const { shouldShowOnboarding, refetchStatus } = useOnboarding();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  
  // Extract dashboard data from React Query response
  // dashboardResponse is already StandardResponse<DashboardData>
  const dashboardData = dashboardResponse?.data || null;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Show access denied message if redirected from unauthorized route
    if (accessError === 'access_denied') {
      ToastService.error('Access denied: You do not have permission to access that page');
      // Clean the URL without causing redirect loop
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url);
    }
  }, [accessError]);

  // Show onboarding modal when needed
  useEffect(() => {
    if (shouldShowOnboarding && !authLoading && !loading) {
      setShowOnboardingModal(true);
    }
  }, [shouldShowOnboarding, authLoading, loading]);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    setShowOnboardingModal(false);
    
    // Refresh onboarding status
    await refetchStatus();
    
    // Refresh dashboard data to show any new courses from onboarding
    await refetchDashboard();
    
    ToastService.success('Welcome to the platform! Your personalized dashboard is ready.');
  };

  // Handle onboarding close (skip or manual close)
  const handleOnboardingClose = () => {
    setShowOnboardingModal(false);
  };

  // Refresh function for manual data reload - now uses React Query
  const refreshDashboard = async () => {
    if (!user) return;
    
    try {
      // React Query refetch - automatic error handling and caching
      await refetchDashboard();
      ToastService.success('Dashboard refreshed');
    } catch (error) {
      // Error handling is automatic via React Query
      console.error('Dashboard refresh error:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading your dashboard..." />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Unable to load dashboard"
          description="There was a problem loading your dashboard data. Please try again."
          action={{
            label: 'Retry',
            onClick: refreshDashboard
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {dashboardData.user.name}!
        </h1>
        <p className="text-gray-600">
          Continue your learning journey and track your progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enrolled Courses</p>
              <p className="text-2xl font-bold">{dashboardData.stats.total_courses}</p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold">{dashboardData.stats.completed_courses}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hours Learned</p>
              <p className="text-2xl font-bold">{dashboardData.stats.total_hours_learned}</p>
            </div>
            <div className="text-4xl">⏱️</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold">{dashboardData.stats.current_streak} days</p>
            </div>
            <div className="text-4xl">🔥</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Courses */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Continue Learning</h2>
            <Link 
              href="/my-courses" 
              className="text-primary hover:underline text-sm"
            >
              View all courses →
            </Link>
          </div>

          {dashboardData.recent_courses.length === 0 ? (
            <Card className="p-8">
              <EmptyState
                title="No courses yet"
                description="You haven't enrolled in any courses yet. Start learning today!"
                action={{
                  label: 'Browse Courses',
                  onClick: () => router.push('/courses')
                }}
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {dashboardData.recent_courses.map((course: any) => (
                <Card key={course.id} className="p-4">
                  <div className="flex items-center gap-4">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-24 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400">📚</span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{course.title}</h3>
                      <div className="mb-2">
                        <ProgressBar value={course.progress} />
                      </div>
                      <p className="text-sm text-gray-500">
                        {course.progress}% complete
                        {course.last_accessed_display && (
                          <span> • Last accessed {course.last_accessed_display}</span>
                        )}
                      </p>
                    </div>
                    
                    <Link
                      href={course.continue_lesson_id ? `/learn/${course.id}/${course.continue_lesson_id}` : `/courses/${course.id}`}
                      className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
                    >
                      {course.continue_lesson_id || course.progress > 0 ? 'Continue' : 'Start'}
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Lessons */}
          <div>
            <h3 className="text-lg font-bold mb-3">Upcoming Lessons</h3>
            {dashboardData.upcoming_lessons.length === 0 ? (
              <Card className="p-4">
                <p className="text-sm text-gray-500">No upcoming lessons</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {dashboardData.upcoming_lessons.map((lesson: any, index: number) => (
                  <Card key={index} className="p-4">
                    <p className="font-medium text-sm">{lesson.lesson_title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {lesson.course_title} • {lesson.estimated_time} min
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div>
            <h3 className="text-lg font-bold mb-3">Achievements</h3>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm">Certificates Earned</span>
                <span className="font-bold">{dashboardData.certificates_earned}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Longest Streak</span>
                <span className="font-bold">{dashboardData.stats.longest_streak} days</span>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-bold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/courses"
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 py-2 rounded transition-colors"
              >
                Browse New Courses
              </Link>
              <Link
                href="/certificates"
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 py-2 rounded transition-colors"
              >
                View Certificates
              </Link>
              <Link
                href="/profile"
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 py-2 rounded transition-colors"
              >
                Edit Profile
              </Link>
              <button
                onClick={() => setShowExportModal(true)}
                className="block w-full text-center bg-blue-100 hover:bg-blue-200 py-2 rounded transition-colors text-blue-700"
              >
                📊 Export Progress
              </button>
              <button
                onClick={() => setShowOnboardingModal(true)}
                className="block w-full text-center bg-purple-100 hover:bg-purple-200 py-2 rounded transition-colors text-purple-700"
              >
                🚀 Platform Tour
              </button>
            </div>
          </div>
        </div>

        {/* AI Study Assistant */}
        <div className="mt-8">
          <InlineChatComponent
            title="Ask Your AI Study Buddy"
            placeholder="What would you like to learn today? Ask me anything about your courses!"
            suggestions={[
              "What should I study next?",
              "Help me review my progress",
              "Explain a concept I'm struggling with",
              "Suggest a learning plan for this week"
            ]}
          />
        </div>
      </div>

      {/* Export Progress Modal */}
      <ExportProgressModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Onboarding Wizard Modal */}
      <OnboardingWizard
        isOpen={showOnboardingModal}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}