'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { 
  getSubscriptionStatus, 
  getPaymentHistory, 
  cancelSubscription,
  createSubscription,
  createCoursePayment,
  getPaymentAnalyticsDashboard,
  getAdminPaymentHistory,
  SubscriptionType
} from '@/lib/api/payments';

/**
 * Hook for fetching user's subscription status
 * Optimized for billing dashboard
 */
export function useSubscriptionStatusQuery(enabled: boolean = true) {
  return useApiQuery(
    ['subscription-status'],
    () => getSubscriptionStatus(),
    {
      enabled,
      ...getCacheConfig('SUBSCRIPTION_STATUS') // Subscription status - fresh data
    }
  );
}

/**
 * Hook for fetching payment history
 * Used in billing dashboard
 */
export function usePaymentHistoryQuery(limit: number = 10, offset: number = 0, enabled: boolean = true) {
  return useApiQuery(
    ['payment-history', { limit, offset }],
    () => getPaymentHistory(limit, offset),
    {
      enabled,
      ...getCacheConfig('PAYMENT_HISTORY') // Payment history - moderate freshness
    }
  );
}

/**
 * Hook for billing dashboard data
 * Combines subscription status and payment history
 */
export function useBillingDashboardQuery(enabled: boolean = true) {
  const subscriptionQuery = useSubscriptionStatusQuery(enabled);
  const paymentHistoryQuery = usePaymentHistoryQuery(10, 0, enabled);

  return {
    subscriptionStatus: subscriptionQuery.data,
    subscriptionLoading: subscriptionQuery.loading,
    paymentHistory: paymentHistoryQuery.data,
    paymentLoading: paymentHistoryQuery.loading,
    loading: subscriptionQuery.loading || paymentHistoryQuery.loading,
    error: subscriptionQuery.error || paymentHistoryQuery.error,
    refetchSubscription: subscriptionQuery.execute,
    refetchPayments: paymentHistoryQuery.execute,
    refetchAll: async () => {
      await Promise.all([
        subscriptionQuery.execute(),
        paymentHistoryQuery.execute()
      ]);
    }
  };
}

/**
 * Mutation for canceling subscription
 */
export function useCancelSubscription() {
  return useApiMutation(
    (cancelAtPeriodEnd: boolean = true) => cancelSubscription(cancelAtPeriodEnd),
    {
      invalidateQueries: [
        ['subscription-status'], // Refresh subscription status
        ['payment-history'], // Refresh payment history
        ['payment-analytics-dashboard'], // Refresh payment analytics
        ['admin-payment-history'], // Refresh admin payment history
      ],
      operationName: 'cancel-subscription', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * Mutation for creating subscription
 */
export function useCreateSubscription() {
  return useApiMutation(
    ({ paymentMethodId, subscriptionType }: { paymentMethodId: string; subscriptionType: SubscriptionType }) => 
      createSubscription(paymentMethodId, subscriptionType),
    {
      invalidateQueries: [
        ['subscription-status'], // Refresh subscription status
        ['payment-history'], // Refresh payment history
        ['payment-analytics-dashboard'], // Refresh payment analytics
        ['admin-payment-history'], // Refresh admin payment history
      ],
      operationName: 'create-subscription', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * Mutation for creating course payment
 */
export function useCreateCoursePayment() {
  return useApiMutation(
    ({ courseId, paymentMethodId }: { courseId: string; paymentMethodId: string }) => 
      createCoursePayment(courseId, paymentMethodId),
    {
      invalidateQueries: [
        ['payment-history'], // Refresh payment history
        ['payment-analytics-dashboard'], // Refresh payment analytics
        ['admin-payment-history'], // Refresh admin payment history
      ],
      operationName: 'create-course-payment', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * Hook for subscription management with automatic refetch
 */
export function useSubscriptionManagement() {
  const subscriptionQuery = useSubscriptionStatusQuery();
  const cancelMutation = useCancelSubscription();

  return {
    subscription: subscriptionQuery.data,
    loading: subscriptionQuery.loading,
    error: subscriptionQuery.error,
    cancelSubscription: cancelMutation.mutate,
    canceling: cancelMutation.loading,
    refetch: subscriptionQuery.execute,
  };
}

// OLD HOOKS COMPLETELY REMOVED - Only using optimized dashboard endpoint

/**
 * Hook for fetching admin payment history with user details
 * Admin-only hook that shows all payments across platform
 * Updated for unified pagination pattern
 */
export function useAdminPaymentHistoryQuery(
  page: number = 1,
  per_page: number = 20,
  status?: string,
  type?: string,
  enabled: boolean = true
) {
  return useApiQuery(
    ['admin-payment-history', { page, per_page, status, type }],
    () => getAdminPaymentHistory(page, per_page, status, type),
    {
      enabled,
      ...getCacheConfig('PAYMENT_ANALYTICS_SUMMARY'), // Use same cache as other admin analytics
      keepPreviousData: true, // Smooth filter transitions
    }
  );
}

/**
 * OPTIMIZED: Single hook for payment analytics dashboard
 * Uses combined endpoint to reduce API calls from 2 to 1
 */
export function usePaymentAnalyticsDashboardQuery(days: number = 30, enabled: boolean = true) {
  return useApiQuery(
    ['payment-analytics-dashboard', { days }],
    () => getPaymentAnalyticsDashboard('all', days),
    {
      enabled,
      ...getCacheConfig('PAYMENT_ANALYTICS_SUMMARY') // Use moderate cache
    }
  );
}

/**
 * OPTIMIZED: Combined hook for payment analytics dashboard  
 * Uses SINGLE endpoint instead of 2 separate calls
 * PERFORMANCE: 50% reduction in API calls
 */
export function usePaymentAnalyticsQuery(days: number = 30, enabled: boolean = true) {
  const dashboardQuery = usePaymentAnalyticsDashboardQuery(days, enabled);

  return {
    // Data - extract from combined response
    summary: dashboardQuery.data?.data?.summary ? {
      data: dashboardQuery.data.data.summary,
      success: dashboardQuery.data.success,
      message: dashboardQuery.data.message
    } : undefined,
    trends: dashboardQuery.data?.data?.trends ? {
      data: dashboardQuery.data.data.trends,
      success: dashboardQuery.data.success,
      message: dashboardQuery.data.message
    } : undefined,
    
    // Loading states - single loading state (optimized)
    summaryLoading: dashboardQuery.loading,
    trendsLoading: dashboardQuery.loading,
    loading: dashboardQuery.loading,
    
    // Error states - single error state (optimized)
    summaryError: dashboardQuery.error,
    trendsError: dashboardQuery.error,
    error: dashboardQuery.error,
    
    // Refetch functions - single refetch (optimized)
    refetchSummary: dashboardQuery.execute,
    refetchTrends: dashboardQuery.execute,
    refetchAll: dashboardQuery.execute
  };
}