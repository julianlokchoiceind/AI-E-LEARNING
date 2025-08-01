import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { 
  getCreatorOverview, 
  getCourseAnalytics, 
  getStudentAnalytics, 
  getRevenueAnalytics,
  exportAnalytics 
} from '@/lib/api/analytics';
import type { 
  AnalyticsOverview, 
  CourseAnalytics, 
  StudentAnalytics, 
  RevenueAnalytics 
} from '@/lib/api/analytics';

/**
 * Hook for fetching creator analytics overview
 */
export function useCreatorOverviewQuery(timeRange: string = '30days', enabled: boolean = true) {
  return useApiQuery(
    ['creator-overview', timeRange],
    () => getCreatorOverview(timeRange),
    {
      enabled,
      ...getCacheConfig('ANALYTICS_OVERVIEW') // Analytics overview - moderate freshness
    }
  );
}

/**
 * Hook for fetching revenue analytics
 */
export function useRevenueAnalyticsQuery(timeRange: string = '30days', enabled: boolean = true) {
  return useApiQuery(
    ['revenue-analytics', timeRange],
    () => getRevenueAnalytics(timeRange),
    {
      enabled,
      ...getCacheConfig('REVENUE_ANALYTICS') // Revenue analytics - moderate freshness
    }
  );
}

/**
 * Hook for fetching student analytics
 */
export function useStudentAnalyticsQuery(
  limit: number = 20, 
  offset: number = 0, 
  enabled: boolean = true
) {
  return useApiQuery(
    ['student-analytics', limit, offset],
    () => getStudentAnalytics(limit, offset),
    {
      enabled,
      ...getCacheConfig('STUDENT_ANALYTICS') // Student analytics - stable content
    }
  );
}

/**
 * Hook for fetching course-specific analytics
 */
export function useCourseAnalyticsQuery(
  courseId: string, 
  timeRange: string = '30days', 
  enabled: boolean = true
) {
  return useApiQuery(
    ['course-analytics', courseId, timeRange],
    () => getCourseAnalytics(courseId, timeRange),
    {
      enabled: enabled && !!courseId,
      ...getCacheConfig('COURSE_ANALYTICS') // Course analytics - moderate freshness
    }
  );
}

/**
 * Hook for exporting analytics data
 */
export function useExportAnalytics() {
  return useApiMutation(
    ({ reportType, timeRange, format }: { 
      reportType: string; 
      timeRange: string; 
      format: string;
    }) => exportAnalytics(reportType, timeRange, format),
    {
      operationName: 'export-analytics', // For toast deduplication
      showToast: true, // Show success/error toasts
    }
  );
}

/**
 * Combined hook for all analytics data used on analytics dashboard
 */
export function useAnalyticsDashboardQuery(timeRange: string = '30days', enabled: boolean = true) {
  const overviewQuery = useCreatorOverviewQuery(timeRange, enabled);
  const revenueQuery = useRevenueAnalyticsQuery(timeRange, enabled);
  const studentsQuery = useStudentAnalyticsQuery(20, 0, enabled);

  return {
    // Individual queries
    overview: overviewQuery,
    revenue: revenueQuery,
    students: studentsQuery,
    
    // Combined loading state
    loading: overviewQuery.loading || revenueQuery.loading || studentsQuery.loading,
    
    // Combined error state
    error: overviewQuery.error || revenueQuery.error || studentsQuery.error,
    
    // Refetch all function
    refetchAll: async () => {
      await Promise.all([
        overviewQuery.execute(),
        revenueQuery.execute(),
        studentsQuery.execute()
      ]);
    }
  };
}