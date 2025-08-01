/**
 * Onboarding API client functions
 * Following StandardResponse pattern and error handling guidelines
 */

import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { StandardResponse } from '@/lib/types/api';
import { api } from '@/lib/api/api-client';

// Types matching backend schemas
export interface OnboardingStatus {
  is_completed: boolean;
  current_step: string;
  skipped: boolean;
  completed_at?: string;
  steps_completed: string[];
  progress_percentage: number;
}

export interface OnboardingStepResponse {
  current_step: string;
  next_step?: string;
  progress_percentage: number;
  is_completed: boolean;
  message: string;
}

export interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  thumbnail?: string;
  is_free: boolean;
  price: number;
  rating: number;
  total_lessons: number;
  recommendation_reason: string;
}

export interface OnboardingRecommendations {
  recommended_courses: CourseRecommendation[];
  learning_paths: Array<{
    title: string;
    description: string;
    duration: string;
    courses_count: number;
  }>;
  next_steps: string[];
  estimated_timeline: string;
}

export interface PlatformTourStep {
  id: string;
  title: string;
  description: string;
  target_element: string;
  position: string;
  action_required?: boolean;
}

export interface PlatformTour {
  steps: PlatformTourStep[];
  total_steps: number;
  estimated_duration: number;
}

// Request types
export interface LearningPathRequest {
  selected_paths: string[];
  skill_level: string;
  time_commitment: string;
  learning_goals: string[];
}

export interface ProfileSetupRequest {
  bio?: string;
  title?: string;
  location?: string;
  interests: string[];
  career_goals: string[];
  linkedin?: string;
  github?: string;
}

export interface OnboardingCompletionRequest {
  selected_courses: string[];
  subscribe_to_newsletter?: boolean;
  enable_notifications?: boolean;
}

/**
 * Get current onboarding status
 */
export const getOnboardingStatus = async (): Promise<StandardResponse<OnboardingStatus>> => {
  try {
    return await api.get<StandardResponse<OnboardingStatus>>(API_ENDPOINTS.ONBOARDING.STATUS, { requireAuth: true });
  } catch (error) {
    console.error('Get onboarding status failed:', error);
    throw error;
  }
};

/**
 * Start onboarding process
 */
export const startOnboarding = async (skipOnboarding: boolean = false): Promise<StandardResponse<OnboardingStepResponse>> => {
  try {
    return await api.post<StandardResponse<OnboardingStepResponse>>(
      API_ENDPOINTS.ONBOARDING.START,
      { skip_onboarding: skipOnboarding },
      { requireAuth: true }
    );
  } catch (error) {
    console.error('Start onboarding failed:', error);
    throw error;
  }
};

/**
 * Update learning path preferences
 */
export const updateLearningPath = async (data: LearningPathRequest): Promise<StandardResponse<OnboardingStepResponse>> => {
  try {
    return await api.post<StandardResponse<OnboardingStepResponse>>(
      API_ENDPOINTS.ONBOARDING.LEARNING_PATH,
      data,
      { requireAuth: true }
    );
  } catch (error) {
    console.error('Update learning path failed:', error);
    throw error;
  }
};

/**
 * Update profile setup
 */
export const updateProfileSetup = async (data: ProfileSetupRequest): Promise<StandardResponse<OnboardingStepResponse>> => {
  try {
    return await api.post<StandardResponse<OnboardingStepResponse>>(
      API_ENDPOINTS.ONBOARDING.PROFILE_SETUP,
      data,
      { requireAuth: true }
    );
  } catch (error) {
    console.error('Update profile setup failed:', error);
    throw error;
  }
};

/**
 * Get course recommendations
 */
export const getCourseRecommendations = async (): Promise<StandardResponse<OnboardingRecommendations>> => {
  try {
    return await api.get<StandardResponse<OnboardingRecommendations>>(API_ENDPOINTS.ONBOARDING.RECOMMENDATIONS, { requireAuth: true });
  } catch (error) {
    console.error('Get course recommendations failed:', error);
    throw error;
  }
};

/**
 * Complete onboarding
 */
export const completeOnboarding = async (data: OnboardingCompletionRequest): Promise<StandardResponse<OnboardingStepResponse>> => {
  try {
    return await api.post<StandardResponse<OnboardingStepResponse>>(
      API_ENDPOINTS.ONBOARDING.COMPLETE,
      data,
      { requireAuth: true }
    );
  } catch (error) {
    console.error('Complete onboarding failed:', error);
    throw error;
  }
};

/**
 * Get platform tour steps
 */
export const getPlatformTour = async (): Promise<StandardResponse<PlatformTour>> => {
  try {
    return await api.get<StandardResponse<PlatformTour>>(API_ENDPOINTS.ONBOARDING.PLATFORM_TOUR, { requireAuth: true });
  } catch (error) {
    console.error('Get platform tour failed:', error);
    throw error;
  }
};

/**
 * Skip onboarding entirely
 */
export const skipOnboarding = async (): Promise<StandardResponse<OnboardingStepResponse>> => {
  try {
    return await api.post<StandardResponse<OnboardingStepResponse>>(API_ENDPOINTS.ONBOARDING.SKIP, {}, { requireAuth: true });
  } catch (error) {
    console.error('Skip onboarding failed:', error);
    throw error;
  }
};