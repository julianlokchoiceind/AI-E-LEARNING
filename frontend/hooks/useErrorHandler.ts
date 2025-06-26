'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleError, AppError, ErrorType, retryOperation, isOnline } from '@/lib/utils/error-handler';
import toast from 'react-hot-toast';

interface UseErrorHandlerOptions {
  onError?: (error: AppError) => void;
  redirectOnAuth?: boolean;
  showToast?: boolean;
  retryCount?: number;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    onError,
    redirectOnAuth = true,
    showToast = true,
    retryCount = 3
  } = options;

  const router = useRouter();
  const [error, setError] = useState<AppError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Handle error with retry logic
  const handleErrorWithRetry = useCallback(async <T,>(
    operation: () => Promise<T>,
    customErrorHandler?: (error: AppError) => void
  ): Promise<T | null> => {
    setError(null);
    setIsRetrying(false);

    try {
      return await retryOperation(operation, retryCount);
    } catch (err) {
      const appError = handleError(err, showToast);
      setError(appError);

      // Handle authentication errors
      if (appError.type === ErrorType.AUTHENTICATION && redirectOnAuth) {
        toast.error('Please log in to continue');
        router.push('/login');
      }

      // Call custom error handler
      if (customErrorHandler) {
        customErrorHandler(appError);
      } else if (onError) {
        onError(appError);
      }

      return null;
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, showToast, redirectOnAuth, router, onError]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Retry last failed operation
  const retry = useCallback(async <T,>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    if (!error) return null;

    setIsRetrying(true);
    return handleErrorWithRetry(operation);
  }, [error, handleErrorWithRetry]);

  // Check network status
  const [isOnlineStatus, setIsOnlineStatus] = useState(isOnline());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineStatus(true);
      toast.success('Back online!');
    };

    const handleOffline = () => {
      setIsOnlineStatus(false);
      toast.error('No internet connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    error,
    isRetrying,
    isOnline: isOnlineStatus,
    handleError: handleErrorWithRetry,
    clearError,
    retry
  };
}

// Hook for API calls with error handling
export function useApiCall<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();

  const execute = useCallback(async (
    apiCall: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: AppError) => void;
      showSuccessToast?: string;
    }
  ): Promise<T | null> => {
    setLoading(true);
    clearError();

    const result = await handleError(
      async () => {
        const response = await apiCall();
        setData(response);
        
        if (options?.showSuccessToast) {
          toast.success(options.showSuccessToast);
        }
        
        options?.onSuccess?.(response);
        return response;
      },
      options?.onError
    );

    setLoading(false);
    return result;
  }, [handleError, clearError]);

  return {
    data,
    loading,
    error,
    execute,
    clearError
  };
}