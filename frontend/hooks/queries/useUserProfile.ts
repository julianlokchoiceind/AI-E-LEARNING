'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { usersApi } from '@/lib/api/users';

interface ProfileUpdateData {
  name: string;
  profile: {
    bio: string;
    location: string;
    website: string;
    github: string;
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
      staleTime: 5 * 60 * 1000, // 5 minutes - profile data doesn't change frequently
      gcTime: 10 * 60 * 1000, // 10 minutes cache
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

  return {
    profile: profileQuery.data?.data,
    loading: profileQuery.loading,
    error: profileQuery.error,
    updateProfile: updateMutation.mutate,
    updating: updateMutation.loading,
    refetch: profileQuery.execute,
  };
}