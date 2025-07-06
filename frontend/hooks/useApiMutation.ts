'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StandardResponse } from '@/lib/types/api';
import { handleError, AppError } from '@/lib/utils/error-handler';
import { ToastService } from '@/lib/toast/ToastService';

interface UseApiMutationOptions<TData, TVariables> {
  onSuccess?: (response: StandardResponse<TData>, variables: TVariables) => void;
  onError?: (error: AppError, variables: TVariables) => void;
  invalidateQueries?: string[][];
  showToast?: boolean;
}

/**
 * Drop-in replacement for useApiCall mutations with React Query
 * Maintains the same interface while adding query invalidation
 */
export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<StandardResponse<TData>>,
  options: UseApiMutationOptions<TData, TVariables> = {}
) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    invalidateQueries = [],
    showToast = true,
  } = options;

  const mutation = useMutation<StandardResponse<TData>, AppError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      try {
        const response = await mutationFn(variables);
        
        // Show success toast if enabled and message exists
        if (showToast && response.message) {
          ToastService.success(response.message, `mutation-${Date.now()}`);
        }
        
        return response;
      } catch (error: any) {
        const appError = handleError(error, false); // Prevent auto-toast, handle manually
        if (showToast) {
          ToastService.error(appError.message, `mutation-error-${Date.now()}`);
        }
        throw appError;
      }
    },
    onSuccess: (response, variables) => {
      // Invalidate specified queries
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      // Call custom success handler
      if (onSuccess) {
        onSuccess(response, variables);
      }
    },
    onError: (error: AppError, variables) => {
      const appError = handleError(error, false); // Prevent auto-toast duplication
      
      // Call custom error handler
      if (onError) {
        onError(appError, variables);
      }
    },
    retry: 1,
  });

  // Execute function (same interface as useApiCall)
  const execute = async (
    apiCall: () => Promise<StandardResponse<TData>>,
    executeOptions?: {
      onSuccess?: (response: StandardResponse<TData>) => void;
      onError?: (error: AppError) => void;
    }
  ): Promise<StandardResponse<TData> | null> => {
    try {
      const response = await apiCall();
      
      // Invalidate queries
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      // Show success toast with operation ID to prevent duplicates
      if (showToast && response.message) {
        ToastService.success(response.message, `execute-${Date.now()}`);
      }
      
      // Call success handler
      if (executeOptions?.onSuccess) {
        executeOptions.onSuccess(response);
      }
      
      return response;
    } catch (error: any) {
      const appError = handleError(error, false); // Prevent auto-toast
      
      if (showToast) {
        ToastService.error(appError.message, `execute-error-${Date.now()}`);
      }
      
      // Call error handler
      if (executeOptions?.onError) {
        executeOptions.onError(appError);
      }
      
      return null;
    }
  };

  return {
    // Same interface as useApiCall
    loading: mutation.isPending,
    execute,
    
    // Additional React Query mutation features
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as AppError | null,
    data: mutation.data,
    reset: mutation.reset,
    
    // Raw mutation object for advanced usage
    mutation,
  };
}