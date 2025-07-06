'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SubscriptionCheckoutForm } from '@/components/feature/SubscriptionCheckoutForm';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { ArrowLeft, Shield, Crown, Check } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export default function SubscribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const plan = searchParams.get('plan') || 'pro';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/billing/subscribe');
      return;
    }

    if (user) {
      // Premium users have free access
      if (user.premiumStatus) {
        ToastService.success('You have premium access to all courses');
        router.push('/billing');
        return;
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const planDetails = {
    pro: {
      name: 'Pro',
      price: 29,
      currency: 'USD',
      interval: 'month',
      features: [
        'Unlimited access to all courses',
        'Priority AI assistant support',
        'Download courses for offline learning',
        'Exclusive Pro content and early access',
        'Ad-free experience',
        'Certificate verification',
        'Priority customer support'
      ]
    }
  };

  const currentPlan = planDetails[plan as keyof typeof planDetails];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/pricing')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pricing
          </Button>
          <div className="text-center">
            <Crown className="w-12 h-12 mx-auto mb-4 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Subscribe to {currentPlan.name}
            </h1>
            <p className="text-gray-600 mt-2">
              Join thousands of learners already mastering AI with our Pro plan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Details */}
          <Card className="p-6">
            <div className="text-center mb-6">
              <Badge className="bg-purple-100 text-purple-800 mb-4">
                Most Popular
              </Badge>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentPlan.name} Plan
              </h2>
              <div className="flex items-baseline justify-center mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  ${currentPlan.price}
                </span>
                <span className="text-gray-600 ml-2">
                  /{currentPlan.interval}
                </span>
              </div>
              <p className="text-gray-600">
                Everything you need to master AI programming
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-gray-900">What's included:</h3>
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Special Offer
              </h4>
              <p className="text-blue-800 text-sm">
                Start your Pro subscription today and get immediate access to all premium content. 
                Cancel anytime with no hidden fees.
              </p>
            </div>
          </Card>

          {/* Subscription Form */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Complete Your Subscription
            </h2>
            
            <Elements stripe={stripePromise}>
              <SubscriptionCheckoutForm 
                plan={currentPlan}
                onSuccess={() => {
                  ToastService.success('Subscription successful! Welcome to Pro!');
                  router.push('/dashboard');
                }}
                onError={(error: string) => {
                  ToastService.error(error);
                }}
              />
            </Elements>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes, you can cancel your Pro subscription at any time. You'll continue to have access until the end of your current billing period.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 text-sm">
                We accept all major credit cards and debit cards through our secure payment processor Stripe.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Will I be charged immediately?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes, you'll be charged immediately and then on the same date each month. You can view and manage your billing in your account settings.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Is there a free trial?
              </h3>
              <p className="text-gray-600 text-sm">
                We offer a 14-day money-back guarantee instead of a free trial. If you're not satisfied within the first 14 days, we'll provide a full refund.
              </p>
            </div>
          </div>
        </Card>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-2" />
            <span>Secure payment powered by Stripe</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Your payment information is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}