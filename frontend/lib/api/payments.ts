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
 */
export const getSubscriptionStatusColor = (status: SubscriptionStatus | string): string => {
  const statusStr = typeof status === 'string' ? status.toLowerCase() : status;
  
  switch (statusStr) {
    case SubscriptionStatus.ACTIVE:
    case 'active':
      return 'bg-green-100 text-green-800';
    case SubscriptionStatus.CANCELLED:
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case SubscriptionStatus.PAST_DUE:
    case 'past_due':
      return 'bg-yellow-100 text-yellow-800';
    case SubscriptionStatus.INACTIVE:
    case 'inactive':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get payment status badge color
 */
export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.COMPLETED:
      return 'bg-green-100 text-green-800';
    case PaymentStatus.FAILED:
      return 'bg-red-100 text-red-800';
    case PaymentStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case PaymentStatus.REFUNDED:
      return 'bg-purple-100 text-purple-800';
    case PaymentStatus.CANCELLED:
    default:
      return 'bg-gray-100 text-gray-800';
  }
};