/**
 * Authentication API client functions
 */

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

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Registration failed')
  }

  return response.json()
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

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Login failed')
  }

  return response.json()
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<{ message: string; email: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Email verification failed')
  }

  return response.json()
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

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Token refresh failed')
  }

  return response.json()
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Logout failed')
  }

  return response.json()
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

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to send reset email')
  }

  return response.json()
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

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to reset password')
  }

  return response.json()
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

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to resend verification email')
  }

  return response.json()
}