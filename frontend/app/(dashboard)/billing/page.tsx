'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SubscriptionCard } from '@/components/ui/SubscriptionCard';
import { PaymentHistory } from '@/components/ui/PaymentHistory';
import { 
  getSubscriptionStatus, 
  getPaymentHistory, 
  cancelSubscription,
  formatPrice,
  formatSubscriptionPeriod,
  getSubscriptionStatusColor
} from '@/lib/api/payments';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
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

  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/billing');
      return;
    }

    if (user) {
      fetchBillingData();
    }
  }, [user, authLoading]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      const [subscriptionResponse, historyResponse] = await Promise.all([
        getSubscriptionStatus(),
        getPaymentHistory(10, 0)
      ]);

      setSubscriptionStatus(subscriptionResponse);
      setPaymentHistory(historyResponse.data);
    } catch (error: any) {
      console.error('Failed to fetch billing data:', error);
      toast.error(error.message || 'Operation Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You\'ll lose access to Pro features at the end of your billing period.')) {
      return;
    }

    try {
      setCanceling(true);
      const response = await cancelSubscription(true);
      
      if (response.success) {
        toast.success(response.message || 'Operation Failed');
        await fetchBillingData(); // Refresh data
      } else {
        throw new Error('Cancellation failed');
      }
    } catch (error: any) {
      console.error('Cancellation failed:', error);
      toast.error(error.message || 'Operation Failed');
    } finally {
      setCanceling(false);
    }
  };

  const handleUpgradeSubscription = () => {
    router.push('/billing/subscribe?plan=pro');
  };

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

  const hasActiveSubscription = subscriptionStatus?.has_subscription && subscriptionStatus?.status === 'active';
  const isPremiumUser = user.premiumStatus;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Billing & Subscription
          </h1>
          <p className="text-gray-600">
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
                <Crown className="w-5 h-5 text-purple-600" />
              )}
            </div>
            
            {isPremiumUser ? (
              <div>
                <Badge className="bg-gold-100 text-gold-800 mb-2">
                  Premium User
                </Badge>
                <p className="text-sm text-gray-600">
                  You have premium access granted by admin
                </p>
              </div>
            ) : hasActiveSubscription ? (
              <div>
                <Badge className={getSubscriptionStatusColor(subscriptionStatus.status)}>
                  {subscriptionStatus.type.toUpperCase()} - {subscriptionStatus.status.toUpperCase()}
                </Badge>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-gray-900">$29/month</p>
                  <p className="text-sm text-gray-600">
                    {subscriptionStatus.cancel_at_period_end 
                      ? `Cancels on ${new Date(subscriptionStatus.current_period_end).toLocaleDateString()}`
                      : `Renews on ${new Date(subscriptionStatus.current_period_end).toLocaleDateString()}`
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Badge className="bg-gray-100 text-gray-800 mb-2">
                  Free Plan
                </Badge>
                <p className="text-sm text-gray-600 mb-4">
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
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Courses Enrolled</p>
                <p className="text-2xl font-bold text-gray-900">
                  0
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Certificates Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  0
                </p>
              </div>
            </div>
          </Card>

          {/* Next Billing */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Next Billing</h2>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            {hasActiveSubscription && !subscriptionStatus.cancel_at_period_end ? (
              <div>
                <p className="text-2xl font-bold text-gray-900">$29.00</p>
                <p className="text-sm text-gray-600">
                  Due {new Date(subscriptionStatus.current_period_end).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg text-gray-500">No upcoming billing</p>
                <p className="text-sm text-gray-600">
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
                <h3 className="font-medium text-gray-900 mb-2">Pro Subscription</h3>
                <p className="text-sm text-gray-600 mb-4">
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
                    <Badge className={getSubscriptionStatusColor(subscriptionStatus.status)}>
                      {subscriptionStatus.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {subscriptionStatus.cancel_at_period_end ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium text-yellow-800">
                        Subscription Scheduled for Cancellation
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your subscription will end on {new Date(subscriptionStatus.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleCancelSubscription}
                    loading={canceling}
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
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
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
          
          {paymentHistory ? (
            <PaymentHistory payments={paymentHistory.payments} />
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No payment history available</p>
            </div>
          )}
        </Card>

        {/* Billing Support */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Need Help?
          </h2>
          <p className="text-blue-800 text-sm mb-4">
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