import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { StandardResponse } from '@/lib/types/api';
import { api } from '@/lib/api/api-client';

// Types for analytics data
export interface AnalyticsOverview {
  overview: {
    total_courses: number;
    total_students: number;
    active_students: number;
    total_revenue: number;
    average_rating: number;
    completion_rate: number;
  };
  recent_activity: Array<{
    type: string;
    user_name: string;
    course_title: string;
    timestamp: string;
  }>;
  time_range: string;
}

export interface CourseAnalytics {
  course: {
    id: string;
    title: string;
    total_enrollments: number;
  };
  enrollment_trends: Array<{
    date: string;
    enrollments: number;
  }>;
  progress_distribution: {
    not_started: number;
    in_progress: number;
    completed: number;
  };
  lesson_completion: Array<{
    lesson_id: string;
    completion_rate: number;
    total_students: number;
  }>;
  revenue: {
    total: number;
    average_price: number;
    total_sales: number;
  };
  engagement: {
    average_progress: number;
    average_watch_time: number;
    completion_rate: number;
  };
  time_range: string;
}

export interface StudentAnalytics {
  students: Array<{
    student: {
      id: string;
      name: string;
      email: string;
      joined_date: string;
    };
    metrics: {
      courses_enrolled: number;
      courses_completed: number;
      average_progress: number;
      last_activity: string | null;
    };
    courses: Array<{
      course_id: string;
      course_title: string;
      progress: number;
      enrolled_at: string;
    }>;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface RevenueAnalytics {
  summary: {
    total_revenue: number;
    total_transactions: number;
    average_transaction: number;
    growth_rate: number;
  };
  revenue_trends: Array<{
    date: string;
    revenue: number;
  }>;
  revenue_by_course: Array<{
    course: string;
    revenue: number;
  }>;
  payment_types: {
    course_purchase: number;
    subscription: number;
  };
  time_range: string;
}

// API functions
export const getCreatorOverview = async (timeRange: string = '30days'): Promise<StandardResponse<AnalyticsOverview>> => {
  try {
    const response = await api.get<StandardResponse<AnalyticsOverview>>(
      `/analytics/creator/overview?time_range=${timeRange}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get creator overview error:', error);
    throw error;
  }
};

export const getCourseAnalytics = async (courseId: string, timeRange: string = '30days'): Promise<StandardResponse<CourseAnalytics>> => {
  try {
    const response = await api.get<StandardResponse<CourseAnalytics>>(
      `/analytics/creator/courses/${courseId}?time_range=${timeRange}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get course analytics error:', error);
    throw error;
  }
};

export const getStudentAnalytics = async (limit: number = 20, offset: number = 0): Promise<StandardResponse<StudentAnalytics>> => {
  try {
    const response = await api.get<StandardResponse<StudentAnalytics>>(
      `/analytics/creator/students?limit=${limit}&offset=${offset}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get student analytics error:', error);
    throw error;
  }
};

export const getRevenueAnalytics = async (timeRange: string = '30days'): Promise<StandardResponse<RevenueAnalytics>> => {
  try {
    const response = await api.get<StandardResponse<RevenueAnalytics>>(
      `/analytics/creator/revenue?time_range=${timeRange}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    throw error;
  }
};

export const exportAnalytics = async (reportType: string, timeRange: string = '30days', format: string = 'csv'): Promise<StandardResponse<any>> => {
  try {
    const response = await api.post<StandardResponse<any>>(
      `/analytics/creator/export/${reportType}?time_range=${timeRange}&format=${format}`,
      {},
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Export analytics error:', error);
    throw error;
  }
};