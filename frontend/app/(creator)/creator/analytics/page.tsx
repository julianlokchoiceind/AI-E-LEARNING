'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, TrendingUp, Users, DollarSign, Clock, Award, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { useCreatorCoursesQuery } from '@/hooks/queries/useCourses';
import { usePaymentAnalyticsQuery } from '@/hooks/queries/usePayments';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { LoadingSpinner, EmptyState, SkeletonBox, SkeletonCircle } from '@/components/ui/LoadingStates';
import { Container } from '@/components/ui/Container';

const CreatorAnalyticsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30days');

  // Use Creator Courses data - same as dashboard
  const {
    data: coursesResponse,
    loading: coursesLoading,
    execute: refetchCourses
  } = useCreatorCoursesQuery({}, !!user);

  // NEW: Use Payment Analytics for real revenue data
  const {
    summary: paymentSummary,
    trends: paymentTrends,
    loading: analyticsLoading,
    error: analyticsError,
    refetchAll: refetchAnalytics
  } = usePaymentAnalyticsQuery(30, !!user && user.role === 'creator');

  // Extract real courses data and calculate statistics
  const courses = coursesResponse?.data?.courses || [];
  
  // NEW: Calculate analytics combining real payment data + course data
  const analytics = React.useMemo(() => {
    if (!courses.length && !paymentSummary?.data) return null;
    
    const published = courses.filter(c => c.status === 'published');
    
    // Use REAL payment data for revenue
    const realRevenue = paymentSummary?.data?.revenue || {
      total: 0,
      this_month: 0,
      average_payment: 0
    };
    
    // Course stats for enrollment/rating data
    const totalStudents = courses.reduce((sum, c) => sum + (c.stats?.total_enrollments || 0), 0);
    const totalReviews = courses.reduce((sum, c) => sum + (c.stats?.total_reviews || 0), 0);
    const avgRating = courses.length > 0 ? 
      courses.reduce((sum, c) => sum + (c.stats?.average_rating || 0), 0) / courses.length : 0;
    
    // Revenue by course using payment trends data
    const revenueByCoursе = paymentTrends?.data?.top_courses 
      ? paymentTrends.data.top_courses.slice(0, 5).map((c: any) => ({
          name: c.course_title.length > 20 ? c.course_title.substring(0, 20) + '...' : c.course_title,
          value: c.total_revenue
        }))
      : courses
          .filter(c => c.stats?.total_revenue > 0)
          .map(c => ({
            name: c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title,
            value: c.stats?.total_revenue || 0
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
    
    // Students by course (still from course stats)
    const studentsByCourse = courses
      .filter(c => c.stats?.total_enrollments > 0)
      .map(c => ({
        name: c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title,
        value: c.stats?.total_enrollments || 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Daily revenue trends for chart
    const dailyRevenue = paymentTrends?.data?.daily_revenue || [];
    
    return {
      overview: {
        total_courses: courses.length,
        published_courses: published.length,
        total_revenue: realRevenue.total, // REAL payment data
        this_month_revenue: realRevenue.this_month, // NEW: this month revenue
        average_payment: realRevenue.average_payment, // NEW: average payment
        total_students: totalStudents,
        average_rating: avgRating,
        total_reviews: totalReviews,
        total_payments: paymentSummary?.data?.payments?.total_count || 0, // NEW
        success_rate: paymentTrends?.data?.success_metrics?.overall_success_rate || 100 // NEW
      },
      revenueByCoursе,
      studentsByCourse,
      dailyRevenue, // NEW: 30-day revenue trends
      courseDetails: courses.map(c => ({
        id: c.id,
        title: c.title,
        status: c.status,
        students: c.stats?.total_enrollments || 0,
        revenue: c.stats?.total_revenue || 0,
        rating: c.stats?.average_rating || 0,
        reviews: c.stats?.total_reviews || 0,
        updated: c.updated_at
      }))
    };
  }, [courses, paymentSummary, paymentTrends]);

  useEffect(() => {
    // Don't check access until auth loading is complete
    if (authLoading) return;
    
    if (!user || user.role !== 'creator') {
      if (user?.role === 'admin') {
        // Admin redirect to admin courses
        router.push('/admin/courses');
      } else {
        // Students/others redirect to 404
        router.push('/not-found');
      }
      return;
    }
  }, [user, authLoading, router]);

  if (authLoading || coursesLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-muted/50">
        {/* Header - STATIC */}
        <div className="bg-white border-b">
          <Container variant="admin" className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Analytics Overview</h1>
                <p className="text-muted-foreground">Track your course performance and revenue</p>
              </div>
              <SkeletonBox className="h-9 w-32 rounded" />
            </div>
          </Container>
        </div>

        {/* Content */}
        <Container variant="admin" className="py-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-background border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <SkeletonBox className="h-4 w-24 mb-2" />
                    <SkeletonBox className="h-8 w-16 mb-1" />
                    <SkeletonBox className="h-4 w-28" />
                  </div>
                  <SkeletonCircle className="w-8 h-8" />
                </div>
              </div>
            ))}
          </div>

          {/* Time Range Filter */}
          <div className="mb-6">
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBox key={i} className="h-9 w-20 rounded" />
              ))}
            </div>
          </div>

          {/* Charts and Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="bg-background border border-border rounded-lg p-6">
              <SkeletonBox className="h-6 w-32 mb-4" />
              <SkeletonBox className="h-64 w-full" />
            </div>

            {/* Course Performance */}
            <div className="bg-background border border-border rounded-lg p-6">
              <SkeletonBox className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <SkeletonBox className="h-10 w-10 rounded" />
                      <div>
                        <SkeletonBox className="h-4 w-32 mb-1" />
                        <SkeletonBox className="h-3 w-20" />
                      </div>
                    </div>
                    <SkeletonBox className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-background border border-border rounded-lg p-6">
            <SkeletonBox className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <div className="flex items-center gap-3">
                    <SkeletonCircle className="w-8 h-8" />
                    <div>
                      <SkeletonBox className="h-4 w-48 mb-1" />
                      <SkeletonBox className="h-3 w-24" />
                    </div>
                  </div>
                  <SkeletonBox className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Show error if analytics failed but continue with course data
  if (analyticsError) {
    console.warn('Payment analytics failed, using course data only:', analyticsError);
  }

  if (!analytics || courses.length === 0) {
    return (
      <Container variant="admin" className="py-8">
        <EmptyState
          title="No analytics data yet"
          description="Create and publish courses to see your analytics"
          action={{
            label: 'Create First Course',
            onClick: () => router.push('/creator/courses')
          }}
        />
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="bg-white border-b">
        <Container variant="admin" className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Analytics Overview</h1>
              <p className="text-muted-foreground">Track your course performance and revenue</p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/creator/courses')}
            >
              Manage Courses
            </Button>
          </div>
        </Container>
      </div>

      {/* Content */}
      <Container variant="admin" className="py-8">
        {/* Overview Stats - NOW WITH REAL PAYMENT DATA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.overview.total_revenue)}</p>
                <p className="text-sm text-success mt-1">
                  +{formatCurrency(analytics.overview.this_month_revenue)} this month
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{analytics.overview.total_payments}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Avg: {formatCurrency(analytics.overview.average_payment)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{analytics.overview.success_rate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Payment success rate
                </p>
              </div>
              <Award className="w-8 h-8 text-success" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{analytics.overview.total_students}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {analytics.overview.published_courses} courses
                </p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        {(analytics.revenueByCoursе.length > 0 || analytics.studentsByCourse.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue by Course */}
            {analytics.revenueByCoursе.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Top Revenue Courses</h2>
                <div className="space-y-3">
                  {analytics.revenueByCoursе.map((course: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-success/20 text-success rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">{course.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-success">
                        {formatCurrency(course.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Students by Course */}
            {analytics.studentsByCourse.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Most Popular Courses</h2>
                <div className="space-y-3">
                  {analytics.studentsByCourse.map((course, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">{course.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {course.value} students
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* NEW: Revenue Trends Chart (30 days) */}
        {analytics.dailyRevenue && analytics.dailyRevenue.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Revenue Trends (Last 30 Days)</h2>
            <div className="space-y-4">
              {/* Simple line chart representation */}
              <div className="grid grid-cols-7 gap-2 text-xs">
                {analytics.dailyRevenue.slice(-7).map((day: any, index: number) => (
                  <div key={index} className="text-center">
                    <div className="text-muted-foreground mb-1">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="bg-primary/20 rounded p-2">
                      <div className="font-semibold text-primary">
                        {formatCurrency(day.total_revenue)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {day.payment_count} payments
                      </div>
                      <div className="text-success text-xs">
                        {day.success_rate.toFixed(1)}% success
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Total (30 days)</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(analytics.dailyRevenue.reduce((sum: number, day: any) => sum + day.total_revenue, 0))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Total Payments</div>
                  <div className="text-lg font-semibold">
                    {analytics.dailyRevenue.reduce((sum: number, day: any) => sum + day.payment_count, 0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Avg Success Rate</div>
                  <div className="text-lg font-semibold text-success">
                    {(analytics.dailyRevenue.reduce((sum: number, day: any) => sum + day.success_rate, 0) / analytics.dailyRevenue.length).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Course Details Table */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Course Performance Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Course</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Students</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Rating</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Last Updated</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {analytics.courseDetails.map((course) => (
                  <tr key={course.id} className="hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm">{course.title}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        course.status === 'published' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-muted/50 text-muted-foreground'
                      }`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm">{course.students}</td>
                    <td className="py-3 px-4 text-right text-sm font-medium">
                      {formatCurrency(course.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      {course.rating.toFixed(1)} ⭐ ({course.reviews})
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                      {formatDate(course.updated)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/creator/courses/${course.id}/analytics`)}
                      >
                        <BarChart className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Info Message */}
        <div className="mt-8 p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-primary">
            <strong>Note:</strong> This analytics overview uses data from your courses. 
            For detailed analytics on individual courses, click the analytics icon next to each course.
          </p>
        </div>
      </Container>
    </div>
  );
};

export default CreatorAnalyticsPage;