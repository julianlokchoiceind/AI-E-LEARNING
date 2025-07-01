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
  console.log('[AUTH API DEBUG] registerUser called with:', data);
  
  try {
    console.log('[AUTH API DEBUG] Making API request to /auth/register');
    
    const response = await api.post<StandardResponse<UserResponse>>(
      '/auth/register',
      data,
      {
        requireAuth: false // No auth required for registration
      }
    )

    console.log('[AUTH API DEBUG] Registration API response:', response);
    
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
  const response = await api.post<StandardResponse<any>>('/auth/logout', {})
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