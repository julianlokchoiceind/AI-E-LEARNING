'use client';

import toast from 'react-hot-toast';

/**
 * Centralized Toast Management Service
 * 
 * Implements official react-hot-toast patterns for deduplication
 * Prevents 3-4 duplicate toasts per action with ID-based system
 * Maintains "Something went wrong" fallback pattern
 */
export class ToastService {
  private static activeToasts = new Map<string, string>();
  
  /**
   * Success toast with automatic deduplication
   * @param message - Success message (backend preferred)
   * @param operationId - Unique ID to prevent duplicates
   */
  static success(message: string | null | undefined, operationId?: string): string {
    const finalMessage = this.getFinalMessage(message);
    const toastId = operationId || 'default-success';
    
    // Dismiss existing toast with same ID
    if (this.activeToasts.has(toastId)) {
      toast.dismiss(this.activeToasts.get(toastId));
    }
    
    const newToastId = toast.success(finalMessage, {
      id: toastId,
      duration: 5000,
      style: {
        background: '#10b981',
        color: '#fff',
      },
    });
    
    this.activeToasts.set(toastId, newToastId);
    
    // Clean up after duration
    setTimeout(() => {
      this.activeToasts.delete(toastId);
    }, 5000);
    
    return newToastId;
  }
  
  /**
   * Error toast with automatic deduplication
   * @param message - Error message (backend preferred)
   * @param operationId - Unique ID to prevent duplicates
   */
  static error(message: string | null | undefined, operationId?: string): string {
    const finalMessage = this.getFinalMessage(message);
    const toastId = operationId || 'default-error';
    
    // Dismiss existing toast with same ID
    if (this.activeToasts.has(toastId)) {
      toast.dismiss(this.activeToasts.get(toastId));
    }
    
    const newToastId = toast.error(finalMessage, {
      id: toastId,
      duration: 5000,
      style: {
        background: '#ef4444',
        color: '#fff',
      },
    });
    
    this.activeToasts.set(toastId, newToastId);
    
    // Clean up after duration
    setTimeout(() => {
      this.activeToasts.delete(toastId);
    }, 5000);
    
    return newToastId;
  }
  
  /**
   * Loading toast with automatic deduplication
   * @param message - Loading message
   * @param operationId - Unique ID to prevent duplicates
   */
  static loading(message: string | null | undefined, operationId?: string): string {
    const finalMessage = this.getFinalMessage(message) || 'Loading...';
    const toastId = operationId || 'default-loading';
    
    // Dismiss existing toast with same ID
    if (this.activeToasts.has(toastId)) {
      toast.dismiss(this.activeToasts.get(toastId));
    }
    
    const newToastId = toast.loading(finalMessage, {
      id: toastId,
      style: {
        background: '#3b82f6',
        color: '#fff',
      },
    });
    
    this.activeToasts.set(toastId, newToastId);
    
    return newToastId;
  }
  
  /**
   * Update existing toast (for loading → success/error transitions)
   */
  static update(toastId: string, message: string, type: 'success' | 'error'): string {
    const finalMessage = this.getFinalMessage(message);
    
    if (type === 'success') {
      return toast.success(finalMessage, { id: toastId });
    } else {
      return toast.error(finalMessage, { id: toastId });
    }
  }
  
  /**
   * Handle StandardResponse objects directly
   */
  static fromResponse(response: any, operationId?: string): string {
    if (response?.success) {
      return this.success(response.message, operationId);
    } else {
      return this.error(response?.message || response?.detail, operationId);
    }
  }
  
  /**
   * Handle error objects directly
   */
  static fromError(error: any, operationId?: string): string {
    const message = error?.message || error?.response?.data?.message || error?.response?.data?.detail;
    return this.error(message, operationId);
  }
  
  /**
   * Dismiss specific toast
   */
  static dismiss(toastId?: string): void {
    if (toastId) {
      toast.dismiss(toastId);
      this.activeToasts.delete(toastId);
    } else {
      toast.dismiss();
      this.activeToasts.clear();
    }
  }
  
  /**
   * Remove all toasts instantly
   */
  static clear(): void {
    toast.remove();
    this.activeToasts.clear();
  }
  
  /**
   * Promise-based toast for loading states
   */
  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    operationId?: string
  ): Promise<T> {
    return toast.promise(promise, messages, {
      id: operationId,
      style: {
        minWidth: '250px',
      },
      success: {
        duration: 5000,
      },
      error: {
        duration: 5000,
      },
    });
  }
  
  /**
   * Ensure message is never null/undefined - always fallback to "Something went wrong"
   * This preserves the existing backend message priority + fallback pattern
   */
  private static getFinalMessage(message: string | null | undefined): string {
    if (message && typeof message === 'string' && message.trim()) {
      return message.trim();
    }
    return 'Something went wrong';
  }
}

// Export convenience functions for easier migration
export const showSuccess = ToastService.success;
export const showError = ToastService.error;
export const showLoading = ToastService.loading;
export const dismissToast = ToastService.dismiss;
export const clearToasts = ToastService.clear;