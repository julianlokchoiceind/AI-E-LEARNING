'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StandardResponse } from '@/lib/types/api';
import { handleError, AppError } from '@/lib/utils/error-handler';
import { ToastService } from '@/lib/toast/ToastService';

interface UseApiMutationOptions<TData, TVariables> {
  onSuccess?: (response: StandardResponse<TData>, variables: TVariables) => void;
  onError?: (error: AppError, variables: TVariables) => void;
  invalidateQueries?: string[][] | ((variables: TVariables) => string[][]);
  showToast?: boolean;
  operationName?: string; // For toast deduplication
}

/**
 * Simplified useApiMutation hook for consistent mutations
 * 
 * FEATURES:
 * - React Query integration with automatic cache invalidation
 * - Automatic toast handling with operation ID deduplication
 * - Consistent error handling across the application
 * - Simple and predictable behavior
 * 
 * USAGE:
 * 
 * const { mutate } = useApiMutation(updateCourse, {
 *   operationName: 'update-course',
 *   invalidateQueries: [['courses'], ['course']]
 * });
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
    showToast = true, // Enable auto-toast by default (errors need to show)
    operationName = 'mutation',
  } = options;

  const mutation = useMutation<StandardResponse<TData>, AppError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      try {
        const response = await mutationFn(variables);


        // Success toast disabled globally - now controlled by DISABLE_SUCCESS flag
        if (showToast && response.message) {
          // Generate operation-based ID for deduplication
          const toastId = generateToastId(operationName, variables);
          ToastService.success(response.message, toastId); // Will be skipped by global flag
        }

        return response;
      } catch (error: any) {
        const appError = handleError(error, false); // Prevent auto-toast, handle manually
        if (showToast) {
          // Generate operation-based ID for deduplication
          const toastId = generateToastId(`${operationName}-error`, variables);
          ToastService.error(appError.message, toastId);
        }
        throw appError;
      }
    },
    
    onSuccess: (response, variables, context) => {
      // Invalidate specified queries FIRST
      if (invalidateQueries) {
        // Handle both array and function forms
        const queriesToInvalidate = typeof invalidateQueries === 'function' 
          ? invalidateQueries(variables) 
          : invalidateQueries;
          
        queriesToInvalidate.forEach(queryKey => {
          queryClient.invalidateQueries({ 
            queryKey,
            refetchType: 'all' // Force immediate refetch for ALL queries (including background components)
          });
        });
      }
      
      // Then call custom success handler (which may do additional invalidations)
      if (onSuccess) {
        onSuccess(response, variables);
      }
    },
    
    onError: (error: AppError, variables, context) => {
      const appError = handleError(error, false); // Prevent auto-toast duplication
      
      // Call custom error handler
      if (onError) {
        onError(appError, variables);
      }
    },
    
    retry: 1,
  });

  // Create a wrapper for mutate that preserves our hook's onSuccess/onError handlers
  const wrappedMutate = (
    variables: TVariables,
    options?: {
      onSuccess?: (data: StandardResponse<TData>, variables: TVariables) => void;
      onError?: (error: AppError, variables: TVariables) => void;
      onSettled?: (data: StandardResponse<TData> | undefined, error: AppError | null, variables: TVariables) => void;
    }
  ) => {
    mutation.mutate(variables, {
      onSuccess: (data, vars) => {
        // Call the caller's onSuccess if provided
        if (options?.onSuccess) {
          options.onSuccess(data, vars);
        }
      },
      onError: (error, vars) => {
        // Call the caller's onError if provided
        if (options?.onError) {
          options.onError(error as AppError, vars);
        }
      },
      onSettled: options?.onSettled,
    });
  };

  return {
    // React Query mutation interface
    mutate: wrappedMutate,
    mutateAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as AppError | null,
    data: mutation.data,
    reset: mutation.reset,
  };
}

/**
 * Generate operation-based toast ID for deduplication
 * @param operationName - The operation name (e.g., 'delete-course', 'update-profile')
 * @param variables - The mutation variables that may contain IDs
 * @returns A stable toast ID for the operation
 */
function generateToastId(operationName: string, variables?: any): string {
  // If variables contain an ID, append it for uniqueness per resource
  if (variables) {
    // Common ID fields to check
    const idFields = ['id', '_id', 'courseId', 'userId', 'lessonId', 'chapterId'];
    
    for (const field of idFields) {
      if (variables[field]) {
        return `${operationName}-${variables[field]}`;
      }
    }
  }
  
  // Default to just operation name
  return operationName;
}