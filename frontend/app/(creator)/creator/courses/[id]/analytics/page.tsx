'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BarChart, Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { AnalyticsChart } from '@/components/feature/AnalyticsChart';
import { useCourseAnalyticsQuery } from '@/hooks/queries/useCourses';
import { Container } from '@/components/ui/Container';

const CourseAnalyticsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;
  
  const [timeRange, setTimeRange] = useState('30days');

  // React Query hook for analytics data
  const { 
    data: analyticsResponse, 
    loading,
    execute: refetchAnalytics 
  } = useCourseAnalyticsQuery(courseId, '30days', !!courseId);

  // Extract analytics data from React Query response
  const analytics = analyticsResponse?.success ? analyticsResponse.data : null;

  // Check permissions when user loads
  useEffect(() => {
    if (user && user.role !== 'creator' && user.role !== 'admin') {
      ToastService.error('Access denied. Creator access required.');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Handle analytics loading errors
  useEffect(() => {
    if (analyticsResponse && !analyticsResponse.success) {
      ToastService.error(analyticsResponse.message || 'Something went wrong');
    }
  }, [analyticsResponse]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="bg-white border-b">
        <Container variant="admin" className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/creator/courses/${courseId}/edit`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Button>
              <h1 className="text-2xl font-bold">{analytics.course_title} - Analytics</h1>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex gap-2">
              <Button
                variant={timeRange === '7days' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('7days')}
              >
                7 Days
              </Button>
              <Button
                variant={timeRange === '30days' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('30days')}
              >
                30 Days
              </Button>
              <Button
                variant={timeRange === '90days' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('90days')}
              >
                90 Days
              </Button>
              <Button
                variant={timeRange === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('all')}
              >
                All Time
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Content */}
      <Container variant="admin" className="py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${analytics.total_revenue?.toFixed(2) || 0}</p>
                <p className="text-sm text-success">
                  +${analytics.revenue_this_period?.toFixed(2) || 0} this period
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
                <p className="text-2xl font-bold">{analytics.total_enrollments || 0}</p>
                <p className="text-sm text-primary">
                  {analytics.active_students || 0} active
                </p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{analytics.completion_rate?.toFixed(1) || 0}%</p>
                <p className="text-sm text-primary">
                  {analytics.completed_students || 0} completed
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{analytics.average_rating?.toFixed(1) || 0} ⭐</p>
                <p className="text-sm text-warning">
                  {analytics.total_reviews || 0} reviews
                </p>
              </div>
              <BarChart className="w-8 h-8 text-warning" />
            </div>
          </Card>
        </div>

        {/* Engagement & Lessons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Student Engagement */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Student Engagement</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Average Progress</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${analytics.average_progress || 0}%` }}
                    />
                  </div>
                  <span className="font-medium">{analytics.average_progress?.toFixed(1) || 0}%</span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Watch Time</span>
                <span className="font-medium">
                  {Math.floor(analytics.average_watch_time || 0)} min/student
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Watch Time</span>
                <span className="font-medium">
                  {Math.floor((analytics.total_watch_time || 0) / 60)} hours
                </span>
              </div>
            </div>
          </Card>

          {/* Lesson Performance */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Lesson Completion Rates</h2>
            {analytics.lesson_completion_rates && analytics.lesson_completion_rates.length > 0 ? (
              <div className="space-y-3">
                {analytics.lesson_completion_rates.slice(0, 5).map((lesson: any) => (
                  <div key={lesson.lesson_id} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground truncate max-w-[60%]">
                      {lesson.lesson_title}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-success h-2 rounded-full"
                          style={{ width: `${lesson.completion_rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {lesson.completion_rate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No lesson data available</p>
            )}
          </Card>
        </div>

        {/* Quiz Performance */}
        {analytics.quiz_pass_rates && analytics.quiz_pass_rates.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quiz Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.quiz_pass_rates.map((quiz: any) => (
                <div key={quiz.quiz_id} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">{quiz.quiz_title}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pass Rate</span>
                      <span className="font-medium">{quiz.pass_rate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Average Score</span>
                      <span className="font-medium">{quiz.average_score.toFixed(1)}/100</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Analytics Visualizations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Enrollment Trends - Only show if real data exists */}
          {analytics.enrollment_trends?.length > 0 && (
            <Card>
              <AnalyticsChart
                title="Enrollment Trends"
                type="line"
                data={analytics.enrollment_trends.map((item: any) => ({
                  name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: item.enrollments
                }))}
                height={250}
              />
            </Card>
          )}

          {/* Student Progress Distribution - Only show if we have enrollments */}
          {analytics.total_enrollments && analytics.total_enrollments > 0 && (
            <Card>
              <AnalyticsChart
                title="Student Progress Distribution"
                type="pie"
                data={[
                  {
                    name: 'Completed',
                    label: 'Completed',
                    value: analytics.completed_students || 0,
                    color: 'hsl(var(--success))'
                  },
                  {
                    name: 'In Progress',
                    label: 'In Progress',
                    value: (analytics.active_students || 0) - (analytics.completed_students || 0),
                    color: 'hsl(var(--warning))'
                  },
                  {
                    name: 'Not Started',
                    label: 'Not Started',
                    value: (analytics.total_enrollments || 0) - (analytics.active_students || 0),
                    color: 'hsl(var(--muted-foreground))'
                  }
                ]}
              />
            </Card>
          )}
        </div>
      </Container>
    </div>
  );
};

export default CourseAnalyticsPage;