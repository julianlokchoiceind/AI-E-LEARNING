'use client';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  CardElement
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/Button';
import { SubscriptionType } from '@/lib/api/payments';
import { useAuth } from '@/hooks/useAuth';
import { useCreateSubscription } from '@/hooks/queries/usePayments';
import { Lock, CheckCircle, Crown, AlertTriangle } from 'lucide-react';
import { SubscriptionRetryHandler, getRecoveryStrategy } from '@/lib/utils/paymentRetry';

interface SubscriptionCheckoutFormProps {
  plan: {
    name: string;
    price: number;
    currency: string;
    interval: string;
    features: string[];
  };
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function SubscriptionCheckoutForm({ 
  plan, 
  onSuccess, 
  onError 
}: SubscriptionCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string>('');
  const [cardComplete, setCardComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [recoveryStrategy, setRecoveryStrategy] = useState<any>(null);
  
  const retryHandler = new SubscriptionRetryHandler();
  
  // React Query mutation for subscription creation
  const { mutate: createSubscriptionMutation, loading: subscriptionLoading } = useCreateSubscription();

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#0f172a',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: '#64748b',
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

  const processSubscription = async () => {
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

    // Return payment method for subscription creation
    return {
      success: true,
      data: { paymentMethod },
      message: 'Payment method created successfully'
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Payment system not ready. Please try again.');
      return;
    }

    if (!cardComplete) {
      setPaymentError('Please complete your card information');
      return;
    }

    setIsLoading(true);
    setPaymentError('');
    setRecoveryStrategy(null);

    try {
      // Step 1: Create payment method with retry handling
      const paymentMethodResponse = await retryHandler.executeWithRetry(
        processSubscription,
        async (error, attempt) => {
          setRetryCount(attempt);
          const strategy = getRecoveryStrategy(error.code);
          setRecoveryStrategy(strategy);
          
          if (strategy.canRetry) {
            setPaymentError(`${error.message} - Retrying... (${attempt}/3)`);
            return true; // Continue retrying
          } else {
            setPaymentError(error.message);
            return false; // Stop retrying
          }
        }
      );

      // Step 2: Create subscription using React Query mutation
      createSubscriptionMutation(
        {
          paymentMethodId: paymentMethodResponse.data.paymentMethod.id,
          subscriptionType: SubscriptionType.PRO
        },
        {
          onSuccess: (response) => {
            if (response.success) {
              // Manual toast removed - useApiMutation handles API response toast automatically
              setTimeout(() => {
                onSuccess();
              }, 1500);
            } else {
              throw new Error(response.message || 'Something went wrong');
            }
          },
          onError: (error: any) => {
            console.error('Subscription creation failed:', error);
            const strategy = getRecoveryStrategy(error.code || 'SUBSCRIPTION_ERROR');
            setRecoveryStrategy(strategy);
            setPaymentError(error.message || 'Subscription creation failed');
            onError(error.message || 'Subscription failed');
          }
        }
      );
      
    } catch (error: any) {
      console.error('Payment method creation failed after retries:', error);
      const strategy = getRecoveryStrategy(error.code);
      setRecoveryStrategy(strategy);
      setPaymentError(error.message || 'Payment setup failed after multiple attempts');
      onError(error.message || 'Payment setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-foreground">Account Information</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name
            </label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-foreground">Payment Information</h3>
        <div className="p-4 border border-border rounded-lg bg-white">
          <CardElement
            options={cardElementOptions}
            onChange={handleCardChange}
          />
        </div>
      </div>

      {/* Error Display */}
      {paymentError && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-destructive text-sm font-medium mb-2">{paymentError}</p>
              
              {recoveryStrategy && (
                <div className="mt-3">
                  <p className="text-destructive text-sm font-medium mb-2">What you can try:</p>
                  <ul className="space-y-1">
                    {recoveryStrategy.actions.map((action: string, index: number) => (
                      <li key={index} className="flex items-start text-sm text-destructive">
                        <span className="w-1.5 h-1.5 bg-destructive rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {retryCount > 0 && (
                <div className="mt-2 text-xs text-destructive">
                  Retry attempt: {retryCount}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subscription Summary */}
      <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
        <div className="flex items-center mb-3">
          <Crown className="w-5 h-5 text-primary mr-2" />
          <h3 className="font-medium text-primary">Subscription Summary</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-primary">Plan:</span>
            <span className="text-sm font-medium text-primary">
              {plan.name} ({plan.interval}ly)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-primary">Price:</span>
            <span className="font-bold text-lg text-primary">
              ${plan.price}/{plan.interval}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-primary">
            <span>Billing:</span>
            <span>Recurring monthly • Cancel anytime</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        loading={isLoading}
        disabled={!stripe || !elements || isLoading || !cardComplete}
        className="w-full bg-primary hover:bg-primary/80"
        size="lg"
      >
        <Lock className="w-4 h-4 mr-2" />
        {isLoading ? <LoadingSpinner size="sm" /> : `Subscribe for $${plan.price}/${plan.interval}`}
      </Button>

      {/* Subscription Benefits Reminder */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-foreground mb-2">Your Pro benefits:</h4>
        <div className="grid grid-cols-1 gap-1">
          {plan.features.slice(0, 4).map((feature, index) => (
            <div key={index} className="flex items-center text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
          {plan.features.length > 4 && (
            <div className="text-sm text-muted-foreground mt-1">
              + {plan.features.length - 4} more benefits
            </div>
          )}
        </div>
      </div>

      {/* Terms */}
      <div className="text-center text-xs text-muted-foreground border-t pt-4">
        <p>
          By subscribing, you agree to our Terms of Service and Privacy Policy.
        </p>
        <p className="mt-1">
          Your subscription will automatically renew each month. Cancel anytime.
        </p>
        <p className="mt-1">
          Secure payment powered by Stripe • 14-day money-back guarantee
        </p>
      </div>
    </form>
  );
}