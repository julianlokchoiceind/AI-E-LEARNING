/**
 * Payment API client functions
 * Based on CLAUDE.md payment workflows
 */

import { StandardResponse } from '@/lib/types/api';
import { api } from '@/lib/api/api-client';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';

// Payment Types
export enum PaymentType {
  COURSE_PURCHASE = 'course_purchase',
  SUBSCRIPTION = 'subscription',
  REFUND = 'refund'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum SubscriptionType {
  FREE = 'free',
  PRO = 'pro'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due'
}

// Request Interfaces
export interface CoursePaymentRequest {
  course_id: string;
  payment_method_id: string;
}

export interface SubscriptionRequest {
  payment_method_id: string;
  plan_type: SubscriptionType;
}

export interface SubscriptionCancelRequest {
  cancel_at_period_end: boolean;
  reason?: string;
}

// Response Interfaces
export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

export interface PaymentResponse {
  id: string;
  user_id: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_payment_id?: string;
  course_id?: string;
  subscription_id?: string;
  metadata?: Record<string, any>;
  paid_at?: string;
  created_at: string;
}

export interface SubscriptionResponse {
  id: string;
  user_id: string;
  type: SubscriptionType;
  status: SubscriptionStatus;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

export interface PaymentHistoryResponse {
  payments: PaymentResponse[];
  total_count: number;
  total_amount: number;
}

export interface SubscriptionStatusResponse {
  type: string;
  status: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  has_subscription: boolean;
}

// API Client Functions

/**
 * Create payment intent for course purchase
 */
export const createCoursePayment = async (
  courseId: string,
  paymentMethodId: string
): Promise<StandardResponse<PaymentIntentResponse>> => {
  try {
    const response = await api.post<StandardResponse<PaymentIntentResponse>>(
      `/payments/course/${courseId}`,
      {
        course_id: courseId,
        payment_method_id: paymentMethodId,
      },
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Create course payment failed:', error);
    throw error;
  }
};

/**
 * Create Pro subscription
 */
export const createSubscription = async (
  paymentMethodId: string,
  planType: SubscriptionType = SubscriptionType.PRO
): Promise<StandardResponse<SubscriptionResponse>> => {
  try {
    const response = await api.post<StandardResponse<SubscriptionResponse>>(
      '/payments/subscription',
      {
        payment_method_id: paymentMethodId,
        plan_type: planType,
      },
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Create subscription failed:', error);
    throw error;
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (
  limit: number = 20,
  offset: number = 0
): Promise<StandardResponse<PaymentHistoryResponse>> => {
  try {
    const response = await api.get<StandardResponse<PaymentHistoryResponse>>(
      `/payments/history?limit=${limit}&offset=${offset}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get payment history failed:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (
  cancelAtPeriodEnd: boolean = true,
  reason?: string
): Promise<StandardResponse<any>> => {
  try {
    const response = await api.post<StandardResponse<any>>(
      '/payments/cancel',
      {
        cancel_at_period_end: cancelAtPeriodEnd,
        reason,
      },
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Cancel subscription failed:', error);
    throw error;
  }
};

/**
 * Get admin payment history with user details (Admin only)
 * Updated for unified pagination pattern
 */
export const getAdminPaymentHistory = async (
  page: number = 1,
  per_page: number = 20,
  status?: string,
  type?: string
): Promise<StandardResponse<any>> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
    });
    
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    
    const response = await api.get<StandardResponse<any>>(
      `/payments/admin/history?${params.toString()}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get admin payment history failed:', error);
    throw error;
  }
};

/**
 * Get subscription status
 */
export const getSubscriptionStatus = async (): Promise<StandardResponse<SubscriptionStatusResponse>> => {
  try {
    const response = await api.get<StandardResponse<SubscriptionStatusResponse>>(
      '/payments/subscription/status',
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get subscription status failed:', error);
    throw error;
  }
};

/**
 * Format price for display
 */
export const formatPrice = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format subscription period
 */
export const formatSubscriptionPeriod = (
  start: string,
  end: string
): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  
  return `${startDate.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString('en-US', formatOptions)}`;
};

/**
 * Get subscription status badge color
 * @deprecated Use getSubscriptionStatusColorClass from badge-helpers instead
 */
export const getSubscriptionStatusColor = (status: SubscriptionStatus | string): string => {
  // Import at runtime to avoid circular dependencies
  const { getSubscriptionStatusColorClass } = require('@/lib/utils/badge-helpers');
  const statusStr = typeof status === 'string' ? status.toLowerCase() : status;
  return getSubscriptionStatusColorClass(statusStr);
};

/**
 * Get payment status badge color
 * @deprecated Use getPaymentStatusColorClass from badge-helpers instead
 */
export const getPaymentStatusColor = (status: PaymentStatus): string => {
  // Import at runtime to avoid circular dependencies
  const { getPaymentStatusColorClass } = require('@/lib/utils/badge-helpers');
  return getPaymentStatusColorClass(status.toLowerCase());

};

// Payment Analytics Interfaces
export interface PaymentAnalyticsSummary {
  revenue: {
    total: number;
    this_month: number;
    average_payment: number;
  };
  payments: {
    total_count: number;
    by_status: Record<string, number>;
    by_type: {
      course_purchases: number;
      subscriptions: number;
    };
  };
  subscriptions: {
    active_count: number;
  };
  period: {
    from: string;
    to: string;
  };
}

export interface PaymentAnalyticsTrends {
  period: {
    from: string;
    to: string;
    days: number;
  };
  daily_revenue: Array<{
    date: string;
    total_revenue: number;
    payment_count: number;
    success_rate: number;
  }>;
  top_courses: Array<{
    course_id: string;
    course_title: string;
    total_revenue: number;
    payment_count: number;
  }>;
  payment_methods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  success_metrics: {
    overall_success_rate: number;
    completion_rate: number;
    refund_rate: number;
  };
}

/**
 * Get payment analytics dashboard (optimized combined endpoint)
 * Replaces getPaymentAnalyticsSummary and getPaymentAnalyticsTrends
 */
export const getPaymentAnalyticsDashboard = async (
  include: 'all' | 'summary' | 'trends' = 'all',
  days: number = 30
): Promise<StandardResponse<any>> => {
  try {
    const response = await api.get<StandardResponse<any>>(
      `/payments/analytics/dashboard?include=${include}&days=${days}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get payment analytics dashboard failed:', error);
    throw error;
  }
};

// OLD FUNCTIONS REMOVED - Use getPaymentAnalyticsDashboard only