'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingStates';
import { ToastService } from '@/lib/toast/ToastService';

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface PaymentFormProps {
  clientSecret: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  amount: number;
  currency?: string;
  productName?: string;
}

const CheckoutForm: React.FC<PaymentFormProps> = ({
  onSuccess,
  onError,
  onCancel,
  amount,
  currency = 'USD',
  productName,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        if (onError) {
          onError(error.message || 'Payment failed');
        }
        ToastService.error(error.message || 'Something went wrong');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        ToastService.success('Payment successful!');
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setErrorMessage(message);
      if (onError) {
        onError(message);
      }
      ToastService.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {productName && (
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium text-foreground">{productName}</h3>
          <p className="text-2xl font-bold text-foreground mt-1">
            {formatAmount(amount, currency)}
          </p>
        </div>
      )}

      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: {
            googlePay: 'auto',
            applePay: 'auto',
          },
        }}
      />

      {errorMessage && (
        <div className="text-destructive text-sm mt-2">{errorMessage}</div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <LoadingSpinner size="sm" className="mr-2 inline" />
              Processing...
            </>
          ) : (
            `Pay ${formatAmount(amount, currency)}`
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Powered by Stripe. Your payment information is secure and encrypted.
      </p>
    </form>
  );
};

export const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  if (!props.clientSecret) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No payment session available</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#3b82f6',
            colorBackground: '#ffffff',
            colorText: '#0f172a',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
      }}
    >
      <CheckoutForm {...props} />
    </Elements>
  );
};