'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { usersApi } from '@/lib/api/users';

interface ProfileUpdateData {
  name: string;
  profile: {
    bio: string;
    location: string;
    phone: string;
    website: string;
    github: string;
    facebook: string;
    linkedin: string;
  };
}

/**
 * Hook for fetching user profile data
 * Optimized for profile page
 */
export function useUserProfileQuery(enabled: boolean = true) {
  return useApiQuery(
    ['user-profile'],
    () => usersApi.getProfile(),
    {
      enabled,
      showToast: false, // Disable toasts for dashboard profile page - use inline messages instead
      ...getCacheConfig('USER_PROFILE') // User profile data - moderate freshness
    }
  );
}

/**
 * Mutation for updating user profile
 */
export function useUpdateUserProfile() {
  return useApiMutation(
    (profileData: ProfileUpdateData) => usersApi.updateProfile(profileData),
    {
      operationName: 'update-user-profile',
      invalidateQueries: [
        ['user-profile'], // Refresh profile data
        ['user'], // Refresh auth user data if needed
      ],
      showToast: false, // Disable toasts for dashboard profile updates - use inline feedback
    }
  );
}

/**
 * Mutation for uploading user avatar
 */
export function useUploadAvatar() {
  return useApiMutation(
    (file: File) => usersApi.uploadAvatar(file),
    {
      operationName: 'upload-avatar',
      invalidateQueries: [
        ['user-profile'], // Refresh profile data
        ['user'], // Refresh auth user data
      ],
      showToast: false, // Disable automatic toast - component handles feedback
    }
  );
}

/**
 * Mutation for deleting user avatar
 */
export function useDeleteAvatar() {
  return useApiMutation(
    () => usersApi.deleteAvatar(),
    {
      operationName: 'delete-avatar',
      invalidateQueries: [
        ['user-profile'], // Refresh profile data
        ['user'], // Refresh auth user data
      ],
      showToast: false, // Disable automatic toast - component handles feedback
    }
  );
}

/**
 * Hook for user profile management
 * Combines profile data and update functionality
 */
export function useUserProfileManagement(enabled: boolean = true) {
  const profileQuery = useUserProfileQuery(enabled);
  const updateMutation = useUpdateUserProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();

  return {
    profile: profileQuery.data?.data,
    loading: profileQuery.loading,
    error: profileQuery.error,
    updateProfile: updateMutation.mutate,
    updating: updateMutation.loading,
    uploadAvatar: uploadAvatarMutation.mutateAsync, // Use async version for await support
    uploadingAvatar: uploadAvatarMutation.loading,
    deleteAvatar: deleteAvatarMutation.mutateAsync, // Use async version for await support
    deletingAvatar: deleteAvatarMutation.loading,
    refetch: profileQuery.execute,
  };
}