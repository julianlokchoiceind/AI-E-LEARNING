/**
 * User API client functions
 * 
 * IMPORTANT: The api client now returns full StandardResponse format.
 * All methods return { success: boolean, data: T, message: string }
 */

import { api } from './api-client';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { StandardResponse } from '@/lib/types/api';

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  premium_status: boolean;
}

export interface DashboardStats {
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  total_hours_learned: number;
  current_streak: number;
  longest_streak: number;
}

export interface RecentCourse {
  id: string;
  title: string;
  thumbnail?: string;
  progress: number;
  last_accessed?: string;
}

export interface UpcomingLesson {
  course_id: string;
  course_title: string;
  lesson_title: string;
  estimated_time: number;
}

export interface DashboardData {
  user: DashboardUser;
  stats: DashboardStats;
  recent_courses: RecentCourse[];
  upcoming_lessons: UpcomingLesson[];
  certificates_earned: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  premium_status: boolean;
  is_verified: boolean;
  profile: {
    avatar?: string;
    bio?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    title?: string;
    skills?: string[];
    learning_goals?: string[];
  };
  stats: {
    courses_enrolled: number;
    courses_completed: number;
    total_hours_learned: number;
    certificates_earned: number;
    current_streak: number;
    longest_streak: number;
  };
  preferences: {
    language: string;
    timezone: string;
    email_notifications: boolean;
    push_notifications: boolean;
    marketing_emails: boolean;
  };
  subscription?: {
    type: string;
    status: string;
    current_period_end?: string;
  };
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export const usersApi = {
  /**
   * Get dashboard data for the authenticated user
   */
  getDashboard: async (): Promise<StandardResponse<DashboardData>> => {
    try {
      const response = await api.get<StandardResponse<DashboardData>>(
        API_ENDPOINTS.USERS.DASHBOARD,
        { requireAuth: true }
      );
      
      return response;
    } catch (error) {
      console.error('Get dashboard failed:', error);
      throw error;
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<StandardResponse<UserProfile>> => {
    try {
      const response = await api.get<StandardResponse<UserProfile>>(
        API_ENDPOINTS.USERS.PROFILE,
        { requireAuth: true }
      );
      
      return response;
    } catch (error) {
      console.error('Get profile failed:', error);
      throw error;
    }
  },

  /**
   * Update current user profile
   */
  updateProfile: async (data: Partial<UserProfile>): Promise<StandardResponse<UserProfile>> => {
    try {
      const response = await api.put<StandardResponse<UserProfile>>(
        API_ENDPOINTS.USERS.UPDATE_PROFILE,
        data,
        { requireAuth: true }
      );
      
      return response;
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  },

  /**
   * Get user's enrolled courses
   */
  getMyCourses: async (): Promise<StandardResponse<any>> => {
    try {
      const response = await api.get<StandardResponse<any>>(
        API_ENDPOINTS.USERS.COURSES,
        { requireAuth: true }
      );
      
      return response;
    } catch (error) {
      console.error('Get my courses failed:', error);
      throw error;
    }
  },

  /**
   * Get user's certificates
   */
  getCertificates: async (): Promise<StandardResponse<any>> => {
    try {
      const response = await api.get<StandardResponse<any>>(
        API_ENDPOINTS.USERS.CERTIFICATES,
        { requireAuth: true }
      );
      
      return response;
    } catch (error) {
      console.error('Get certificates failed:', error);
      throw error;
    }
  },

  /**
   * Get user's learning progress
   */
  getProgress: async (): Promise<StandardResponse<any>> => {
    try {
      const response = await api.get<StandardResponse<any>>(
        API_ENDPOINTS.USERS.PROGRESS,
        { requireAuth: true }
      );
      
      return response;
    } catch (error) {
      console.error('Get progress failed:', error);
      throw error;
    }
  },
};