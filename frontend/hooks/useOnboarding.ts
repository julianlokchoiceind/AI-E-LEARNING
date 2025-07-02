/**
 * Hook for managing onboarding state and flow
 * Following PRD specifications and memory guidelines
 */

import { useState, useEffect } from 'react';
import { getOnboardingStatus, OnboardingStatus } from '@/lib/api/onboarding';
import { useAuth } from '@/hooks/useAuth';

export interface UseOnboardingReturn {
  status: OnboardingStatus | null;
  loading: boolean;
  error: string | null;
  shouldShowOnboarding: boolean;
  refetchStatus: () => Promise<void>;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOnboardingStatus = async () => {
    if (!user || authLoading) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getOnboardingStatus();
      
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      const onboardingStatus = response.data;
      setStatus(onboardingStatus);
    } catch (err: any) {
      console.error('Failed to fetch onboarding status:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardingStatus();
  }, [user, authLoading]);

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
    loading,
    error,
    shouldShowOnboarding,
    refetchStatus: fetchOnboardingStatus
  };
};