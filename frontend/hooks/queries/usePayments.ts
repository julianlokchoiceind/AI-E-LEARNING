'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { 
  getSubscriptionStatus, 
  getPaymentHistory, 
  cancelSubscription,
  createSubscription,
  createCoursePayment 
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
    ({ paymentMethodId, subscriptionType }: { paymentMethodId: string; subscriptionType: string }) => 
      createSubscription(paymentMethodId, subscriptionType),
    {
      invalidateQueries: [
        ['subscription-status'], // Refresh subscription status
        ['payment-history'], // Refresh payment history
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