/**
 * Authentication API client functions
 */

import { StandardResponse } from '@/lib/types/api'
import { toast } from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

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
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const result: StandardResponse<UserResponse> = await response.json()

  if (!response.ok || !result.success) {
    toast.error(result.message || 'Registration failed')
    throw new Error(result.message || 'Registration failed')
  }

  toast.success(result.message)
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

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  const result: StandardResponse<AuthResponse> = await response.json()

  if (!response.ok || !result.success) {
    toast.error(result.message || 'Login failed')
    throw new Error(result.message || 'Login failed')
  }

  toast.success(result.message)
  return result.data!
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<{ message: string; email: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: 'GET',
  })

  const result: StandardResponse<{ message: string; email: string }> = await response.json()

  if (!response.ok || !result.success) {
    toast.error(result.message || 'Email verification failed')
    throw new Error(result.message || 'Email verification failed')
  }

  toast.success(result.message)
  return result.data!
}

/**
 * Refresh access token
 */
export async function refreshToken(token: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const result: StandardResponse<AuthResponse> = await response.json()

  if (!response.ok || !result.success) {
    // Don't show toast for token refresh failures
    throw new Error(result.message || 'Token refresh failed')
  }

  return result.data!
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
  })

  const result: StandardResponse<{ message: string }> = await response.json()

  if (!response.ok || !result.success) {
    toast.error(result.message || 'Logout failed')
    throw new Error(result.message || 'Logout failed')
  }

  toast.success(result.message)
  return result.data!
}

/**
 * Request password reset email
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  const result: StandardResponse<{ message: string }> = await response.json()

  if (!response.ok || !result.success) {
    toast.error(result.message || 'Failed to send reset email')
    throw new Error(result.message || 'Failed to send reset email')
  }

  toast.success(result.message)
  return result.data!
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ message: string; email: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      token,
      new_password: newPassword 
    }),
  })

  const result: StandardResponse<{ message: string; email: string }> = await response.json()

  if (!response.ok || !result.success) {
    toast.error(result.message || 'Failed to reset password')
    throw new Error(result.message || 'Failed to reset password')
  }

  toast.success(result.message)
  return result.data!
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<{ message: string; email: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  const result: StandardResponse<{ message: string; email: string }> = await response.json()

  if (!response.ok || !result.success) {
    toast.error(result.message || 'Failed to resend verification email')
    throw new Error(result.message || 'Failed to resend verification email')
  }

  toast.success(result.message)
  return result.data!
}