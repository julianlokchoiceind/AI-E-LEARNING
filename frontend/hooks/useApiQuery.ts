'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { StandardResponse } from '@/lib/types/api';
import { handleError, AppError } from '@/lib/utils/error-handler';
import { useCallback } from 'react';

interface UseApiQueryOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  showToast?: boolean;
  keepPreviousData?: boolean;
}

interface UseApiQueryResult<T> {
  data: StandardResponse<T> | null;
  loading: boolean;
  isInitialLoading: boolean;
  isRefetching: boolean;
  error: AppError | null;
  execute: () => Promise<StandardResponse<T> | undefined>;
  isStale: boolean;
  isSuccess: boolean;
  refetch: any;
  query: any;
}

/**
 * Drop-in replacement for useApiCall with React Query
 * Maintains the same interface while adding caching benefits
 */
export function useApiQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<StandardResponse<T>>,
  options: UseApiQueryOptions<T> = {}
): UseApiQueryResult<T> {
  const {
    onSuccess,
    onError,
    enabled = true,
    staleTime, // No default - force explicit cache tier selection
    gcTime, // No default - force explicit cache tier selection
    showToast = true,
    keepPreviousData = false,
  } = options;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await queryFn();
        
        // Handle success callback
        if (onSuccess && response.data) {
          onSuccess(response.data);
        }
        
        return response;
      } catch (error: any) {
        const appError = handleError(error, showToast);
        
        // Handle error callback
        if (onError) {
          onError(appError);
        }
        
        throw appError;
      }
    },
    enabled,
    staleTime,
    gcTime,
    retry: 1,
    refetchOnWindowFocus: true, // Enable smart window focus refetch for natural cache sync
    refetchOnReconnect: false, // Keep disabled to prevent excessive network calls
    refetchInterval: false, // Keep disabled - use cache invalidation instead
    keepPreviousData,
  } as UseQueryOptions);

  // Manual execute function (same as useApiCall)
  const execute = useCallback(async (): Promise<StandardResponse<T> | undefined> => {
    try {
      const result = await query.refetch();
      return result.data as StandardResponse<T> | undefined;
    } catch (error: any) {
      const appError = handleError(error, showToast);
      if (onError) {
        onError(appError);
      }
      throw appError;
    }
  }, [query.refetch, onError, showToast]);

  return {
    // Same interface as useApiCall
    data: query.data as StandardResponse<T> | null,
    loading: query.isLoading, // Only initial load - fixes double flash
    isInitialLoading: query.isLoading && !query.data, // First load with no data
    isRefetching: query.isFetching && !query.isLoading, // Background refetch
    error: query.error as AppError | null,
    execute,
    
    // Additional React Query features
    isStale: query.isStale,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
    
    // Raw query object for advanced usage
    query,
  };
}