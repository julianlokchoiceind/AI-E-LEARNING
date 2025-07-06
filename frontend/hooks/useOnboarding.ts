/**
 * Hook for managing onboarding state and flow
 * Migrated to React Query for better caching and state management
 */

import { useOnboardingStatusQuery } from '@/hooks/queries/useStudent';
import { useAuth } from '@/hooks/useAuth';

export interface UseOnboardingReturn {
  status: any | null;
  loading: boolean;
  error: string | null;
  shouldShowOnboarding: boolean;
  refetchStatus: () => Promise<void>;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const { user, loading: authLoading } = useAuth();
  
  // React Query hook - automatic caching and state management
  const { 
    data: onboardingResponse, 
    loading, 
    execute 
  } = useOnboardingStatusQuery(!!user && !authLoading);

  // Wrapper to match expected signature
  const refetchStatus = async (): Promise<void> => {
    await execute();
  };

  // Extract status from React Query response
  const status = onboardingResponse?.success ? onboardingResponse.data : null;
  const error = onboardingResponse && !onboardingResponse.success ? 
    (onboardingResponse.message || 'Something went wrong') : null;

  // Determine if onboarding should be shown
  const shouldShowOnboarding = Boolean(
    user && 
    status && 
    !status.is_completed && 
    !status.skipped && 
    user.role === 'student' // Only show for students
  );

  return {
    status,
    loading: authLoading || loading,
    error,
    shouldShowOnboarding,
    refetchStatus
  };
};