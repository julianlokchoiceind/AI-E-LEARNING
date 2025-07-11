'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';
import { useAdminOverviewQuery } from '@/hooks/queries/useAdminStats';
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
  Activity
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
        total_monthly: revenue?.total_monthly || adminStats?.revenue_this_month || 0,
        subscription_revenue: revenue?.subscription_revenue || 0,
        course_sales_revenue: revenue?.course_sales || adminStats?.revenue_this_month || 0,
        growth_percentage: revenue?.growth_percentage || 0
      },
      system: {
        active_sessions: adminStats?.active_users_today || 0,
        pending_support_tickets: health?.pending_tickets || 0,
        server_status: health?.status || 'Healthy',
        last_backup: health?.last_backup || '2 hours ago'
      }
    };

    return transformedStats;
  }, [dashboardData, revenueData, userGrowthData, systemHealth]);

  const handleRefresh = async () => {
    try {
      await refetchAll();
      ToastService.success('Dashboard data refreshed successfully');
    } catch (error) {
      ToastService.error('Failed to refresh dashboard data');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading admin dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <EmptyState
          title="Failed to load dashboard"
          description={error.message || 'Something went wrong while loading the admin dashboard'}
          action={{
            label: 'Try Again',
            onClick: handleRefresh
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of platform performance and key metrics</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          loading={loading}
          variant="outline"
        >
          <Activity className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.users.total.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-green-600">
                +{stats?.users.new_today || 0} today
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Total Courses */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.courses.total || '0'}
              </p>
              <p className="text-sm text-orange-600">
                {stats?.courses.pending_approval || 0} pending approval
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Monthly Revenue */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats?.revenue.total_monthly.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-green-600">
                +{stats?.revenue.growth_percentage || 0}% growth
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Active Sessions */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.system.active_sessions || '0'}
              </p>
              <p className="text-sm text-blue-600">
                {stats?.users.active_this_week || 0} weekly active
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* System Status & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">Server Status</span>
              </div>
              <span className="text-green-600 font-medium">
                {stats?.system.server_status || 'Healthy'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-500 mr-3" />
                <span className="text-gray-700">Last Backup</span>
              </div>
              <span className="text-gray-600">
                {stats?.system.last_backup || '2 hours ago'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                <span className="text-gray-700">Pending Tickets</span>
              </div>
              <span className="text-yellow-600 font-medium">
                {stats?.system.pending_support_tickets || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Crown className="h-5 w-5 text-purple-500 mr-3" />
                <span className="text-gray-700">Premium Users</span>
              </div>
              <span className="text-purple-600 font-medium">
                {stats?.users.premium_users || 0}
              </span>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/admin/users', '_blank')}
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/admin/courses', '_blank')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Review Courses
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/admin/payments', '_blank')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              View Payments
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/admin/support', '_blank')}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Support Queue
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Activity & Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Subscription Revenue</span>
              <span className="font-semibold">
                ${stats?.revenue.subscription_revenue.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Course Sales</span>
              <span className="font-semibold">
                ${stats?.revenue.course_sales_revenue.toLocaleString() || '0'}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">Total Monthly</span>
                <span className="text-lg font-bold text-green-600">
                  ${stats?.revenue.total_monthly.toLocaleString() || '0'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Platform Statistics */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Platform Statistics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Published Courses</span>
              <span className="font-semibold">
                {stats?.courses.published || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Total Enrollments</span>
              <span className="font-semibold">
                {stats?.courses.total_enrollments?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Weekly Active Users</span>
              <span className="font-semibold">
                {stats?.users.active_this_week || 0}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">Platform Health</span>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">Excellent</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}