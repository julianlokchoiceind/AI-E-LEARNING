'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { AlertTriangle, RefreshCw, CreditCard, HelpCircle } from 'lucide-react';

interface PaymentErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  errorCode: string;
  canRetry: boolean;
}

interface PaymentErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
  fallbackComponent?: ReactNode;
}

export class PaymentErrorBoundary extends Component<
  PaymentErrorBoundaryProps,
  PaymentErrorBoundaryState
> {
  constructor(props: PaymentErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      errorCode: '',
      canRetry: true,
    };
  }

  static getDerivedStateFromError(error: Error): PaymentErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected payment error occurred',
      errorCode: (error as any).code || 'PAYMENT_ERROR',
      canRetry: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log payment errors to monitoring service
    console.error('Payment Error:', error);
    console.error('Error Info:', errorInfo);
    
    // Log to external service (Sentry, etc.)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          component: 'PaymentErrorBoundary',
          errorCode: (error as any).code || 'PAYMENT_ERROR',
        },
        extra: errorInfo,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      errorMessage: '',
      errorCode: '',
      canRetry: true,
    });

    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      // Default retry action - reload the page
      window.location.reload();
    }
  };

  handleContactSupport = () => {
    // Navigate to support or open chat
    toast.info('Opening support chat...');
    // Implementation would depend on support system
    window.open('/contact?issue=payment', '_blank');
  };

  getErrorDetails = () => {
    const { errorCode, errorMessage } = this.state;
    
    switch (errorCode) {
      case 'card_declined':
        return {
          title: 'Card Declined',
          message: 'Your card was declined. Please try a different payment method.',
          icon: <CreditCard className="w-8 h-8 text-red-500" />,
          canRetry: true,
          suggestions: [
            'Check that your card details are correct',
            'Ensure you have sufficient funds',
            'Try a different payment method',
            'Contact your bank if the issue persists'
          ]
        };
      
      case 'insufficient_funds':
        return {
          title: 'Insufficient Funds',
          message: 'Your card has insufficient funds for this transaction.',
          icon: <CreditCard className="w-8 h-8 text-red-500" />,
          canRetry: true,
          suggestions: [
            'Add funds to your account',
            'Try a different payment method',
            'Contact your bank'
          ]
        };
      
      case 'expired_card':
        return {
          title: 'Card Expired',
          message: 'Your card has expired. Please use a different payment method.',
          icon: <CreditCard className="w-8 h-8 text-red-500" />,
          canRetry: true,
          suggestions: [
            'Use a different, valid card',
            'Update your payment method',
            'Contact your bank for a new card'
          ]
        };
      
      case 'processing_error':
        return {
          title: 'Processing Error',
          message: 'There was an error processing your payment. Please try again.',
          icon: <RefreshCw className="w-8 h-8 text-orange-500" />,
          canRetry: true,
          suggestions: [
            'Try again in a few moments',
            'Check your internet connection',
            'Try a different browser',
            'Contact support if the issue persists'
          ]
        };
      
      case 'authentication_required':
        return {
          title: 'Authentication Required',
          message: 'Your bank requires additional authentication for this payment.',
          icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
          canRetry: true,
          suggestions: [
            'Complete the authentication with your bank',
            'Try the payment again',
            'Contact your bank if you need help'
          ]
        };
      
      default:
        return {
          title: 'Payment Error',
          message: errorMessage || 'An unexpected payment error occurred.',
          icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
          canRetry: true,
          suggestions: [
            'Try refreshing the page',
            'Check your internet connection',
            'Try a different payment method',
            'Contact support for assistance'
          ]
        };
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallbackComponent) {
      return this.props.fallbackComponent;
    }

    const errorDetails = this.getErrorDetails();

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center">
          <div className="mb-6">
            {errorDetails.icon}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {errorDetails.title}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {errorDetails.message}
          </p>

          {errorDetails.suggestions && (
            <div className="mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">What you can try:</h3>
              <ul className="space-y-2">
                {errorDetails.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {errorDetails.canRetry && (
              <Button
                onClick={this.handleRetry}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={this.handleContactSupport}
              className="w-full"
              size="lg"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t text-xs text-gray-500">
            <p>Error Code: {this.state.errorCode}</p>
            <p>If this problem persists, please contact our support team.</p>
          </div>
        </Card>
      </div>
    );
  }
}

// Higher-order component for wrapping payment components
export function withPaymentErrorBoundary<T extends object>(
  Component: React.ComponentType<T>
) {
  return function PaymentProtectedComponent(props: T) {
    return (
      <PaymentErrorBoundary>
        <Component {...props} />
      </PaymentErrorBoundary>
    );
  };
}