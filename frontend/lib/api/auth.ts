/**
 * Authentication API client functions
 * 
 * IMPORTANT: The api client (from api-client.ts) automatically unwraps StandardResponse format.
 * When you call api.post<T>(), it returns T directly, not StandardResponse<T>.
 * The api client handles the unwrapping internally in the request() method.
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
export async function registerUser(data: RegisterData): Promise<{ user: UserResponse; message: string }> {
  console.log('[AUTH API DEBUG] registerUser called with:', data);
  
  try {
    console.log('[AUTH API DEBUG] Making API request to /auth/register');
    
    // The API client already unwraps StandardResponse and returns just the data
    const user = await api.post<UserResponse>(
      '/auth/register',
      data,
      {
        requireAuth: false // No auth required for registration
      }
    )

    console.log('[AUTH API DEBUG] Registration API response:', user);
    
    // Return the user and a success message
    return {
      user: user,
      message: 'Registration successful! Please check your email to verify your account.'
    }
  } catch (error) {
    console.error('[AUTH API DEBUG] Registration API error:', error);
    // The api client already handles error parsing
    throw error
  }
}

/**
 * Login user and get access token
 */
export async function loginUser(data: LoginData): Promise<AuthResponseWithRefresh> {
  // OAuth2 compatible login with form data
  const formData = new URLSearchParams()
  formData.append('username', data.email) // OAuth2 uses 'username' field
  formData.append('password', data.password)

  // The api.post returns the unwrapped data from StandardResponse
  const result = await api.post<AuthResponseWithRefresh>(
    '/auth/login',
    formData.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )
  
  if (!result) {
    throw new Error('No response from login API');
  }
  
  return result;
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<{ message: string; email?: string }> {
  const result = await api.get<{ email?: string; message?: string }>(
    `/auth/verify-email?token=${encodeURIComponent(token)}`
  )
  
  // The API client already unwraps the response
  return {
    message: result.message || 'Email verified successfully',
    email: result.email
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(token: string): Promise<AuthResponseWithRefresh> {
  const result = await api.post<AuthResponseWithRefresh>(
    '/auth/refresh',
    { refresh_token: token },
    {
      requireAuth: false // No auth required for refresh endpoint
    }
  )
  return result
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<{ message: string }> {
  const result = await api.post<{ message: string }>('/auth/logout')
  return result
}

/**
 * Request password reset email
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const result = await api.post<{ message: string }>(
    '/auth/forgot-password',
    { email }
  )
  return result
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string, confirmPassword?: string): Promise<{ message: string; email: string }> {
  const result = await api.post<{ message: string; email: string }>(
    '/auth/reset-password',
    {
      token,
      new_password: newPassword,
      confirm_password: confirmPassword // Backend validates if provided
    }
  )
  return result
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<{ message: string; email: string }> {
  const result = await api.post<{ message: string; email: string }>(
    '/auth/resend-verification',
    { email }
  )
  return result
}