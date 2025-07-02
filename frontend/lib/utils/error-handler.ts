import toast from 'react-hot-toast';
import { debug, log, error as errorLog } from '@/lib/utils/debug';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  RATE_LIMIT = 'RATE_LIMIT',
  PAYMENT = 'PAYMENT',
  UNKNOWN = 'UNKNOWN'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Custom error class
export class AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  statusCode?: number;
  details?: any;
  retry?: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode?: number,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.statusCode = statusCode;
    this.details = details;
    this.retry = this.shouldRetry();
  }

  private shouldRetry(): boolean {
    return [ErrorType.NETWORK, ErrorType.RATE_LIMIT, ErrorType.SERVER].includes(this.type);
  }
}

// Error messages mapping
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'Network connection error. Please check your internet connection.',
  [ErrorType.AUTHENTICATION]: 'Authentication failed. Please log in again.',
  [ErrorType.VALIDATION]: 'Invalid input. Please check your data and try again.',
  [ErrorType.PERMISSION]: 'You do not have permission to perform this action.',
  [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorType.SERVER]: 'Server error. Please try again later.',
  [ErrorType.RATE_LIMIT]: 'Too many requests. Please slow down and try again.',
  [ErrorType.PAYMENT]: 'Payment processing error. Please check your payment details.',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

// User-friendly error messages
const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
  'Network request failed': 'Network error. Please check your connection and try again.',
  '401': 'Your session has expired. Please log in again.',
  '403': 'You don\'t have permission to access this resource.',
  '404': 'The requested item could not be found.',
  '429': 'Too many requests. Please wait a moment and try again.',
  '500': 'Server error. Our team has been notified. Please try again later.',
  '502': 'Server is temporarily unavailable. Please try again in a few moments.',
  '503': 'Service is currently under maintenance. Please try again later.'
};

// Parse error from response
export async function parseErrorFromResponse(response: Response): Promise<AppError> {
  debug('ERROR-HANDLER', 'parseErrorFromResponse called:', {
    status: response.status,
    statusText: response.statusText,
    url: response.url
  });

  let errorMessage = USER_FRIENDLY_MESSAGES[response.status.toString()] || ERROR_MESSAGES[ErrorType.UNKNOWN];
  let errorType = ErrorType.UNKNOWN;
  let details = null;

  debug('ERROR-HANDLER', 'Default error message:', errorMessage);

  // Determine error type based on status code
  switch (response.status) {
    case 401:
      errorType = ErrorType.AUTHENTICATION;
      break;
    case 403:
      errorType = ErrorType.PERMISSION;
      break;
    case 404:
      errorType = ErrorType.NOT_FOUND;
      break;
    case 422:
      errorType = ErrorType.VALIDATION;
      break;
    case 429:
      errorType = ErrorType.RATE_LIMIT;
      break;
    case 500:
    case 502:
    case 503:
      errorType = ErrorType.SERVER;
      break;
  }

  debug('ERROR-HANDLER', 'Error type determined:', errorType);

  // Try to parse error details from response body
  try {
    const responseText = await response.text();
    debug('ERROR-HANDLER', 'Response text:', responseText.substring(0, 500));
    
    if (!responseText) {
      debug('ERROR-HANDLER', 'No response text available');
      return new AppError(errorMessage, errorType, ErrorSeverity.MEDIUM, response.status, details);
    }
    
    const data = JSON.parse(responseText);
    debug('ERROR-HANDLER', 'Parsed JSON data:', {
      hasDetail: !!data.detail,
      hasError: !!data.error,
      hasMessage: !!data.message,
      dataKeys: Object.keys(data)
    });
    
    // FastAPI HTTPException format (most common)
    if (data.detail) {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
        debug('ERROR-HANDLER', 'Using detail string:', errorMessage);
      } else if (Array.isArray(data.detail)) {
        // Validation errors - format array into readable message
        errorMessage = data.detail
          .map((err: any) => err.msg || err.message || err.detail)
          .join(', ');
        details = data.detail;
        debug('ERROR-HANDLER', 'Using detail array:', errorMessage);
      } else if (typeof data.detail === 'object' && data.detail.msg) {
        errorMessage = data.detail.msg;
        debug('ERROR-HANDLER', 'Using detail.msg:', errorMessage);
      }
    }
    // Standard error format with error object
    else if (data.error) {
      errorMessage = data.error.message || data.error || errorMessage;
      details = data.error.details || data.details;
      debug('ERROR-HANDLER', 'Using error format:', errorMessage);
    }
    // Simple message format (rate limit, etc.)
    else if (data.message) {
      errorMessage = data.message;
      debug('ERROR-HANDLER', 'Using message format:', errorMessage);
    }
  } catch (parseError) {
    // If parsing fails, use default error message
    errorLog('ERROR-HANDLER', 'Failed to parse response:', parseError);
  }

  debug('ERROR-HANDLER', 'Final error being returned:', {
    message: errorMessage,
    type: errorType,
    status: response.status
  });

  return new AppError(errorMessage, errorType, ErrorSeverity.MEDIUM, response.status, details);
}

