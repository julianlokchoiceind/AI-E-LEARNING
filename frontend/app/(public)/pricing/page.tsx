'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { loadStripe } from '@stripe/stripe-js';
import { Container } from '@/components/ui/Container';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export default function PricingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProSubscription = async () => {
    if (!user) {
      ToastService.error('Please login to subscribe');
      router.push('/login');
      return;
    }

    // Check premium status instead of subscription object
    if (user.premiumStatus) {
      console.log('You already have premium access'); // Success feedback removed
      return;
    }

    setIsProcessing(true);
    try {
      // Create payment method (in production, collect card details)
      // For demo, we'll redirect to a payment collection page
      router.push('/billing/subscribe');
    } catch (error: any) {
      console.error('Subscription error:', error);
      ToastService.error(error.message || 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPerCourse = () => {
    router.push('/courses');
  };

  return (
    <div className="min-h-screen bg-muted py-12">
      <Container variant="public">
        <div>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Choose Your Learning Path
            </h1>
            <p className="text-xl text-muted-foreground">
              Flexible pricing options to match your learning needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-border">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Free</h2>
              <p className="text-muted-foreground">Get started with basics</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground">Access to free courses</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground">Basic AI assistant support</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground">Course completion certificates</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-muted-foreground/60 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground">Limited course access</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-muted-foreground/60 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground">Ads supported</span>
              </li>
            </ul>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/register')}
              disabled={!!user}
            >
              {user ? 'Current Plan' : 'Get Started'}
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-primary relative">
            <Badge variant="primary" className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              Most Popular
            </Badge>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Pro</h2>
              <p className="text-muted-foreground">Everything you need to succeed</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground font-medium">Unlimited access to all courses</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground font-medium">Priority AI assistant support</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground font-medium">Download courses for offline</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground font-medium">Exclusive Pro content</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground font-medium">Ad-free experience</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground font-medium">Early access to new courses</span>
              </li>
            </ul>

            <Button
              className="w-full bg-primary hover:bg-primary/80"
              onClick={handleProSubscription}
              disabled={isProcessing || user?.premiumStatus}
            >
              {isProcessing ? 'Processing...' : 
               user?.premiumStatus ? 
               'Current Plan' : 'Subscribe to Pro'}
            </Button>
          </div>

          {/* Pay Per Course */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-border">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Pay Per Course</h2>
              <p className="text-muted-foreground">Choose what you learn</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">$19-99</span>
                <span className="text-muted-foreground">/course</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground">Lifetime access to purchased courses</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground">Pay only for what you need</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground">Course completion certificates</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-success mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground">Basic AI assistant support</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-muted-foreground/60 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-muted-foreground">No monthly commitment</span>
              </li>
            </ul>

            <Button
              variant="outline"
              className="w-full"
              onClick={handlePayPerCourse}
            >
              Browse Courses
            </Button>
          </div>
        </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Can I switch between plans?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade to Pro at any time. If you cancel Pro, you'll still have access until the end of your billing period.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards, debit cards, and popular e-wallets through our secure payment processor Stripe.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
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