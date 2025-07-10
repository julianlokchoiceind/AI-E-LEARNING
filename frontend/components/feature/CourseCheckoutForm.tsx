'use client';

import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  CardElement,
  Elements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/Button';
import { useCreateCoursePayment } from '@/hooks/queries/usePayments';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { CreditCard, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { PaymentErrorBoundary } from './PaymentErrorBoundary';
import { CoursePaymentRetryHandler, getRecoveryStrategy } from '@/lib/utils/paymentRetry';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface CourseCheckoutFormProps {
  course: any;
  onSuccess: () => void;
  onError: (error: string) => void;
}

// Main wrapper component that initializes Stripe Elements
export function CourseCheckoutForm({ course, onSuccess, onError }: CourseCheckoutFormProps) {
  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '6px',
      borderRadius: '8px',
    },
  };

  return (
    <PaymentErrorBoundary
      onRetry={() => window.location.reload()}
    >
      <Elements stripe={stripePromise}>
        <CheckoutForm 
          course={course}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </PaymentErrorBoundary>
  );
}

// Inner form component that uses Stripe Elements
function CheckoutForm({ 
  course, 
  onSuccess, 
  onError 
}: CourseCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  
  // React Query mutation for course payment
  const { mutateAsync: createPayment, loading: paymentProcessing } = useCreateCoursePayment();
  
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string>('');
  const [cardComplete, setCardComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [recoveryStrategy, setRecoveryStrategy] = useState<any>(null);
  
  const retryHandler = new CoursePaymentRetryHandler();

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    if (event.error) {
      setPaymentError(event.error.message);
    } else {
      setPaymentError('');
    }
  };

  const processPayment = async () => {
    if (!stripe || !elements) {
      throw new Error('Something went wrong');
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      throw new Error('Something went wrong');
    }

    // Create payment method
    const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        email: user?.email,
        name: user?.name,
      },
    });

    if (paymentMethodError) {
      const error = new Error(paymentMethodError.message);
      (error as any).code = paymentMethodError.code;
      (error as any).type = 'StripeError';
      throw error;
    }

    // Create payment intent using React Query mutation
    const response = await createPayment({ courseId: course.id, paymentMethodId: paymentMethod.id });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    const paymentResponse = response.data;

    // Confirm payment
    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
      paymentResponse.client_secret,
      {
        payment_method: paymentMethod.id,
      }
    );

    if (confirmError) {
      const error = new Error(confirmError.message);
      (error as any).code = confirmError.code;
      (error as any).type = 'StripeError';
      throw error;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      return paymentIntent;
    } else {
      // Use payment intent error details if available
      const errorMessage = paymentIntent?.last_payment_error?.message || 
                          'Payment could not be completed. Please check your card details and try again.';
      throw new Error(errorMessage);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Payment system not ready. Please try again.');
      return;
    }

    if (!cardComplete) {
      // Use the error message from Stripe if available, otherwise use a descriptive message
      setPaymentError(paymentError || 'Please fill in all card details before submitting');
      return;
    }

    setIsLoading(true);
    setPaymentError('');
    setRecoveryStrategy(null);

    try {
      const paymentIntent = await retryHandler.executeWithRetry(
        processPayment,
        async (error, attempt) => {
          setRetryCount(attempt);
          const strategy = getRecoveryStrategy(error.code);
          setRecoveryStrategy(strategy);
          
          if (strategy.canRetry) {
            ToastService.error(`${error.message} - Retrying... (${attempt}/3)`);
            return true; // Continue retrying
          } else {
            setPaymentError(error.message);
            return false; // Stop retrying
          }
        }
      );

      // Payment successful
      ToastService.success('Payment successful! Enrolling you in the course...');
      
      // Give a moment for webhook processing
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (error: any) {
      console.error('Payment failed after retries:', error);
      const strategy = getRecoveryStrategy(error.code);
      setRecoveryStrategy(strategy);
      setPaymentError(error.message || 'Payment failed after multiple attempts');
      onError(error.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Payment Information</h3>
        <div className="p-4 border border-gray-300 rounded-lg bg-white">
          <CardElement
            options={cardElementOptions}
            onChange={handleCardChange}
          />
        </div>
      </div>

      {/* Error Display */}
      {paymentError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-600 text-sm font-medium mb-2">{paymentError}</p>
              
              {recoveryStrategy && (
                <div className="mt-3">
                  <p className="text-red-700 text-sm font-medium mb-2">What you can try:</p>
                  <ul className="space-y-1">
                    {recoveryStrategy.actions.map((action: string, index: number) => (
                      <li key={index} className="flex items-start text-sm text-red-600">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {retryCount > 0 && (
                <div className="mt-2 text-xs text-red-500">
                  Retry attempt: {retryCount}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Purchase Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Course:</span>
            <span className="text-sm font-medium">{course.title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Price:</span>
            <span className="font-bold text-lg">
              ${course.pricing.discount_price || course.pricing.price}
            </span>
          </div>
          {course.pricing.discount_price && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Original Price:</span>
              <span className="line-through text-gray-500">
                ${course.pricing.price}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        loading={isLoading}
        disabled={!stripe || !elements || isLoading || !cardComplete}
        className="w-full"
        size="lg"
      >
        <Lock className="w-4 h-4 mr-2" />
        {isLoading ? 'Processing Payment...' : `Pay $${course.pricing.discount_price || course.pricing.price}`}
      </Button>

      {/* Features Included */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-2">This purchase includes:</h4>
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            <span>Lifetime access to course content</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            <span>Interactive quizzes and assignments</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            <span>Certificate of completion</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            <span>AI Study Buddy assistance</span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>Your payment information is secure and encrypted.</p>
        <p>Powered by Stripe • 14-day money-back guarantee</p>
      </div>
    </form>
  );
}