// Global error handler
export function handleError(error: unknown, showToast: boolean = true): AppError {
  debug('ERROR-HANDLER', 'handleError called with:', {
    errorType: error?.constructor?.name,
    isAppError: error instanceof AppError,
    isError: error instanceof Error,
    showToast
  });

  let appError: AppError;

  if (error instanceof AppError) {
    debug('ERROR-HANDLER', 'Error is already AppError:', {
      message: error.message,
      type: error.type,
      statusCode: error.statusCode
    });
    appError = error;
  } else if (error instanceof Error) {
    // Check for specific error messages
    const errorMessage = error.message.toLowerCase();
    let errorType = ErrorType.UNKNOWN;

    debug('ERROR-HANDLER', 'Processing Error instance:', {
      originalMessage: error.message,
      lowercaseMessage: errorMessage
    });

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      errorType = ErrorType.NETWORK;
      debug('ERROR-HANDLER', 'Detected network error');
    } else if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
      errorType = ErrorType.AUTHENTICATION;
      debug('ERROR-HANDLER', 'Detected auth error');
    } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      errorType = ErrorType.VALIDATION;
      debug('ERROR-HANDLER', 'Detected validation error');
    }

    const friendlyMessage = USER_FRIENDLY_MESSAGES[error.message] || error.message;
    debug('ERROR-HANDLER', 'Creating AppError:', {
      friendlyMessage,
      errorType
    });

    appError = new AppError(
      friendlyMessage,
      errorType,
      ErrorSeverity.MEDIUM
    );
  } else {
    debug('ERROR-HANDLER', 'Unknown error type:', error);
    appError = new AppError(
      'An unexpected error occurred',
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH
    );
  }

  // Log error
  errorLog('ERROR-HANDLER', 'Final AppError:', {
    message: appError.message,
    type: appError.type,
    severity: appError.severity,
    statusCode: appError.statusCode,
    details: appError.details
  });

  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(appError);
  }

  // Show toast notification
  if (showToast) {
    debug('ERROR-HANDLER', 'Showing error toast');
    showErrorToast(appError);
  }

  return appError;
}

// Show error toast with appropriate styling
export function showErrorToast(error: AppError) {
  const icon = getErrorIcon(error.type);
  const duration = error.severity === ErrorSeverity.CRITICAL ? 10000 : 5000;

  toast.error(error.message, {
    duration,
    icon,
    style: {
      background: getErrorBackgroundColor(error.severity),
      color: '#fff',
    },
  });
}

// Get error icon based on type
function getErrorIcon(type: ErrorType): string {
  const icons: Record<ErrorType, string> = {
    [ErrorType.NETWORK]: '🌐',
    [ErrorType.AUTHENTICATION]: '🔐',
    [ErrorType.VALIDATION]: '⚠️',
    [ErrorType.PERMISSION]: '🚫',
    [ErrorType.NOT_FOUND]: '🔍',
    [ErrorType.SERVER]: '🖥️',
    [ErrorType.RATE_LIMIT]: '⏱️',
    [ErrorType.PAYMENT]: '💳',
    [ErrorType.UNKNOWN]: '❌'
  };
  return icons[type] || '❌';
}

// Get background color based on severity
function getErrorBackgroundColor(severity: ErrorSeverity): string {
  const colors: Record<ErrorSeverity, string> = {
    [ErrorSeverity.LOW]: '#FCA5A5',
    [ErrorSeverity.MEDIUM]: '#F87171',
    [ErrorSeverity.HIGH]: '#EF4444',
    [ErrorSeverity.CRITICAL]: '#DC2626'
  };
  return colors[severity] || '#EF4444';
}

// Retry mechanism
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain error types
      if (error instanceof AppError && !error.retry) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

// Network status checker
export function isOnline(): boolean {
  return navigator.onLine;
}

// Check if error is recoverable
export function isRecoverableError(error: AppError): boolean {
  return error.retry || error.type === ErrorType.NETWORK;
}

// Format validation errors
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}