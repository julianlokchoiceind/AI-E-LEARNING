'use client';

import { useEffect, useState } from 'react';
import { LocaleLink } from '@/components/ui/LocaleLink';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AccessDenied } from '@/components/feature/AccessDenied';
import { ExportProgressModal } from '@/components/feature/ExportProgressModal';
import { OnboardingWizard } from '@/components/feature/OnboardingWizard';
import { useStudentDashboardQuery } from '@/hooks/queries/useStudent';
import { useOnboarding } from '@/hooks/useOnboarding';
import { formatDistanceToNow } from '@/lib/utils/formatters';
import { Container } from '@/components/ui/Container';
import { SkeletonBox, SkeletonCircle, EmptyState } from '@/components/ui/LoadingStates';
import { useInlineMessage } from '@/hooks/useInlineMessage';
import { InlineMessage } from '@/components/ui/InlineMessage';
import { getAttachmentUrl } from '@/lib/utils/attachmentUrl';
import { BookOpen, CheckCircle, Clock, Flame } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

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
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [showExportModal, setShowExportModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessError = searchParams.get('error');
  
  // Inline messages for dashboard feedback
  const dashboardAccessMessage = useInlineMessage('dashboard-access');
  const dashboardSuccessMessage = useInlineMessage('dashboard-success');
  
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
      dashboardAccessMessage.showError('Access denied: You do not have permission to access that page');
      // Clean the URL without causing redirect loop
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({ }, '', url);
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
    
    dashboardSuccessMessage.showSuccess(t('dashboard.welcomeMessage'));
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
      dashboardSuccessMessage.showSuccess(t('dashboard.refreshSuccess'));
    } catch (error) {
      // Error handling is automatic via React Query
      console.error('Dashboard refresh error:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <Container variant="public" className="!pt-24">
        {/* Welcome Section - STATIC */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">{t('dashboard.welcomeBack')} {user?.name}!</span>
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
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
      <Container variant="public" className="!pt-24">
        <EmptyState
          title={t('dashboard.unableToLoad')}
          description={t('dashboard.unableToLoadDesc')}
          action={{
            label: t('dashboard.retry'),
            onClick: refreshDashboard
          }}
        />
      </Container>
    );
  }

  return (
    <Container variant="public" className="!pt-24">
      {/* Dashboard Messages */}
      {dashboardAccessMessage.message && (
        <InlineMessage 
          message={dashboardAccessMessage.message.message} 
          type={dashboardAccessMessage.message.type}
          onDismiss={dashboardAccessMessage.clear}
        />
      )}
      {dashboardSuccessMessage.message && (
        <InlineMessage 
          message={dashboardSuccessMessage.message.message} 
          type={dashboardSuccessMessage.message.type}
          onDismiss={dashboardSuccessMessage.clear}
        />
      )}
      
      {/* Welcome Section */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">{t('dashboard.welcomeBack')} {dashboardData.user.name}!</span>
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="p-6 card-glow animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('dashboard.enrolledCourses')}</p>
              <p className="text-2xl font-bold">{dashboardData.stats.total_courses}</p>
            </div>
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6 card-glow animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('dashboard.completed')}</p>
              <p className="text-2xl font-bold">{dashboardData.stats.completed_courses}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6 card-glow animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('dashboard.hoursLearned')}</p>
              <p className="text-2xl font-bold">{dashboardData.stats.total_hours_learned}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6 card-glow animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('dashboard.currentStreak')}</p>
              <p className="text-2xl font-bold">{dashboardData.stats.current_streak} {t('dashboard.days')}</p>
            </div>
            <Flame className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Courses */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t('dashboard.continueLearning')}</h2>
            <LocaleLink
              href="/my-courses"
              className="text-primary hover:underline text-sm"
            >
              {t('dashboard.viewAllCourses')}
            </LocaleLink>
          </div>

          {dashboardData.recent_courses.length === 0 ? (
            <Card className="p-8">
              <EmptyState
                title={t('dashboard.noCoursesYet')}
                description={t('dashboard.noCoursesDescription')}
                action={{
                  label: t('dashboard.browseCourses'),
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
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{course.title}</h3>
                      <div className="mb-2">
                        <ProgressBar value={course.progress} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {course.progress}% {t('dashboard.complete')}
                        {course.last_accessed_display && (
                          <span> • {t('dashboard.lastAccessed')} {course.last_accessed_display}</span>
                        )}
                      </p>
                    </div>

                    <LocaleLink
                      href={
                        course.continue_lesson_id
                          ? `/learn/${course.id}/${course.continue_lesson_id}`
                          : course.current_lesson_id
                          ? `/learn/${course.id}/${course.current_lesson_id}`
                          : `/courses/${course.id}`
                      }
                      className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
                    >
                      {course.progress >= 95 ? t('dashboard.review') : course.continue_lesson_id || course.current_lesson_id || course.progress > 0 ? t('dashboard.continue') : t('dashboard.start')}
                    </LocaleLink>
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
            <h3 className="text-lg font-bold mb-3">{t('dashboard.upcomingLessons')}</h3>
            {dashboardData.upcoming_lessons.length === 0 ? (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">{t('dashboard.noUpcomingLessons')}</p>
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
                            <span> • {lesson.estimated_time} {t('dashboard.min')}</span>
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
            <h3 className="text-lg font-bold mb-3">{t('dashboard.achievements')}</h3>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm">{t('dashboard.certificatesEarned')}</span>
                <span className="font-bold">{dashboardData.certificates_earned}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('dashboard.longestStreak')}</span>
                <span className="font-bold">{dashboardData.stats.longest_streak} {t('dashboard.days')}</span>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t('dashboard.quickActions')}</h3>
            <div className="space-y-3">
              <LocaleLink href="/courses" className="block w-full">
                <Button variant="primary" className="w-full">
                  {t('dashboard.browseNewCourses')}
                </Button>
              </LocaleLink>
              <LocaleLink href="/certificates" className="block w-full">
                <Button variant="outline" className="w-full">
                  {t('dashboard.viewCertificates')}
                </Button>
              </LocaleLink>
              <LocaleLink href="/profile" className="block w-full">
                <Button variant="outline" className="w-full">
                  {t('dashboard.editProfile')}
                </Button>
              </LocaleLink>
              <Button
                onClick={() => setShowExportModal(true)}
                variant="outline"
                className="w-full"
              >
                📊 {t('dashboard.exportProgress')}
              </Button>
              <Button
                onClick={() => setShowOnboardingModal(true)}
                variant="outline"
                className="w-full"
              >
                🚀 {t('dashboard.platformTour')}
              </Button>
            </div>
          </div>
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
        onShowMessage={(message, type) => type === 'error' ? dashboardAccessMessage.showError(message) : dashboardAccessMessage.showInfo(message)}
      />
    </Container>
  );
}