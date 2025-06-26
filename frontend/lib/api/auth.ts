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
export async function registerUser(data: RegisterData): Promise<UserResponse> {
  const result = await api.post<StandardResponse<UserResponse>>('/auth/register', data)
  return result.data!
}

/**
 * Login user and get access token
 */
export async function loginUser(data: LoginData): Promise<AuthResponse> {
  // OAuth2 compatible login with form data
  const formData = new URLSearchParams()
  formData.append('username', data.email) // OAuth2 uses 'username' field
  formData.append('password', data.password)

  const result = await api.post<StandardResponse<AuthResponse>>(
    '/auth/login',
    formData.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )
  
  return result.data!
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<{ message: string; email: string }> {
  const result = await api.get<StandardResponse<{ message: string; email: string }>>(
    `/auth/verify-email?token=${encodeURIComponent(token)}`
  )
  return result.data!
}

/**
 * Refresh access token
 */
export async function refreshToken(token: string): Promise<AuthResponse> {
  const result = await api.post<StandardResponse<AuthResponse>>(
    '/auth/refresh',
    null,
    {
      requireAuth: true
    }
  )
  return result.data!
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<{ message: string }> {
  const result = await api.post<StandardResponse<{ message: string }>>('/auth/logout')
  return result.data!
}

/**
 * Request password reset email
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const result = await api.post<StandardResponse<{ message: string }>>(
    '/auth/forgot-password',
    { email }
  )
  return result.data!
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ message: string; email: string }> {
  const result = await api.post<StandardResponse<{ message: string; email: string }>>(
    '/auth/reset-password',
    {
      token,
      new_password: newPassword
    }
  )
  return result.data!
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<{ message: string; email: string }> {
  const result = await api.post<StandardResponse<{ message: string; email: string }>>(
    '/auth/resend-verification',
    { email }
  )
  return result.data!
}