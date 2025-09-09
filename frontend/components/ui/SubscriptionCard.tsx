'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  SubscriptionStatus, 
  SubscriptionType,
  formatSubscriptionPeriod 
} from '@/lib/api/payments';
import { getSubscriptionStatusVariant } from '@/lib/utils/badge-helpers';

interface SubscriptionCardProps {
  type: SubscriptionType;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  onUpgrade?: () => void;
  onCancel?: () => void;
  onReactivate?: () => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  type,
  status,
  currentPeriodStart,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  onUpgrade,
  onCancel,
  onReactivate,
}) => {
  const isPro = type === SubscriptionType.PRO;
  const isActive = status === SubscriptionStatus.ACTIVE;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {isPro ? 'Pro Subscription' : 'Free Plan'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isPro 
              ? 'Unlimited access to all courses and features' 
              : 'Limited access to free courses'}
          </p>
        </div>
        <Badge variant={getSubscriptionStatusVariant(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>

      {isPro && (
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm">
            <span className="text-muted-foreground w-24">Price:</span>
            <span className="font-medium">$29/month</span>
          </div>
          {currentPeriodStart && currentPeriodEnd && (
            <div className="flex items-center text-sm">
              <span className="text-muted-foreground w-24">Billing Period:</span>
              <span className="font-medium">
                {formatSubscriptionPeriod(currentPeriodStart, currentPeriodEnd)}
              </span>
            </div>
          )}
          {cancelAtPeriodEnd && (
            <div className="flex items-center text-sm">
              <span className="text-muted-foreground w-24">Status:</span>
              <span className="text-warning font-medium">
                Cancels at period end
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {!isPro && onUpgrade && (
          <Button onClick={onUpgrade} className="flex-1">
            Upgrade to Pro
          </Button>
        )}
        
        {isPro && isActive && onCancel && !cancelAtPeriodEnd && (
          <Button 
            onClick={onCancel} 
            variant="outline"
            className="flex-1"
          >
            Cancel Subscription
          </Button>
        )}
        
        {isPro && cancelAtPeriodEnd && onReactivate && (
          <Button 
            onClick={onReactivate}
            className="flex-1"
          >
            Reactivate Subscription
          </Button>
        )}
      </div>

      {isPro && (
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="font-medium text-foreground mb-3">Pro Benefits</h4>
          <ul className="space-y-2">
            {[
              'Unlimited access to all courses',
              'Priority AI assistant support',
              'Download courses for offline learning',
              'Exclusive Pro-only content',
              'Ad-free experience',
              'Early access to new courses',
            ].map((benefit, index) => (
              <li key={index} className="flex items-center text-sm text-muted-foreground">
                <svg 
                  className="w-4 h-4 text-success mr-2 flex-shrink-0" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};