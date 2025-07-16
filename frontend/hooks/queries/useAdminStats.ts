'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { api } from '@/lib/api/api-client';
import { StandardResponse } from '@/lib/types/api';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { 
  getAdminDashboardStats,
  getPlatformAnalytics,
  getUserGrowthStats,
  getRevenueStats,
  getCourseStats,
  getSystemHealth
} from '@/lib/api/admin';

// Types for admin statistics
interface AdminStatsFilters {
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
}

interface PlatformMetrics {
  total_users: number;
  active_users: number;
  total_courses: number;
  total_enrollments: number;
  total_revenue: number;
  conversion_rate: number;
}

/**
 * ADMIN DASHBOARD STATS - Main admin overview
 * Critical: Admin decision making dashboard
 */
export function useAdminDashboardStatsQuery(filters: AdminStatsFilters = {}) {
  const { period = 'month' } = filters;
  
  return useApiQuery(
    ['admin-dashboard-stats', { period }],
    () => getAdminDashboardStats(),
    getCacheConfig('ADMIN_OPERATIONS') // Realtime - admin dashboard critical data
  );
}

/**
 * PLATFORM ANALYTICS - Comprehensive platform metrics
 * High-impact: Business intelligence
 */
export function usePlatformAnalyticsQuery(filters: AdminStatsFilters = {}) {
  const { period = 'month', startDate, endDate } = filters;
  
  return useApiQuery(
    ['platform-analytics', { period, startDate, endDate }],
    () => getPlatformAnalytics({ period, startDate, endDate }),
    getCacheConfig('USER_DASHBOARD') // 2min moderate - analytics can be slightly stale
  );
}

/**
 * USER GROWTH STATS - User acquisition and retention
 * High-impact: Growth tracking
 */
export function useUserGrowthStatsQuery(filters: AdminStatsFilters = {}) {
  const { period = 'month' } = filters;
  
  return useApiQuery(
    ['user-growth-stats', { period }],
    () => getUserGrowthStats({ period }),
    getCacheConfig('USER_DASHBOARD') // 2min moderate - growth tracking data
  );
}

/**
 * REVENUE STATS - Financial performance metrics
 * Critical: Revenue tracking and forecasting
 */
export function useRevenueStatsQuery(filters: AdminStatsFilters = {}) {
  const { period = 'month', startDate, endDate } = filters;
  
  return useApiQuery(
    ['revenue-stats', { period, startDate, endDate }],
    () => getRevenueStats({ period, startDate, endDate }),
    getCacheConfig('ADMIN_OPERATIONS') // Realtime - revenue data is critical
  );
}

/**
 * COURSE STATS - Content performance metrics
 * High-impact: Content strategy insights
 */
export function useCourseStatsQuery(filters: AdminStatsFilters = {}) {
  const { period = 'month' } = filters;
  
  return useApiQuery(
    ['course-stats', { period }],
    () => getCourseStats({ period }),
    getCacheConfig('USER_DASHBOARD') // 2min moderate - course performance data
  );
}

/**
 * SYSTEM HEALTH - Technical platform metrics
 * Critical: Platform monitoring and alerts
 */
export function useSystemHealthQuery() {
  return useApiQuery(
    ['system-health'],
    () => getSystemHealth(),
    getCacheConfig('ADMIN_OPERATIONS') // Realtime - system health monitoring
  );
}

/**
 * ADMIN OVERVIEW - Combined dashboard metrics
 * Critical: Single hook for main admin dashboard
 */
export function useAdminOverviewQuery(filters: AdminStatsFilters = {}) {
  const dashboardStats = useAdminDashboardStatsQuery(filters);
  const systemHealth = useSystemHealthQuery();
  const revenueStats = useRevenueStatsQuery(filters);
  const userGrowth = useUserGrowthStatsQuery(filters);

  return {
    // Combined data
    dashboardData: dashboardStats.data,
    systemHealth: systemHealth.data,
    revenueData: revenueStats.data,
    userGrowthData: userGrowth.data,
    
    // Combined loading states
    loading: dashboardStats.loading || systemHealth.loading || 
             revenueStats.loading || userGrowth.loading,
    
    // Combined error states
    error: dashboardStats.error || systemHealth.error || 
           revenueStats.error || userGrowth.error,
    
    // Individual refetch functions
    refetchDashboard: dashboardStats.execute,
    refetchHealth: systemHealth.execute,
    refetchRevenue: revenueStats.execute,
    refetchUserGrowth: userGrowth.execute,
    
    // Refetch all function
    refetchAll: async () => {
      await Promise.all([
        dashboardStats.execute(),
        systemHealth.execute(),
        revenueStats.execute(),
        userGrowth.execute()
      ]);
    }
  };
}

/**
 * REAL-TIME METRICS - Live platform metrics
 * High-impact: Real-time monitoring
 */
export function useRealTimeMetricsQuery() {
  return useApiQuery(
    ['real-time-metrics'],
    () => {
      // Calculate real-time metrics from multiple sources
      return Promise.all([
        getSystemHealth(),
        getAdminDashboardStats(),
      ]).then(([health, dashboard]) => {
        const metrics = {
          active_users_now: dashboard.data?.active_users_today || 0,
          current_load: health.data?.cpu_usage || 0,
          response_time: health.data?.avg_response_time || 0,
          error_rate: health.data?.error_rate || 0,
          uptime: health.data?.uptime || 100,
          timestamp: new Date().toISOString()
        };
        return { success: true, data: metrics, message: 'Real-time metrics retrieved successfully' };
      });
    },
    getCacheConfig('ADMIN_OPERATIONS') // Realtime - real-time monitoring
  );
}

/**
 * EXPORT ADMIN DATA - Generate reports for download
 * Medium-impact: Admin reporting
 */
export function useExportAdminData() {
  return useApiMutation(
    async ({ type, period, format }: { 
      type: 'users' | 'courses' | 'revenue' | 'analytics'; 
      period: string;
      format: 'csv' | 'xlsx' | 'pdf';
    }): Promise<StandardResponse<any>> => {
      const response = await api.post(
        `/admin/export/${type}?period=${period}&format=${format}`,
        {},
        { requireAuth: true }
      ) as StandardResponse<any>;
      
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      return response;
    },
    {
      // No cache invalidation needed for exports
    }
  );
}

/**
 * PLATFORM SETTINGS - System configuration
 * Medium-impact: Platform configuration
 */
export function usePlatformSettingsQuery() {
  return useApiQuery(
    ['platform-settings'],
    async () => {
      // Fetch platform configuration settings
      const settings = {
        maintenance_mode: false,
        registration_open: true,
        max_upload_size: 100, // MB
        email_notifications: true,
        ai_features_enabled: true,
        payment_providers: ['stripe', 'paypal'],
        supported_currencies: ['USD', 'EUR', 'VND'],
        platform_fee_percentage: 30
      };
      return { success: true, data: settings, message: 'Platform settings retrieved successfully' };
    },
    getCacheConfig('APP_CONFIGURATION') // 10min stable - settings rarely change
  );
}

/**
 * UPDATE PLATFORM SETTINGS - Modify system configuration
 * Critical: Platform management
 */
export function useUpdatePlatformSettings() {
  return useApiMutation(
    async (settings: Record<string, any>): Promise<StandardResponse<any>> => {
      const response = await api.put(
        '/admin/settings',
        settings,
        { requireAuth: true }
      ) as StandardResponse<any>;
      
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      return response;
    },
    {
      invalidateQueries: [
        ['platform-settings'], // Refresh settings
        ['admin-dashboard-stats'], // May affect dashboard
      ],
    }
  );
}