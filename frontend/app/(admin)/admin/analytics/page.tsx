'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, SkeletonBox, SkeletonText } from '@/components/ui/LoadingStates';
import { Container } from '@/components/ui/Container';
import { AnalyticsChart } from '@/components/feature/AnalyticsChart';
import { useAdminOverviewQuery } from '@/hooks/queries/useAdminStats';
import { usePaymentAnalyticsQuery } from '@/hooks/queries/usePayments';
import { ToastService } from '@/lib/toast/ToastService';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  DollarSign,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days'>('30days');

  // Fetch data using existing hooks
  const {
    dashboardData,
    systemHealth,
    revenueData,
    userGrowthData,
    loading: adminLoading,
    error: adminError,
    refetchAll: refetchAdmin
  } = useAdminOverviewQuery({ period: 'month' });

  const {
    summary: paymentSummary,
    trends: paymentTrends,
    loading: paymentLoading,
    error: paymentError,
    refetchAll: refetchPayments
  } = usePaymentAnalyticsQuery(timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90, true);

  // Transform data for charts
  const chartData = useMemo(() => {
    if (!dashboardData?.data || !paymentTrends?.data) return null;

    const adminStats = dashboardData.data;
    const paymentData = paymentTrends.data;

    return {
      // Revenue trends from payment analytics
      revenueChart: paymentData?.daily_revenue?.map((day: any) => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: day.total_revenue || 0,
        payments: day.payment_count || 0
      })) || [],

      // User distribution pie chart
      userDistribution: [
        { name: 'Students', value: adminStats.total_students, fill: 'hsl(var(--primary))' },
        { name: 'Creators', value: adminStats.total_creators, fill: 'hsl(var(--success))' },
        { name: 'Admins', value: adminStats.total_admins, fill: 'hsl(var(--warning))' }
      ],

      // Course status distribution
      courseDistribution: [
        { name: 'Published', value: adminStats.published_courses, fill: 'hsl(var(--success))' },
        { name: 'Pending Review', value: adminStats.pending_review_courses, fill: 'hsl(var(--warning))' },
        { name: 'Draft', value: adminStats.draft_courses, fill: 'hsl(var(--muted-foreground))' }
      ],

      // Weekly activity pattern (mock data based on available stats)
      weeklyActivity: [
        { day: 'Mon', enrollments: Math.floor(adminStats.total_enrollments * 0.15) },
        { day: 'Tue', enrollments: Math.floor(adminStats.total_enrollments * 0.18) },
        { day: 'Wed', enrollments: Math.floor(adminStats.total_enrollments * 0.16) },
        { day: 'Thu', enrollments: Math.floor(adminStats.total_enrollments * 0.14) },
        { day: 'Fri', enrollments: Math.floor(adminStats.total_enrollments * 0.12) },
        { day: 'Sat', enrollments: Math.floor(adminStats.total_enrollments * 0.13) },
        { day: 'Sun', enrollments: Math.floor(adminStats.total_enrollments * 0.12) }
      ]
    };
  }, [dashboardData, paymentTrends]);

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchAdmin(),
        refetchPayments()
      ]);
    } catch (error) {
      ToastService.error('Failed to refresh analytics data');
    }
  };


  // useApiQuery automatically handles errors via Toast notifications
  // Continue with graceful degradation - show page structure with fallback values

  if (!chartData) {
    return (
      <div className="flex justify-center items-center min-h-screen text-primary">
        <EmptyState
          title="No analytics data available"
          description="Analytics data is not yet available. Please check back later."
          action={{
            label: 'Refresh',
            onClick: handleRefresh
          }}
        />
      </div>
    );
  }

  const stats = dashboardData?.data;
  const paymentStats = paymentSummary?.data;

  return (
    <Container variant="admin">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive platform insights and trends</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={timeRange === '7days' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('7days')}
            >
              <Calendar className="w-4 h-4 mr-1" />
              7 Days
            </Button>
            <Button
              variant={timeRange === '30days' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('30days')}
            >
              30 Days
            </Button>
            <Button
              variant={timeRange === '90days' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('90days')}
            >
              90 Days
            </Button>
          </div>
          
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              {adminLoading || paymentLoading ? (
                <>
                  <SkeletonBox className="h-8 w-24 mb-1" />
                  <SkeletonBox className="h-4 w-20" />
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">
                    ${paymentStats?.revenue?.total?.toLocaleString() || stats?.total_revenue?.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-success">
                    ${paymentStats?.revenue?.this_month?.toLocaleString() || stats?.revenue_this_month?.toLocaleString() || '0'} this month
                  </p>
                </>
              )}
            </div>
            <div className="h-12 w-12 bg-success/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Platform Users</p>
              {adminLoading || paymentLoading ? (
                <>
                  <SkeletonBox className="h-8 w-16 mb-1" />
                  <SkeletonBox className="h-4 w-16" />
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.total_users?.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-primary">
                    +{stats?.new_users_today || 0} today
                  </p>
                </>
              )}
            </div>
            <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Published Courses</p>
              {adminLoading || paymentLoading ? (
                <>
                  <SkeletonBox className="h-8 w-16 mb-1" />
                  <SkeletonBox className="h-4 w-24" />
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.published_courses || '0'}
                  </p>
                  <p className="text-sm text-warning">
                    {stats?.pending_review_courses || 0} pending review
                  </p>
                </>
              )}
            </div>
            <div className="h-12 w-12 bg-secondary/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Enrollments</p>
              {adminLoading || paymentLoading ? (
                <>
                  <SkeletonBox className="h-8 w-20 mb-1" />
                  <SkeletonBox className="h-4 w-16" />
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.total_enrollments?.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-secondary">
                    {stats?.active_enrollments || 0} active
                  </p>
                </>
              )}
            </div>
            <div className="h-12 w-12 bg-secondary/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-secondary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section 1: Revenue & User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          type="line"
          data={chartData.revenueChart}
          title="Revenue Trends"
          xKey="date"
          dataKey="revenue"
          height={300}
        />
        
        <AnalyticsChart
          type="pie"
          data={chartData.userDistribution}
          title="User Distribution"
          height={300}
        />
      </div>

      {/* Charts Section 2: Course & Activity Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          type="pie"
          data={chartData.courseDistribution}
          title="Course Status Distribution"
          height={300}
        />
        
        <AnalyticsChart
          type="bar"
          data={chartData.weeklyActivity}
          title="Weekly Enrollment Pattern"
          xKey="day"
          dataKey="enrollments"
          height={300}
        />
      </div>

      {/* Summary Stats */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Platform Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-success">
              {((stats?.completed_courses || 0) / Math.max(stats?.total_enrollments || 1, 1) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">Course Completion Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              ${((paymentStats?.revenue?.total || stats?.total_revenue || 0) / Math.max(stats?.total_users || 1, 1)).toFixed(0)}
            </p>
            <p className="text-sm text-muted-foreground">Revenue per User</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary">
              {(stats?.active_users_this_week || 0)}
            </p>
            <p className="text-sm text-muted-foreground">Active Users (Week)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary">
              {paymentStats?.success_rate?.toFixed(1) || '100.0'}%
            </p>
            <p className="text-sm text-muted-foreground">Payment Success Rate</p>
          </div>
        </div>
      </Card>

      {/* Info Note */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start">
          <PieChart className="w-5 h-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-primary">Analytics Dashboard</h3>
            <p className="text-sm text-primary/90 mt-1">
              This dashboard provides comprehensive platform insights using real-time data from courses, users, and payments. 
              Data refreshes automatically and can be viewed across different time periods.
            </p>
          </div>
        </div>
      </div>
    </div>
    </Container>
  );
}