'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';
import { StatsCard, AnimatedButton, GlassCard, ProgressRing } from '@/components/ui/modern/ModernComponents';
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
  Activity,
  BarChart3,
  Zap,
  Shield,
  Database
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Header */}
        <motion.div 
          className="flex justify-between items-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">Overview of platform performance and key metrics</p>
          </div>
          <AnimatedButton 
            variant="secondary"
            size="md"
            onClick={handleRefresh} 
            loading={loading}
            icon={<Activity className="w-4 h-4" />}
          >
            Refresh Data
          </AnimatedButton>
        </motion.div>

        {/* Enhanced Key Metrics */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <StatsCard
            title="Total Users"
            value={stats?.users.total.toLocaleString() || '0'}
            change={stats?.users.new_today ? (stats.users.new_today / stats.users.total * 100) : 0}
            icon={<Users className="w-6 h-6" />}
            variant="default"
            subtitle={`+${stats?.users.new_today || 0} today`}
          />
          
          <StatsCard
            title="Total Courses"
            value={stats?.courses.total || '0'}
            change={stats?.courses.published ? (stats.courses.published / stats.courses.total * 100) : 0}
            icon={<BookOpen className="w-6 h-6" />}
            variant="success"
            subtitle={`${stats?.courses.pending_approval || 0} pending approval`}
          />
          
          <StatsCard
            title="Monthly Revenue"
            value={`$${stats?.revenue.total_monthly.toLocaleString() || '0'}`}
            change={stats?.revenue.growth_percentage || 0}
            icon={<DollarSign className="w-6 h-6" />}
            variant="warning"
            subtitle={`+${stats?.revenue.growth_percentage || 0}% growth`}
          />
          
          <StatsCard
            title="Active Sessions"
            value={stats?.system.active_sessions || '0'}
            change={stats?.users.active_this_week ? (stats.users.active_this_week / stats.users.total * 100) : 0}
            icon={<TrendingUp className="w-6 h-6" />}
            variant="success"
            subtitle={`${stats?.users.active_this_week || 0} weekly active`}
          />
        </motion.div>

        {/* Enhanced System Status & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Enhanced System Status */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <GlassCard variant="light" className="p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">System Status</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700 font-medium">Server Status</span>
                  </div>
                  <span className="text-green-600 font-bold px-3 py-1 bg-green-100 rounded-full text-sm">
                    {stats?.system.server_status || 'Healthy'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-blue-500" />
                    <span className="text-gray-700 font-medium">Last Backup</span>
                  </div>
                  <span className="text-gray-600 font-semibold">
                    {stats?.system.last_backup || '2 hours ago'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span className="text-gray-700 font-medium">Pending Tickets</span>
                  </div>
                  <span className="text-yellow-600 font-bold px-3 py-1 bg-yellow-100 rounded-full text-sm">
                    {stats?.system.pending_support_tickets || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="h-5 w-5 text-purple-500" />
                    <span className="text-gray-700 font-medium">Premium Users</span>
                  </div>
                  <span className="text-purple-600 font-bold px-3 py-1 bg-purple-100 rounded-full text-sm">
                    {stats?.users.premium_users || 0}
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Enhanced Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <GlassCard variant="light" className="p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <AnimatedButton 
                  variant="ghost" 
                  size="md"
                  className="h-16 justify-start"
                  onClick={() => window.open('/admin/users', '_blank')}
                  icon={<Users className="w-5 h-5" />}
                >
                  Manage Users
                </AnimatedButton>
                
                <AnimatedButton 
                  variant="ghost" 
                  size="md"
                  className="h-16 justify-start"
                  onClick={() => window.open('/admin/courses', '_blank')}
                  icon={<BookOpen className="w-5 h-5" />}
                >
                  Review Courses
                </AnimatedButton>
                
                <AnimatedButton 
                  variant="ghost" 
                  size="md"
                  className="h-16 justify-start"
                  onClick={() => window.open('/admin/payments', '_blank')}
                  icon={<DollarSign className="w-5 h-5" />}
                >
                  View Payments
                </AnimatedButton>
                
                <AnimatedButton 
                  variant="ghost" 
                  size="md"
                  className="h-16 justify-start"
                  onClick={() => window.open('/admin/support', '_blank')}
                  icon={<AlertTriangle className="w-5 h-5" />}
                >
                  Support Queue
                </AnimatedButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Enhanced Revenue & Platform Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Revenue Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <GlassCard variant="colored" className="p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Revenue Breakdown</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">Subscription Revenue</span>
                  </div>
                  <span className="font-bold text-lg">
                    ${stats?.revenue.subscription_revenue.toLocaleString() || '0'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">Course Sales</span>
                  </div>
                  <span className="font-bold text-lg">
                    ${stats?.revenue.course_sales_revenue.toLocaleString() || '0'}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <span className="text-gray-900 font-bold text-lg">Total Monthly</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${stats?.revenue.total_monthly.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Enhanced Platform Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <GlassCard variant="colored" className="p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Platform Statistics</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                  <span className="text-gray-700 font-medium">Published Courses</span>
                  <span className="font-bold text-lg text-green-600">
                    {stats?.courses.published || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                  <span className="text-gray-700 font-medium">Total Enrollments</span>
                  <span className="font-bold text-lg text-blue-600">
                    {stats?.courses.total_enrollments?.toLocaleString() || '0'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                  <span className="text-gray-700 font-medium">Weekly Active Users</span>
                  <span className="font-bold text-lg text-purple-600">
                    {stats?.users.active_this_week || 0}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <span className="text-gray-900 font-bold text-lg">Platform Health</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-600 font-bold">Excellent</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}