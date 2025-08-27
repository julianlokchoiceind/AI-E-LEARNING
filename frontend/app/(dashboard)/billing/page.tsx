'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SubscriptionCard } from '@/components/ui/SubscriptionCard';
import { PaymentHistory } from '@/components/ui/PaymentHistory';
import { 
  formatPrice,
  formatSubscriptionPeriod,
  getSubscriptionStatusColor
} from '@/lib/api/payments';
import { useBillingDashboardQuery, useCancelSubscription } from '@/hooks/queries/usePayments';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { BillingPageSkeleton } from '@/components/ui/LoadingStates';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Settings, 
  AlertCircle,
  Crown,
  Plus
} from 'lucide-react';

export default function BillingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // React Query hooks for billing data
  const {
    subscriptionStatus,
    paymentHistory,
    loading,
    refetchAll
  } = useBillingDashboardQuery(!!user);

  const { mutate: cancelSubscriptionMutation, loading: canceling } = useCancelSubscription();

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/billing');
    }
  }, [user, authLoading, router]);

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You\'ll lose access to Pro features at the end of your billing period.')) {
      return;
    }

    cancelSubscriptionMutation(true, {
      onSuccess: (response) => {
        // React Query will automatically invalidate and refetch billing data
        // Toast handled automatically by useCancelSubscription
      },
      onError: (error: any) => {
        console.error('Cancellation failed:', error);
        // Toast handled automatically by useCancelSubscription
      }
    });
  };

  const handleUpgradeSubscription = () => {
    router.push('/billing/subscribe?plan=pro');
  };

  if (authLoading || loading) {
    return <BillingPageSkeleton />;
  }

  if (!user) {
    return null;
  }

  const hasActiveSubscription = subscriptionStatus?.data?.has_subscription && subscriptionStatus?.data?.status === 'active';
  const isPremiumUser = user.premiumStatus;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription and payment methods
          </p>
        </div>

        {/* Current Plan Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Subscription Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Current Plan</h2>
              {hasActiveSubscription && (
                <Crown className="w-5 h-5 text-secondary" />
              )}
            </div>
            
            {isPremiumUser ? (
              <div>
                <Badge className="bg-warning/20 text-warning mb-2">
                  Premium User
                </Badge>
                <p className="text-sm text-muted-foreground">
                  You have premium access granted by admin
                </p>
              </div>
            ) : hasActiveSubscription ? (
              <div>
                <Badge className={getSubscriptionStatusColor(subscriptionStatus?.data?.status || 'inactive')}>
                  {subscriptionStatus?.data?.type?.toUpperCase() || 'FREE'} - {subscriptionStatus?.data?.status?.toUpperCase() || 'INACTIVE'}
                </Badge>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">$29/month</p>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionStatus?.data?.cancel_at_period_end 
                      ? `Cancels on ${new Date(subscriptionStatus?.data?.current_period_end || Date.now()).toLocaleDateString()}`
                      : `Renews on ${new Date(subscriptionStatus?.data?.current_period_end || Date.now()).toLocaleDateString()}`
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Badge className="bg-muted text-muted-foreground mb-2">
                  Free Plan
                </Badge>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to Pro for unlimited access to all courses
                </p>
                <Button 
                  onClick={handleUpgradeSubscription}
                  size="sm"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </div>
            )}
          </Card>

          {/* Quick Stats */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Usage</h2>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Courses Enrolled</p>
                <p className="text-2xl font-bold text-foreground">
                  0
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Certificates Earned</p>
                <p className="text-2xl font-bold text-foreground">
                  0
                </p>
              </div>
            </div>
          </Card>

          {/* Next Billing */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Next Billing</h2>
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            {hasActiveSubscription && !subscriptionStatus?.data?.cancel_at_period_end ? (
              <div>
                <p className="text-2xl font-bold text-foreground">$29.00</p>
                <p className="text-sm text-muted-foreground">
                  Due {new Date(subscriptionStatus?.data?.current_period_end || Date.now()).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg text-muted-foreground">No upcoming billing</p>
                <p className="text-sm text-muted-foreground">
                  {hasActiveSubscription 
                    ? 'Subscription will end after current period'
                    : 'Subscribe to Pro for unlimited access'
                  }
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Subscription Management */}
        {hasActiveSubscription && !isPremiumUser && (
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Subscription Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-foreground mb-2">Pro Subscription</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Full access to all courses, AI assistant, and premium features
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="font-medium">Pro Monthly</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium">$29.00/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className={getSubscriptionStatusColor(subscriptionStatus?.data?.status || 'inactive')}>
                      {subscriptionStatus?.data?.status?.toUpperCase() || 'INACTIVE'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {subscriptionStatus?.data?.cancel_at_period_end ? (
                  <div className="p-4 bg-warning/20 border border-warning rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-warning mr-2" />
                      <span className="text-sm font-medium text-warning">
                        Subscription Scheduled for Cancellation
                      </span>
                    </div>
                    <p className="text-sm text-warning mt-1">
                      Your subscription will end on {new Date(subscriptionStatus?.data?.current_period_end || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleCancelSubscription}
                    loading={canceling}
                    className="w-full text-destructive border-destructive hover:bg-destructive/20"
                  >
                    Cancel Subscription
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => router.push('/billing/payment-methods')}
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Payment Methods
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Payment History */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Payment History</h2>
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </div>
          
          {paymentHistory?.data?.payments ? (
            <PaymentHistory payments={paymentHistory.data.payments} />
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No payment history available</p>
            </div>
          )}
        </Card>

        {/* Billing Support */}
        <Card className="mt-8 p-6 bg-primary/20 border-primary">
          <h2 className="text-lg font-semibold text-primary mb-2">
            Need Help?
          </h2>
          <p className="text-primary text-sm mb-4">
            Have questions about your billing or need to make changes to your subscription?
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              Contact Support
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/faq')}>
              View FAQ
            </Button>
            <Button variant="outline" size="sm">
              Download Invoice
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}