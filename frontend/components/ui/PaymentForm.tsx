'use client';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

import React, { useState } from 'react';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/Button';
import { } from 'lucide-react';
import { useInlineMessage } from '@/hooks/useInlineMessage';
import { InlineMessage } from '@/components/ui/InlineMessage';

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
  
  // Inline messages for payment form
  const paymentMessage = useInlineMessage('payment-form');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    paymentMessage.clear();

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        const errorMsg = error.message || 'Payment failed';
        paymentMessage.showError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        paymentMessage.showSuccess('Payment processed successfully!');
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      paymentMessage.showError(message);
      if (onError) {
        onError(message);
      }
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

      {/* Inline messages for payment form */}
      {paymentMessage.message && (
        <InlineMessage
          message={paymentMessage.message.message}
          type={paymentMessage.message.type}
          onDismiss={paymentMessage.clear}
        />
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <LoadingSpinner size="sm" />
              
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