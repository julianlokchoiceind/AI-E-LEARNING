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
import { Container } from '@/components/ui/Container';
import { SkeletonBox, SkeletonCircle, EmptyState } from '@/components/ui/LoadingStates';
import { ToastService } from '@/lib/toast/ToastService';
import { getAttachmentUrl } from '@/lib/utils/attachmentUrl';

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
    lesson_id: string | null;
    lesson_title: string;
    chapter_title: string | null;
    estimated_time: number | null;
    lesson_order: number;
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
      <Container variant="public">
        {/* Welcome Section - STATIC */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-muted-foreground">
            Continue your learning journey and track your progress
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-background rounded-lg border p-6">
              <SkeletonBox className="h-4 w-20 mb-2" />
              <SkeletonBox className="h-8 w-12 mb-1" />
              <SkeletonBox className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Courses */}
          <div className="lg:col-span-2">
            <div className="bg-background rounded-lg border p-6">
              <SkeletonBox className="h-6 w-32 mb-6" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <SkeletonBox className="h-16 w-16 rounded" />
                    <div className="flex-1">
                      <SkeletonBox className="h-5 w-48 mb-2" />
                      <SkeletonBox className="h-4 w-24 mb-2" />
                      <SkeletonBox className="h-2 w-full rounded-full" />
                    </div>
                    <SkeletonBox className="h-8 w-20 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-background rounded-lg border p-6">
              <SkeletonBox className="h-6 w-24 mb-4" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <SkeletonBox className="h-4 w-16" />
                  <SkeletonBox className="h-4 w-8" />
                </div>
                <SkeletonBox className="h-2 w-full rounded-full" />
              </div>
            </div>

            {/* Upcoming Lessons */}
            <div className="bg-background rounded-lg border p-6">
              <SkeletonBox className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-3 bg-muted rounded-lg">
                    <SkeletonBox className="h-4 w-full mb-1" />
                    <SkeletonBox className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container variant="public">
        <EmptyState
          title="Unable to load dashboard"
          description="There was a problem loading your dashboard data. Please try again."
          action={{
            label: 'Retry',
            onClick: refreshDashboard
          }}
        />
      </Container>
    );
  }

  return (
    <Container variant="public">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {dashboardData.user.name}!
        </h1>
        <p className="text-muted-foreground">
          Continue your learning journey and track your progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Enrolled Courses</p>
              <p className="text-2xl font-bold">{dashboardData.stats.total_courses}</p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{dashboardData.stats.completed_courses}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Hours Learned</p>
              <p className="text-2xl font-bold">{dashboardData.stats.total_hours_learned}</p>
            </div>
            <div className="text-4xl">⏱️</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
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
                        src={getAttachmentUrl(course.thumbnail)}
                        alt={course.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-24 h-16 bg-muted rounded flex items-center justify-center">
                        <span className="text-muted-foreground">📚</span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{course.title}</h3>
                      <div className="mb-2">
                        <ProgressBar value={course.progress} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {course.progress}% complete
                        {course.last_accessed_display && (
                          <span> • Last accessed {course.last_accessed_display}</span>
                        )}
                      </p>
                    </div>
                    
                    <Link
                      href={
                        course.continue_lesson_id 
                          ? `/learn/${course.id}/${course.continue_lesson_id}`
                          : course.current_lesson_id
                          ? `/learn/${course.id}/${course.current_lesson_id}`
                          : `/courses/${course.id}`
                      }
                      className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
                    >
                      {course.progress >= 95 ? 'Review' : course.continue_lesson_id || course.current_lesson_id || course.progress > 0 ? 'Continue' : 'Start'}
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
                <p className="text-sm text-muted-foreground">No upcoming lessons</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {dashboardData.upcoming_lessons.map((lesson: any, index: number) => (
                  <Card 
                    key={index} 
                    className={`p-4 ${lesson.lesson_id ? 'hover:bg-muted/50 cursor-pointer transition-colors' : ''}`}
                    onClick={() => {
                      if (lesson.lesson_id) {
                        router.push(`/learn/${lesson.course_id}/${lesson.lesson_id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {lesson.lesson_title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lesson.course_title}
                          {lesson.chapter_title && (
                            <span> • {lesson.chapter_title}</span>
                          )}
                          {lesson.estimated_time && lesson.estimated_time > 0 && (
                            <span> • {lesson.estimated_time} min</span>
                          )}
                        </p>
                      </div>
                      {lesson.lesson_id && (
                        <span className="text-primary text-xs">→</span>
                      )}
                    </div>
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
                className="block w-full text-center bg-muted hover:bg-muted/80 py-2 rounded transition-colors"
              >
                Browse New Courses
              </Link>
              <Link
                href="/certificates"
                className="block w-full text-center bg-muted hover:bg-muted/80 py-2 rounded transition-colors"
              >
                View Certificates
              </Link>
              <Link
                href="/profile"
                className="block w-full text-center bg-muted hover:bg-muted/80 py-2 rounded transition-colors"
              >
                Edit Profile
              </Link>
              <button
                onClick={() => setShowExportModal(true)}
                className="block w-full text-center bg-primary/20 hover:bg-primary/30 py-2 rounded transition-colors text-primary"
              >
                📊 Export Progress
              </button>
              <button
                onClick={() => setShowOnboardingModal(true)}
                className="block w-full text-center bg-secondary/20 hover:bg-secondary/30 py-2 rounded transition-colors text-secondary"
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
    </Container>
  );
}