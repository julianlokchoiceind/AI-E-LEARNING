/**
 * Admin API client functions
 * Based on CLAUDE.md admin workflows
 */

import { StandardResponse } from '@/lib/types/api';
import { api } from '@/lib/api/api-client';

// Types
export interface AdminDashboardStats {
  total_users: number;
  total_students: number;
  total_creators: number;
  total_admins: number;
  new_users_today: number;
  new_users_this_week: number;
  total_courses: number;
  published_courses: number;
  draft_courses: number;
  pending_review_courses: number;
  archived_courses: number;
  coming_soon_courses: number;
  total_enrollments: number;
  active_enrollments: number;
  completed_courses: number;
  total_revenue: number;
  revenue_this_month: number;
  revenue_today: number;
  average_course_price: number;
  active_users_today: number;
  active_users_this_week: number;
  lessons_completed_today: number;
  recent_registrations: any[];
  recent_course_submissions: any[];
  recent_enrollments: any[];
}

export interface UserListResponse {
  users: UserAdminView[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface UserAdminView {
  id: string;
  name: string;
  email: string;
  role: string;
  premium_status: boolean;
  subscription?: any;
  created_at: string;
  last_login?: string;
  stats?: any;
}

export interface PaymentListResponse {
  payments: PaymentAdminView[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaymentAdminView {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  course_id?: string;
  created_at: string;
  paid_at?: string;
}

export interface RevenueAnalytics {
  period: string;
  date_range: {
    from: string;
    to: string;
  };
  total_revenue: number;
  revenue_by_type: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
  daily_revenue: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
  currency: string;
}

export interface UserAnalytics {
  total_users: number;
  users_by_role: Array<{
    _id: string;
    count: number;
  }>;
  user_growth: Array<{
    _id: string;
    count: number;
  }>;
  active_users_7d: number;
  premium_users: number;
  pro_subscribers: number;
}

// API Functions

/**
 * Get admin dashboard statistics
 */
export const getAdminDashboardStats = async (): Promise<StandardResponse<AdminDashboardStats>> => {
  try {
    const response = await api.get<StandardResponse<AdminDashboardStats>>(
      '/admin/dashboard/stats',
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get courses pending review
 */
export const getPendingReviewCourses = async (
  page: number = 1,
  perPage: number = 20
): Promise<StandardResponse<any[]>> => {
  try {
    const response = await api.get<StandardResponse<any[]>>(
      `/admin/courses/pending-review?page=${page}&per_page=${perPage}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get pending review courses failed:', error);
    throw error;
  }
};

/**
 * Approve course
 */
export const approveCourse = async (courseId: string): Promise<StandardResponse<any>> => {
  try {
    const response = await api.post<StandardResponse<any>>(
      `/admin/courses/${courseId}/approve`,
      {},
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Approve course failed:', error);
    throw error;
  }
};

/**
 * Reject course with feedback
 */
export const rejectCourse = async (
  courseId: string,
  feedback: string
): Promise<StandardResponse<any>> => {
  try {
    const response = await api.post<StandardResponse<any>>(
      `/admin/courses/${courseId}/reject`,
      { feedback },
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Reject course failed:', error);
    throw error;
  }
};

/**
 * List users with filters
 */
export const listUsers = async (
  page: number = 1,
  perPage: number = 20,
  filters?: {
    role?: string;
    premiumOnly?: boolean;
    search?: string;
  }
): Promise<StandardResponse<UserListResponse>> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (filters?.role) params.append('role', filters.role);
    if (filters?.premiumOnly !== undefined) params.append('premium_only', filters.premiumOnly.toString());
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get<StandardResponse<UserListResponse>>(
      `/admin/users?${params}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('List users failed:', error);
    throw error;
  }
};

/**
 * Update user premium status
 */
export const updateUserPremiumStatus = async (
  userId: string,
  isPremium: boolean
): Promise<StandardResponse<any>> => {
  try {
    const response = await api.put<StandardResponse<any>>(
      `/admin/users/${userId}/premium?is_premium=${isPremium}`,
      {},
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Update user premium status failed:', error);
    throw error;
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (
  userId: string,
  role: string
): Promise<StandardResponse<any>> => {
  try {
    const response = await api.put<StandardResponse<any>>(
      `/admin/users/${userId}/role?role=${role}`,
      {},
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Update user role failed:', error);
    throw error;
  }
};

/**
 * Delete user
 */
export const deleteUser = async (userId: string): Promise<StandardResponse<any>> => {
  try {
    const response = await api.delete<StandardResponse<any>>(
      `/admin/users/${userId}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Delete user failed:', error);
    throw error;
  }
};

/**
 * List payments with filters
 */
export const listPayments = async (
  page: number = 1,
  perPage: number = 20,
  filters?: {
    status?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<StandardResponse<PaymentListResponse>> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (filters?.status) params.append('status', filters.status);
    if (filters?.userId) params.append('user_id', filters.userId);
    if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters?.dateTo) params.append('date_to', filters.dateTo);

    const response = await api.get<StandardResponse<PaymentListResponse>>(
      `/admin/payments?${params}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('List payments failed:', error);
    throw error;
  }
};

/**
 * Process payment refund
 */
export const refundPayment = async (
  paymentId: string,
  amount: number | null,
  reason: string
): Promise<StandardResponse<any>> => {
  try {
    const params = new URLSearchParams({ reason });
    if (amount !== null) params.append('amount', amount.toString());

    const response = await api.post<StandardResponse<any>>(
      `/admin/payments/${paymentId}/refund?${params}`,
      {},
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Refund payment failed:', error);
    throw error;
  }
};

/**
 * Get revenue analytics
 */
export const getRevenueAnalytics = async (
  period: string = 'month',
  dateFrom?: string,
  dateTo?: string
): Promise<StandardResponse<RevenueAnalytics>> => {
  try {
    const params = new URLSearchParams({ period });
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    const response = await api.get<StandardResponse<RevenueAnalytics>>(
      `/admin/analytics/revenue?${params}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get revenue analytics failed:', error);
    throw error;
  }
};

/**
 * Get user analytics
 */
export const getUserAnalytics = async (): Promise<StandardResponse<UserAnalytics>> => {
  try {
    const response = await api.get<StandardResponse<UserAnalytics>>(
      '/admin/analytics/users',
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get user analytics failed:', error);
    throw error;
  }
};

/**
 * Get admin analytics data (same as dashboard stats)
 */
export const getAdminAnalytics = async (): Promise<StandardResponse<AdminDashboardStats>> => {
  return getAdminDashboardStats();
};

/**
 * Get admin courses with filters
 */
interface AdminCoursesResponse {
  courses: any[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const getAdminCourses = async (params?: {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
  category?: string;
}): Promise<StandardResponse<AdminCoursesResponse>> => {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }

  try {
    const response = await api.get<StandardResponse<AdminCoursesResponse>>(
      `/admin/courses?${queryParams.toString()}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get admin courses failed:', error);
    throw error;
  }
};

/**
 * Get course statistics for dashboard Quick Stats
 */
export const getAdminStatistics = async (): Promise<StandardResponse<{
  total_courses: number;
  pending_review: number;
  published: number;
  rejected: number;
  free_courses: number;
}>> => {
  try {
    const response = await api.get<StandardResponse<{
      total_courses: number;
      pending_review: number;
      published: number;
      rejected: number;
      free_courses: number;
    }>>(
      `/admin/course-statistics`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get admin statistics failed:', error);
    throw error;
  }
};

/**
 * Get admin users (alias for listUsers)
 */
export const getAdminUsers = async (params?: {
  page?: number;
  per_page?: number;
  role?: string;
  search?: string;
  premiumOnly?: boolean;
}): Promise<StandardResponse<UserListResponse>> => {
  const { page = 1, per_page = 20, role, search, premiumOnly } = params || {};
  return listUsers(page, per_page, { role, search, premiumOnly });
};

/**
 * Toggle user premium status (alias for updateUserPremiumStatus)
 */
export const toggleUserPremium = async (userId: string, premiumStatus: boolean): Promise<StandardResponse<any>> => {
  return updateUserPremiumStatus(userId, premiumStatus);
};

/**
 * Toggle course free status
 */
export const toggleCourseFree = async (courseId: string, isFree: boolean): Promise<StandardResponse<any>> => {
  try {
    const response = await api.put<StandardResponse<any>>(
      `/admin/courses/${courseId}/free`,
      { is_free: isFree },
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Toggle course free status failed:', error);
    throw error;
  }
};

/**
 * Update course pricing (admin override)
 * Matches backend endpoint: PUT /admin/courses/{course_id}/pricing
 */
export const updateCoursePricing = async (
  courseId: string, 
  is_free: boolean, 
  price?: number
): Promise<StandardResponse<any>> => {
  try {
    const params = new URLSearchParams({ is_free: is_free.toString() });
    if (price !== undefined && price !== null) {
      params.append('price', price.toString());
    }
    
    const response = await api.put<StandardResponse<any>>(
      `/admin/courses/${courseId}/pricing?${params}`,
      {},
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Update course pricing failed:', error);
    throw error;
  }
};

/**
 * Get platform analytics
 */
export const getPlatformAnalytics = async (filters?: {
  period?: string;
  startDate?: string;
  endDate?: string;
}): Promise<StandardResponse<any>> => {
  try {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);

    const response = await api.get<StandardResponse<any>>(
      `/admin/analytics/platform${params.toString() ? `?${params}` : ''}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get platform analytics failed:', error);
    throw error;
  }
};

/**
 * Get user growth stats
 */
export const getUserGrowthStats = async (filters?: {
  period?: string;
}): Promise<StandardResponse<any>> => {
  try {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);

    const response = await api.get<StandardResponse<any>>(
      `/admin/analytics/user-growth${params.toString() ? `?${params}` : ''}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get user growth stats failed:', error);
    throw error;
  }
};

/**
 * Get revenue stats
 */
export const getRevenueStats = async (filters?: {
  period?: string;
  startDate?: string;
  endDate?: string;
}): Promise<StandardResponse<any>> => {
  try {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);

    const response = await api.get<StandardResponse<any>>(
      `/admin/analytics/revenue${params.toString() ? `?${params}` : ''}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get revenue stats failed:', error);
    throw error;
  }
};

/**
 * Get course stats
 */
export const getCourseStats = async (filters?: {
  period?: string;
}): Promise<StandardResponse<any>> => {
  try {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);

    const response = await api.get<StandardResponse<any>>(
      `/admin/analytics/courses${params.toString() ? `?${params}` : ''}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get course stats failed:', error);
    throw error;
  }
};

/**
 * Get system health metrics
 */
export const getSystemHealth = async (): Promise<StandardResponse<any>> => {
  try {
    const response = await api.get<StandardResponse<any>>(
      '/admin/system/health',
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get system health failed:', error);
    throw error;
  }
};