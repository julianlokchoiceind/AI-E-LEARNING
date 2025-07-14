/**
 * Authentication API client functions
 */

import { StandardResponse } from '@/lib/types/api'
import { api } from '@/lib/api/api-client'

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface AuthResponseWithRefresh extends AuthResponse {
  refresh_token: string
  expires_in: number
}

export interface UserResponse {
  id: string
  email: string
  name: string
  role: string
  premium_status: boolean
  is_verified: boolean
  created_at: string
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterData): Promise<StandardResponse<UserResponse>> {
  
  try {
    
    const response = await api.post<StandardResponse<UserResponse>>(
      '/auth/register',
      data,
      {
        requireAuth: false // No auth required for registration
      }
    )

    
    return response;
  } catch (error) {
    console.error('[AUTH API DEBUG] Registration API error:', error);
    throw error
  }
}

/**
 * Login user and get access token
 */
export async function loginUser(data: LoginData): Promise<StandardResponse<AuthResponseWithRefresh>> {
  // OAuth2 compatible login with form data
  const formData = new URLSearchParams()
  formData.append('username', data.email) // OAuth2 uses 'username' field
  formData.append('password', data.password)

  const response = await api.post<StandardResponse<AuthResponseWithRefresh>>(
    '/auth/login',
    formData.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      requireAuth: false
    }
  )
  
  return response;
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<StandardResponse<{ email?: string }>> {
  const response = await api.get<StandardResponse<{ email?: string }>>(
    `/auth/verify-email?token=${encodeURIComponent(token)}`,
    { requireAuth: false }
  )
  
  return response;
}

/**
 * Refresh access token
 */
export async function refreshToken(token: string): Promise<StandardResponse<AuthResponseWithRefresh>> {
  const response = await api.post<StandardResponse<AuthResponseWithRefresh>>(
    '/auth/refresh',
    { refresh_token: token },
    {
      requireAuth: false // No auth required for refresh endpoint
    }
  )
  return response
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<StandardResponse<any>> {
  const response = await api.post<StandardResponse<any>>(
    '/auth/logout', 
    {},
    { requireAuth: true } // Need auth header to blacklist the token
  )
  return response
}

/**
 * Request password reset email
 */
export async function forgotPassword(email: string): Promise<StandardResponse<any>> {
  const response = await api.post<StandardResponse<any>>(
    '/auth/forgot-password',
    { email },
    { requireAuth: false }
  )
  return response
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string, confirmPassword?: string): Promise<StandardResponse<{ email: string }>> {
  const response = await api.post<StandardResponse<{ email: string }>>(
    '/auth/reset-password',
    {
      token,
      new_password: newPassword,
      confirm_password: confirmPassword // Backend validates if provided
    },
    { requireAuth: false }
  )
  return response
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<StandardResponse<{ email: string }>> {
  const response = await api.post<StandardResponse<{ email: string }>>(
    '/auth/resend-verification',
    { email },
    { requireAuth: false }
  )
  return response
}

// =============================================================================
// MISSING FUNCTIONS - Add complete user profile and session management
// =============================================================================

export interface UserProfileData {
  name?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  title?: string;
}

export interface UserPreferencesData {
  language?: string;
  timezone?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  marketing_emails?: boolean;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * Get user profile information
 */
export async function getUserProfile(): Promise<StandardResponse<UserResponse & { profile?: UserProfileData }>> {
  const response = await api.get<StandardResponse<UserResponse & { profile?: UserProfileData }>>('/users/me')
  return response
}

/**
 * Update user profile information
 */
export async function updateProfile(data: UserProfileData): Promise<StandardResponse<UserResponse>> {
  const response = await api.put<StandardResponse<UserResponse>>('/users/me', data)
  return response
}

/**
 * Change user password
 */
export async function changePassword(data: ChangePasswordData): Promise<StandardResponse<{ message: string }>> {
  const response = await api.put<StandardResponse<{ message: string }>>('/auth/change-password', data)
  return response
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<StandardResponse<UserPreferencesData>> {
  const response = await api.get<StandardResponse<UserPreferencesData>>('/auth/preferences')
  return response
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(data: UserPreferencesData): Promise<StandardResponse<UserPreferencesData>> {
  const response = await api.put<StandardResponse<UserPreferencesData>>('/auth/preferences', data)
  return response
}

/**
 * Check current session validity
 */
export async function checkSession(): Promise<StandardResponse<UserResponse>> {
  const response = await api.get<StandardResponse<UserResponse>>('/users/me')
  return response
}

// =============================================================================
// EXPORT ALIASES - Fix naming mismatches for React Query hooks
// =============================================================================

/**
 * Alias exports for consistency
 */
export const login = loginUser;
export const register = registerUser;
export const resendVerification = resendVerificationEmail;