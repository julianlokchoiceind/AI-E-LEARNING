'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, SkeletonBox, SkeletonText } from '@/components/ui/LoadingStates';
import { Container } from '@/components/ui/Container';
import { useAdminOverviewQuery } from '@/hooks/queries/useAdminStats';
import { usePaymentAnalyticsQuery } from '@/hooks/queries/usePayments';
import { ToastService } from '@/lib/toast/ToastService';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Crown,
  CreditCard,
  Headphones
} from 'lucide-react';

// Map the AdminDashboardStats to the format expected by the component
interface DashboardStats {
  users: {
    total: number;
    new_today: number;
    active_this_week: number;
    premium_users: number;
  };
  courses: {
    total: number;
    published: number;
    pending_approval: number;
    total_enrollments: number;
  };
  revenue: {
    total_monthly: number;
    subscription_revenue: number;
    course_sales_revenue: number;
    growth_percentage: number;
    // NEW: Additional payment analytics
    total_all_time: number;
    average_payment: number;
    success_rate: number;
  };
  system: {
    active_sessions: number;
    pending_support_tickets: number;
    server_status: string;
    last_backup: string;
  };
}

export default function AdminDashboard() {
  // React Query hooks for admin overview data
  const {
    dashboardData,
    systemHealth,
    revenueData,
    userGrowthData,
    loading,
    error,
    refetchAll
  } = useAdminOverviewQuery({ period: 'month' });

  // NEW: Real payment analytics for admin
  const {
    summary: paymentSummary,
    trends: paymentTrends,
    loading: analyticsLoading,
    error: analyticsError,
    refetchAll: refetchAnalytics
  } = usePaymentAnalyticsQuery(30, true); // Always enabled for admin

  // Transform API data to component format using memoization
  const stats = useMemo(() => {
    if (!dashboardData?.data) return null;

    const adminStats = dashboardData.data;
    const revenue = revenueData?.data;
    const growth = userGrowthData?.data;
    const health = systemHealth?.data;

    const transformedStats: DashboardStats = {
      users: {
        total: adminStats?.total_users || 0,
        new_today: adminStats?.new_users_today || 0,
        active_this_week: adminStats?.active_users_this_week || 0,
        premium_users: adminStats?.total_admins || 0
      },
      courses: {
        total: adminStats?.total_courses || 0,
        published: adminStats?.published_courses || 0,
        pending_approval: adminStats?.pending_review_courses || 0,
        total_enrollments: adminStats?.total_enrollments || 0
      },
      revenue: {
        // Use REAL payment analytics data when available
        total_monthly: paymentSummary?.data?.revenue?.this_month || revenue?.total_monthly || adminStats?.revenue_this_month || 0,
        subscription_revenue: paymentSummary?.data?.payments?.by_type?.subscriptions || revenue?.subscription_revenue || 0,
        course_sales_revenue: paymentSummary?.data?.payments?.by_type?.course_purchases || revenue?.course_sales || adminStats?.revenue_this_month || 0,
        growth_percentage: revenue?.growth_percentage || 0,
        // NEW: Additional payment metrics
        total_all_time: paymentSummary?.data?.revenue?.total || 0,
        average_payment: paymentSummary?.data?.revenue?.average_payment || 0,
        success_rate: paymentTrends?.data?.success_metrics?.overall_success_rate || 100
      },
      system: {
        active_sessions: adminStats?.active_users_today || 0,
        pending_support_tickets: health?.pending_tickets || 0,
        server_status: health?.status || 'Unknown',
        last_backup: health?.last_backup || 'No data available'
      }
    };

    return transformedStats;
  }, [dashboardData, revenueData, userGrowthData, systemHealth, paymentSummary, paymentTrends]);

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchAll(),
        refetchAnalytics()
      ]);
    } catch (error) {
      ToastService.error('Failed to refresh dashboard data');
    }
  };

  // useApiQuery automatically handles errors via Toast notifications
  // Continue with graceful degradation - show page structure with fallback values

  return (
    <Container variant="admin">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of platform performance and key metrics</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="p-6 card-hover card-glow metric-card group animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              {loading || analyticsLoading ? (
                <>
                  <SkeletonBox className="h-8 w-20 mb-1" />
                  <SkeletonBox className="h-4 w-16" />
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stats?.users.total.toLocaleString() || '0'}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-success">
                      +{stats?.users.new_today || 0} today
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg animate-float"
                 style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        {/* Total Courses */}
        <Card className="p-6 card-hover card-glow metric-card group animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
              {loading || analyticsLoading ? (
                <>
                  <SkeletonBox className="h-8 w-16 mb-1" />
                  <SkeletonBox className="h-4 w-24" />
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stats?.courses.total || '0'}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium text-warning">
                      {stats?.courses.pending_approval || 0} pending
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg animate-float"
                 style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <BookOpen className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        {/* Monthly Revenue - NOW WITH REAL PAYMENT DATA */}
        <Card className="p-6 card-hover card-glow metric-card group animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
              {loading || analyticsLoading ? (
                <>
                  <SkeletonBox className="h-8 w-24 mb-1" />
                  <SkeletonBox className="h-4 w-20" />
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    ${stats?.revenue.total_monthly.toLocaleString() || '0'}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-success">
                      {stats?.revenue.success_rate.toFixed(1) || 100}% success
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg animate-float"
                 style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
              <DollarSign className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        {/* Active Sessions */}
        <Card className="p-6 card-hover card-glow metric-card group animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
              {loading || analyticsLoading ? (
                <>
                  <SkeletonBox className="h-8 w-16 mb-1" />
                  <SkeletonBox className="h-4 w-20" />
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stats?.system.active_sessions || '0'}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      {stats?.users.active_this_week || 0} weekly
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg animate-float"
                 style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* System Status & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card className="p-6 animate-fade-in-up stagger-5">
          <h2 className="text-lg font-semibold mb-4">System Status</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg nav-hover">
              <div className="flex items-center gap-3">
                {stats?.system.server_status === 'Unknown' ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-success" />
                )}
                <span className="font-medium">Server Status</span>
              </div>
              <span className={`font-semibold ${
                stats?.system.server_status === 'Unknown' ? 'text-destructive' : 'text-success'
              }`}>
                {stats?.system.server_status || 'Unknown'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg nav-hover">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">Last Backup</span>
              </div>
              <span className="text-muted-foreground font-medium">
                {stats?.system.last_backup || 'No data available'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg nav-hover">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="font-medium">Pending Tickets</span>
              </div>
              <span className="text-warning font-bold text-lg">
                {stats?.system.pending_support_tickets || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg nav-hover">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-primary" />
                <span className="font-medium">Premium Users</span>
              </div>
              <span className="text-primary font-bold text-lg">
                {stats?.users.premium_users || 0}
              </span>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 animate-fade-in-up stagger-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-center justify-center gap-2 btn-interactive transition-all hover:border-primary hover:bg-primary/5 hover:scale-105"
              onClick={() => window.open('/admin/users', '_blank')}
            >
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Manage Users</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-center justify-center gap-2 btn-interactive transition-all hover:border-success hover:bg-success/5 hover:scale-105"
              onClick={() => window.open('/admin/courses', '_blank')}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-sm font-medium">Review Courses</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-center justify-center gap-2 btn-interactive transition-all hover:border-purple-500 hover:bg-purple-50 hover:scale-105"
              onClick={() => window.open('/admin/payments', '_blank')}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-sm font-medium">View Payments</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-center justify-center gap-2 btn-interactive transition-all hover:border-warning hover:bg-warning/5 hover:scale-105"
              onClick={() => window.open('/admin/support', '_blank')}
            >
              <Headphones className="w-5 h-5" />
              <span className="text-sm font-medium">Support Queue</span>
            </Button>
          </div>
        </Card>
      </div>

      </div>
    </Container>
  );
}