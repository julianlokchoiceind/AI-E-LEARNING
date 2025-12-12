'use client';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { loadStripe } from '@stripe/stripe-js';
import { Container } from '@/components/ui/Container';
import { HeroSection } from '@/components/ui/HeroSection';
import { PricingSection } from '@/components/feature/PricingSection';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useInlineMessage } from '@/hooks/useInlineMessage';
import { InlineMessage } from '@/components/ui/InlineMessage';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export default function PricingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const pricingLoginMessage = useInlineMessage('pricing-login-required');
  const pricingErrorMessage = useInlineMessage('pricing-error');

  const handleProSubscription = async () => {
    pricingErrorMessage.clear();
    pricingLoginMessage.clear();
    
    if (!user) {
      pricingLoginMessage.showError('Please login to subscribe');
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    // Check premium status instead of subscription object
    if (user.premiumStatus) {
      pricingErrorMessage.showSuccess('You already have premium access to all courses!');
      return;
    }

    setIsProcessing(true);
    try {
      // Create payment method (in production, collect card details)
      // For demo, we'll redirect to a payment collection page
      router.push('/billing/subscribe');
    } catch (error: any) {
      console.error('Subscription error:', error);
      pricingErrorMessage.showError(error.message || 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPerCourse = () => {
    router.push('/courses');
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Hero Section */}
      <HeroSection
        title="Choose Your Learning Path"
        subtitle="Flexible pricing options to match your learning needs"
        align="center"
        size="md"
        backgroundImage="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=600&fit=crop"
        tabletImage="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1024&h=400&fit=crop"
        mobileImage="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=768&h=300&fit=crop"
      />

      <Container variant="public">
        <div>
          {/* Global messages for pricing errors */}
          {pricingLoginMessage.message && (
            <InlineMessage
              message={pricingLoginMessage.message.message}
              type={pricingLoginMessage.message.type}
              onDismiss={pricingLoginMessage.clear}
            />
          )}

          {pricingErrorMessage.message && (
            <InlineMessage
              message={pricingErrorMessage.message.message}
              type={pricingErrorMessage.message.type}
              onDismiss={pricingErrorMessage.clear}
            />
          )}

          {/* Use PricingSection Component */}
          <SectionHeader
            title="Choose Your Learning Path"
            subtitle="Select the plan that best fits your learning goals and budget"
            align="left"
          />
          <PricingSection />
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm card-glow">
              <h3 className="font-semibold text-lg mb-2">Can I switch between plans?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade to Pro at any time. If you cancel Pro, you'll still have access until the end of your billing period.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm card-glow">
              <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards, debit cards, and popular e-wallets through our secure payment processor Stripe.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm card-glow">
              <h3 className="font-semibold text-lg mb-2">Is there a refund policy?</h3>
              <p className="text-muted-foreground">
                Yes, we offer a 14-day money-back guarantee for Pro subscriptions and individual course purchases if you're not satisfied.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}