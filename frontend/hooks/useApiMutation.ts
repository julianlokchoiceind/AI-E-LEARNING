'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StandardResponse } from '@/lib/types/api';
import { handleError, AppError } from '@/lib/utils/error-handler';
import { ToastService } from '@/lib/toast/ToastService';

interface OptimisticConfig<TVariables> {
  onMutate?: (variables: TVariables) => Promise<any> | any;
  onError?: (error: AppError, variables: TVariables, context: any) => void;
  onSettled?: (data: any, error: AppError | null, variables: TVariables, context: any) => void;
}

interface UseApiMutationOptions<TData, TVariables> {
  onSuccess?: (response: StandardResponse<TData>, variables: TVariables) => void;
  onError?: (error: AppError, variables: TVariables) => void;
  invalidateQueries?: string[][] | ((variables: TVariables) => string[][]);
  showToast?: boolean;
  operationName?: string; // For toast deduplication
  optimistic?: OptimisticConfig<TVariables>; // NEW: Optional optimistic updates
}

/**
 * Enhanced useApiMutation with optional optimistic updates
 * 
 * FEATURES:
 * - Drop-in replacement for useApiCall mutations with React Query
 * - Maintains backward compatibility with existing hooks
 * - Optional optimistic updates with onMutate/onError/onSettled
 * - Automatic toast handling with operation ID deduplication
 * - Query invalidation support
 * 
 * USAGE:
 * 
 * // Standard usage (backward compatible):
 * const { mutate } = useApiMutation(updateCourse, {
 *   operationName: 'update-course',
 *   invalidateQueries: [['courses']]
 * });
 * 
 * // With optimistic updates:
 * const { mutate } = useApiMutation(deleteCourse, {
 *   operationName: 'delete-course',
 *   optimistic: {
 *     onMutate: async (courseId) => {
 *       const previousData = queryClient.getQueryData(['courses']);
 *       queryClient.setQueryData(['courses'], (old) => 
 *         old.filter(course => course.id !== courseId)
 *       );
 *       return { previousData };
 *     },
 *     onError: (error, variables, context) => {
 *       queryClient.setQueryData(['courses'], context.previousData);
 *     },
 *     onSettled: () => {
 *       queryClient.invalidateQueries(['courses']);
 *     }
 *   }
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
    showToast = true,
    operationName = 'mutation',
    optimistic,
  } = options;

  // DECISION: Use optimistic path if optimistic config provided, otherwise standard path
  const mutation = useMutation<StandardResponse<TData>, AppError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      console.log('🔧 [MUTATION DEBUG] mutationFn called:', {
        operationName,
        variables,
        mutationFnName: mutationFn.name
      });
      
      try {
        console.log('🔧 [MUTATION DEBUG] Calling actual mutation function...');
        const response = await mutationFn(variables);
        
        console.log('🔧 [MUTATION DEBUG] Mutation success:', {
          operationName,
          response,
          hasMessage: !!response?.message
        });
        
        // Show success toast if enabled and message exists
        if (showToast && response.message) {
          // Generate operation-based ID for deduplication
          const toastId = generateToastId(operationName, variables);
          ToastService.success(response.message, toastId);
        }
        
        return response;
      } catch (error: any) {
        console.error('🔧 [MUTATION DEBUG] Mutation failed:', {
          operationName,
          error,
          errorMessage: error?.message,
          variables
        });
        
        const appError = handleError(error, false); // Prevent auto-toast, handle manually
        if (showToast) {
          // Generate operation-based ID for deduplication
          const toastId = generateToastId(`${operationName}-error`, variables);
          ToastService.error(appError.message, toastId);
        }
        throw appError;
      }
    },
    
    // OPTIMISTIC: Add onMutate if optimistic config provided
    onMutate: optimistic?.onMutate,
    
    onSuccess: (response, variables, context) => {
      // Invalidate specified queries FIRST
      if (invalidateQueries) {
        // Handle both array and function forms
        const queriesToInvalidate = typeof invalidateQueries === 'function' 
          ? invalidateQueries(variables) 
          : invalidateQueries;
          
        queriesToInvalidate.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      // Then call custom success handler (which may do additional invalidations)
      if (onSuccess) {
        onSuccess(response, variables);
      }
    },
    
    onError: (error: AppError, variables, context) => {
      const appError = handleError(error, false); // Prevent auto-toast duplication
      
      // OPTIMISTIC: Call optimistic error handler first (for rollback)
      if (optimistic?.onError) {
        optimistic.onError(appError, variables, context);
      }
      
      // Then call custom error handler
      if (onError) {
        onError(appError, variables);
      }
    },
    
    // OPTIMISTIC: Add onSettled if optimistic config provided
    onSettled: optimistic?.onSettled,
    
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
        const toastId = `${operationName}-execute`;
        ToastService.success(response.message, toastId);
      }
      
      // Call success handler
      if (executeOptions?.onSuccess) {
        executeOptions.onSuccess(response);
      }
      
      return response;
    } catch (error: any) {
      const appError = handleError(error, false); // Prevent auto-toast
      
      if (showToast) {
        const toastId = `${operationName}-execute-error`;
        ToastService.error(appError.message, toastId);
      }
      
      // Call error handler
      if (executeOptions?.onError) {
        executeOptions.onError(appError);
      }
      
      return null;
    }
  };

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
        // First call the caller's onSuccess if provided
        if (options?.onSuccess) {
          options.onSuccess(data, vars);
        }
      },
      onError: (error, vars) => {
        // First call the caller's onError if provided
        if (options?.onError) {
          options.onError(error as AppError, vars);
        }
      },
      onSettled: options?.onSettled,
    });
  };

  return {
    // Same interface as useApiCall
    loading: mutation.isPending,
    execute,
    
    // Additional React Query mutation features
    mutate: wrappedMutate,
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