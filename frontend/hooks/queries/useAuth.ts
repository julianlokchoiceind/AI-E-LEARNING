'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { 
  login,
  register,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  updateProfile,
  changePassword,
  refreshToken,
  getUserProfile,
  getUserPreferences as getPreferencesAPI,
  updateUserPreferences,
  logoutUser,
  checkSession
} from '@/lib/api/auth';

// Types for auth queries
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface PasswordReset {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileUpdate {
  name?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  preferences?: {
    language?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  };
}

interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * USER PROFILE - Current user information
 * Critical: User context throughout app
 */
export function useUserProfileQuery(enabled: boolean = true) {
  return useApiQuery(
    ['user-profile'],
    () => getProfile(),
    {
      enabled,
      staleTime: 5 * 60 * 1000, // 5 minutes - profile data
      gcTime: 30 * 60 * 1000, // 30 minutes cache
    }
  );
}

/**
 * LOGIN - User authentication
 * Critical: Platform access
 */
export function useLogin() {
  return useApiMutation(
    ({ email, password }: LoginCredentials) => login({ email, password }),
    {
      invalidateQueries: [
        ['user-profile'], // Refresh user data after login
      ],
      operationName: 'login', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * REGISTER - User account creation
 * Critical: User acquisition
 */
export function useRegister() {
  return useApiMutation(
    ({ name, email, password }: RegisterData) => 
      register({ name, email, password }),
    {
      // No cache invalidation needed for registration
      operationName: 'register', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * FORGOT PASSWORD - Password reset request
 * Medium-impact: Account recovery
 */
export function useForgotPassword() {
  return useApiMutation(
    (email: string) => forgotPassword(email),
    {
      // No cache invalidation needed
      operationName: 'forgot-password', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * RESET PASSWORD - Complete password reset
 * Medium-impact: Account recovery completion
 */
export function useResetPassword() {
  return useApiMutation(
    ({ token, newPassword, confirmPassword }: PasswordReset) => 
      resetPassword(token, newPassword, confirmPassword),
    {
      // No cache invalidation needed
      operationName: 'reset-password', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * VERIFY EMAIL - Email verification
 * Medium-impact: Account activation
 */
export function useVerifyEmail() {
  return useApiMutation(
    (token: string) => verifyEmail(token),
    {
      invalidateQueries: [
        ['user-profile'], // Refresh user verification status
      ],
      operationName: 'verify-email', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * RESEND VERIFICATION - Resend verification email
 * Low-impact: Verification support
 */
export function useResendVerification() {
  return useApiMutation(
    (email: string) => resendVerification(email),
    {
      // No cache invalidation needed
      operationName: 'resend-verification', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * UPDATE PROFILE - User profile updates
 * High-impact: User personalization
 */
export function useUpdateProfile() {
  return useApiMutation(
    (profileData: ProfileUpdate) => updateProfile(profileData),
    {
      invalidateQueries: [
        ['user-profile'], // Refresh updated profile
      ],
      operationName: 'update-profile', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * CHANGE PASSWORD - Password update
 * Medium-impact: Account security
 */
export function useChangePassword() {
  return useApiMutation(
    ({ currentPassword, newPassword, confirmPassword }: PasswordChange) => 
      changePassword({ current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword }),
    {
      // No cache invalidation needed for password change
      operationName: 'change-password', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * REFRESH TOKEN - Session renewal
 * Critical: Seamless authentication
 */
export function useRefreshToken() {
  return useApiMutation(
    () => refreshToken(''),
    {
      invalidateQueries: [
        ['user-profile'], // Refresh user session
      ],
      // Don't show toast for token refresh (background operation)
      showToast: false,
    }
  );
}

/**
 * USER PREFERENCES - User settings and preferences
 * Medium-impact: User experience customization
 */
export function useUserPreferencesQuery() {
  return useApiQuery(
    ['user-preferences'],
    () => getUserPreferences(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - preferences stable
      gcTime: 60 * 60 * 1000, // 1 hour cache
    }
  );
}

/**
 * UPDATE PREFERENCES - User preference updates
 * Medium-impact: User experience customization
 */
export function useUpdatePreferences() {
  return useApiMutation(
    (preferences: any) => updatePreferences(preferences),
    {
      invalidateQueries: [
        ['user-preferences'], // Refresh preferences
        ['user-profile'], // May affect profile display
      ],
      operationName: 'update-preferences', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * LOGOUT - User session termination
 * Critical: Security and session management
 */
export function useLogout() {
  return useApiMutation(
    () => logout(),
    {
      invalidateQueries: [
        ['user-profile'], // Clear user data
        ['my-courses'], // Clear student data
        ['student-dashboard'], // Clear dashboard
      ],
      // Clear all React Query cache on logout
      onSuccess: () => {
        // Cache clearing will be handled by invalidateQueries
      },
      operationName: 'logout', // Unique operation ID for toast deduplication
    }
  );
}

/**
 * SESSION STATUS - Check authentication status
 * Critical: Auth state management
 */
export function useSessionStatusQuery() {
  return useApiQuery(
    ['session-status'],
    () => checkSessionStatus(),
    {
      staleTime: 1 * 60 * 1000, // 1 minute - check session frequently
      gcTime: 5 * 60 * 1000, // 5 minutes cache
    }
  );
}

// Helper functions use imported API functions directly
const getProfile = getUserProfile;
const getUserPreferences = getPreferencesAPI;
const updatePreferences = updateUserPreferences;
const logout = logoutUser;
const checkSessionStatus = checkSession;