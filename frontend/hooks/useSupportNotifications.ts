'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supportAPI } from '@/lib/api/support';
import { useEffect } from 'react';

/**
 * Hook for support ticket notifications using React Query.
 * Uses existing codebase patterns with shared cache and automatic invalidation.
 * Backend calculates everything using MongoDB aggregation (smart backend).
 */
export function useSupportNotifications() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  // Use existing useApiQuery pattern from codebase
  const { data, loading, error, refetch } = useApiQuery(
    ['support-notifications'],  // Simple key like other support queries
    () => supportAPI.getNotifications(),
    {
      ...getCacheConfig('SUPPORT_NOTIFICATIONS'), // Use existing cache config (REALTIME)
      enabled: isAuthenticated && !!user,
    }
  );

  // Smart polling with visibility detection - only poll when tab is active
  useEffect(() => {
    if (!isAuthenticated || !user || document.hidden) {
      return;
    }

    const interval = setInterval(() => {
      refetch();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, user, refetch]);

  // Listen for visibility change - refresh when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && user) {
        refetch(); // Immediate refresh when tab becomes active
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, user, refetch]);

  // Global refresh function using existing pattern
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['support-notifications'] });
  };

  return {
    unreadCount: data?.data?.count || 0,
    recentTickets: data?.data?.recent_tickets || [],
    lastChecked: new Date(), // For backward compatibility
    isLoading: loading,
    error,
    refresh
  };
}

export default useSupportNotifications;