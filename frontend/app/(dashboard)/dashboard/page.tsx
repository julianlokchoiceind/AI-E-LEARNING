'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatsCard, AnimatedButton, GlassCard, ProgressRing } from '@/components/ui/modern/ModernComponents';
import { InlineChatComponent } from '@/components/feature/InlineChatComponent';
import { AccessDenied } from '@/components/feature/AccessDenied';
import { ExportProgressModal } from '@/components/feature/ExportProgressModal';
import { OnboardingWizard } from '@/components/feature/OnboardingWizard';
import { useStudentDashboardQuery } from '@/hooks/queries/useStudent';
import { useOnboarding } from '@/hooks/useOnboarding';
import { formatDistanceToNow } from '@/lib/utils/formatters';
import { LoadingSpinner, EmptyState, CourseCardSkeleton } from '@/components/ui/LoadingStates';
import { ToastService } from '@/lib/toast/ToastService';
import { BookOpen, Award, Clock, TrendingUp, Play, Star, Target, Zap, Gift } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Welcome Section */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back, {dashboardData.user.name}!
              </h1>
              <p className="text-gray-600 text-lg">
                Continue your learning journey and track your progress
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>{dashboardData.stats.current_streak} day streak</span>
                </div>
                {dashboardData.user.premium_status && (
                  <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4" />
                    <span>Premium Member</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Overall Progress Ring */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <ProgressRing
                progress={dashboardData.stats.total_courses > 0 ? (dashboardData.stats.completed_courses / dashboardData.stats.total_courses * 100) : 0}
                size={120}
                showPercentage={true}
                className="hidden md:block"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Stats Overview */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <StatsCard
            title="Enrolled Courses"
            value={dashboardData.stats.total_courses}
            change={15}
            icon={<BookOpen className="w-6 h-6" />}
            variant="default"
          />
          
          <StatsCard
            title="Completed Courses"
            value={dashboardData.stats.completed_courses}
            change={dashboardData.stats.completed_courses > 0 ? 25 : 0}
            icon={<Award className="w-6 h-6" />}
            variant="success"
          />
          
          <StatsCard
            title="Hours Learned"
            value={`${dashboardData.stats.total_hours_learned}h`}
            change={12}
            icon={<Clock className="w-6 h-6" />}
            variant="warning"
          />
          
          <StatsCard
            title="Learning Streak"
            value={`${dashboardData.stats.current_streak} days`}
            change={dashboardData.stats.current_streak > dashboardData.stats.longest_streak ? 100 : 0}
            icon={<TrendingUp className="w-6 h-6" />}
            variant="success"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Recent Courses */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Continue Learning</h2>
              <Link 
                href="/my-courses" 
                className="text-primary hover:text-primary-hover text-sm font-medium flex items-center gap-1"
              >
                View all courses
                <Target className="w-4 h-4" />
              </Link>
            </div>

            {dashboardData.recent_courses.length === 0 ? (
              <GlassCard variant="light" className="p-8">
                <EmptyState
                  title="No courses yet"
                  description="You haven't enrolled in any courses yet. Start learning today!"
                  action={{
                    label: 'Browse Courses',
                    onClick: () => router.push('/courses')
                  }}
                />
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {dashboardData.recent_courses.map((course: any, index: number) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  >
                    <GlassCard variant="light" className="p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-6">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-24 h-16 object-cover rounded-xl shadow-md"
                          />
                        ) : (
                          <div className="w-24 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center shadow-md">
                            <BookOpen className="w-8 h-8 text-blue-600" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2 text-gray-900">{course.title}</h3>
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-600">Progress</span>
                              <span className="text-sm font-bold text-blue-600">{course.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <motion.div 
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${course.progress}%` }}
                                transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            {course.last_accessed && (
                              <span>Last accessed {formatDistanceToNow(new Date(course.last_accessed))}</span>
                            )}
                          </p>
                        </div>
                        
                        <AnimatedButton
                          variant="gradient"
                          size="md"
                          onClick={() => router.push(`/learn/${course.id}`)}
                          icon={<Play className="w-4 h-4" />}
                        >
                          Continue
                        </AnimatedButton>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Enhanced Sidebar */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {/* Upcoming Lessons */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Upcoming Lessons</h3>
              {dashboardData.upcoming_lessons.length === 0 ? (
                <GlassCard variant="light" className="p-6 text-center">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-500">No upcoming lessons</p>
                  <p className="text-xs text-gray-400 mt-1">Complete current lessons to unlock more</p>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {dashboardData.upcoming_lessons.map((lesson: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                    >
                      <GlassCard variant="light" className="p-4 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Play className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">{lesson.lesson_title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {lesson.course_title} • {lesson.estimated_time} min
                            </p>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced Achievements */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Achievements</h3>
              <GlassCard variant="colored" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium">Certificates Earned</span>
                    </div>
                    <span className="font-bold text-lg text-yellow-600">{dashboardData.certificates_earned}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium">Longest Streak</span>
                    </div>
                    <span className="font-bold text-lg text-orange-600">{dashboardData.stats.longest_streak} days</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Enhanced Quick Actions */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Quick Actions</h3>
              <div className="space-y-3">
                <AnimatedButton
                  variant="ghost"
                  size="md"
                  className="w-full justify-start"
                  onClick={() => router.push('/courses')}
                  icon={<BookOpen className="w-4 h-4" />}
                >
                  Browse New Courses
                </AnimatedButton>
                
                <AnimatedButton
                  variant="ghost"
                  size="md"
                  className="w-full justify-start"
                  onClick={() => router.push('/certificates')}
                  icon={<Award className="w-4 h-4" />}
                >
                  View Certificates
                </AnimatedButton>
                
                <AnimatedButton
                  variant="ghost"
                  size="md"
                  className="w-full justify-start"
                  onClick={() => router.push('/profile')}
                  icon={<Target className="w-4 h-4" />}
                >
                  Edit Profile
                </AnimatedButton>
                
                <AnimatedButton
                  variant="secondary"
                  size="md"
                  className="w-full justify-start"
                  onClick={() => setShowExportModal(true)}
                  icon={<TrendingUp className="w-4 h-4" />}
                >
                  Export Progress
                </AnimatedButton>
                
                <AnimatedButton
                  variant="gradient"
                  size="md"
                  className="w-full justify-start"
                  onClick={() => setShowOnboardingModal(true)}
                  icon={<Gift className="w-4 h-4" />}
                >
                  Platform Tour
                </AnimatedButton>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced AI Study Assistant */}
        <motion.div 
          className="mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <GlassCard variant="colored" className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">AI Study Buddy</h3>
                <p className="text-sm text-gray-600">Get personalized learning assistance powered by Claude AI</p>
              </div>
            </div>
            
            <InlineChatComponent
              title=""
              placeholder="What would you like to learn today? Ask me anything about your courses!"
              suggestions={[
                "What should I study next?",
                "Help me review my progress",
                "Explain a concept I'm struggling with",
                "Suggest a learning plan for this week"
              ]}
            />
          </GlassCard>
        </motion.div>
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