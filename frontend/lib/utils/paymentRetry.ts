import { ToastService } from '@/lib/toast/ToastService';

export interface PaymentRetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface PaymentError {
  code: string;
  message: string;
  retryable: boolean;
  suggestedAction?: string;
}

export class PaymentRetryHandler {
  private options: PaymentRetryOptions;
  private retryCount: number = 0;

  constructor(options: Partial<PaymentRetryOptions> = {}) {
    this.options = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      ...options,
    };
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    errorHandler?: (error: PaymentError, attempt: number) => Promise<boolean>
  ): Promise<T> {
    this.retryCount = 0;

    while (this.retryCount <= this.options.maxRetries) {
      try {
        const result = await operation();
        this.retryCount = 0; // Reset on success
        return result;
      } catch (error: any) {
        const paymentError = this.parseError(error);
        
        // Check if error is retryable
        if (!paymentError.retryable || this.retryCount >= this.options.maxRetries) {
          throw paymentError;
        }

        // Call custom error handler if provided
        if (errorHandler) {
          const shouldRetry = await errorHandler(paymentError, this.retryCount + 1);
          if (!shouldRetry) {
            throw paymentError;
          }
        }

        this.retryCount++;
        
        // Show retry toast
        ToastService.loading(
          `Payment attempt ${this.retryCount}/${this.options.maxRetries + 1} failed. Retrying...`
        );

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.options.baseDelay * Math.pow(this.options.backoffMultiplier, this.retryCount - 1),
          this.options.maxDelay
        );

        await this.sleep(delay);
      }
    }

    throw new Error('Something went wrong');
  }

  private parseError(error: any): PaymentError {
    // Parse different types of payment errors
    if (error.type === 'StripeError') {
      return this.parseStripeError(error);
    }

    if (error.response?.data) {
      return this.parseAPIError(error.response.data);
    }

    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      retryable: false,
    };
  }

  private parseStripeError(error: any): PaymentError {
    const retryableStripeErrors = [
      'processing_error',
      'rate_limit',
      'api_connection_error',
      'api_error',
    ];

    const nonRetryableErrors = [
      'card_declined',
      'insufficient_funds',
      'expired_card',
      'incorrect_cvc',
      'invalid_number',
      'authentication_required',
    ];

    let suggestedAction = '';
    const code = error.code || error.decline_code;

    switch (code) {
      case 'card_declined':
        suggestedAction = 'Try a different payment method or contact your bank';
        break;
      case 'insufficient_funds':
        suggestedAction = 'Add funds to your account or use a different card';
        break;
      case 'expired_card':
        suggestedAction = 'Use a valid, non-expired payment method';
        break;
      case 'incorrect_cvc':
        suggestedAction = 'Double-check your card security code';
        break;
      case 'authentication_required':
        suggestedAction = 'Complete authentication with your bank and try again';
        break;
      case 'processing_error':
        suggestedAction = 'Try again in a few moments';
        break;
      default:
        suggestedAction = 'Try a different payment method or contact support';
    }

    return {
      code: code || 'stripe_error',
      message: error.message || 'Payment processing failed',
      retryable: retryableStripeErrors.includes(code),
      suggestedAction,
    };
  }

  private parseAPIError(errorData: any): PaymentError {
    const retryableAPICodes = [
      'RATE_LIMITED',
      'SERVICE_UNAVAILABLE',
      'TIMEOUT',
      'NETWORK_ERROR',
    ];

    return {
      code: errorData.code || 'API_ERROR',
      message: errorData.message || 'API request failed',
      retryable: retryableAPICodes.includes(errorData.code),
      suggestedAction: errorData.suggestedAction || 'Try again later',
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset() {
    this.retryCount = 0;
  }

  getRetryCount(): number {
    return this.retryCount;
  }
}

// Utility functions for common payment operations
export const paymentRetryHandler = new PaymentRetryHandler();

export async function retryPaymentOperation<T>(
  operation: () => Promise<T>,
  options?: Partial<PaymentRetryOptions>
): Promise<T> {
  const handler = new PaymentRetryHandler(options);
  
  return handler.executeWithRetry(operation, async (error, attempt) => {
    console.warn(`Payment attempt ${attempt} failed:`, error);
    
    // Show user-friendly error message
    ToastService.error(`${error.message}${error.suggestedAction ? ` - ${error.suggestedAction}` : ''}`);
    
    return true; // Continue retrying
  });
}

// Specific retry handlers for different payment scenarios
export class CoursePaymentRetryHandler extends PaymentRetryHandler {
  constructor() {
    super({
      maxRetries: 2, // Fewer retries for course purchases
      baseDelay: 2000,
      maxDelay: 8000,
    });
  }
}

export class SubscriptionRetryHandler extends PaymentRetryHandler {
  constructor() {
    super({
      maxRetries: 3, // More retries for subscriptions
      baseDelay: 1500,
      maxDelay: 10000,
    });
  }
}

// Recovery strategies for different payment failures
export const PaymentRecoveryStrategies = {
  cardDeclined: {
    title: 'Card Declined',
    actions: [
      'Try a different payment method',
      'Check with your bank',
      'Verify card details are correct',
    ],
    canRetry: false,
  },
  
  insufficientFunds: {
    title: 'Insufficient Funds',
    actions: [
      'Add funds to your account',
      'Use a different payment method',
      'Try a smaller amount',
    ],
    canRetry: false,
  },
  
  networkError: {
    title: 'Connection Error',
    actions: [
      'Check your internet connection',
      'Try again in a moment',
      'Refresh the page',
    ],
    canRetry: true,
  },
  
  processingError: {
    title: 'Processing Error',
    actions: [
      'Wait a moment and try again',
      'Try a different browser',
      'Contact support if issue persists',
    ],
    canRetry: true,
  },
};

export function getRecoveryStrategy(errorCode: string) {
  switch (errorCode) {
    case 'card_declined':
      return PaymentRecoveryStrategies.cardDeclined;
    case 'insufficient_funds':
      return PaymentRecoveryStrategies.insufficientFunds;
    case 'processing_error':
    case 'rate_limit':
      return PaymentRecoveryStrategies.processingError;
    case 'api_connection_error':
    case 'network_error':
      return PaymentRecoveryStrategies.networkError;
    default:
      return PaymentRecoveryStrategies.processingError;
  }
}