'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { getPaymentStatusVariant } from '@/lib/utils/badge-helpers';

interface AdminPayment {
  id: string;
  user: {
    email: string;
    name: string;
  };
  course?: {
    title: string;
    id: string;
  };
  type: 'course_purchase' | 'subscription' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  provider: string;
  provider_payment_id?: string;
  metadata?: any;
  created_at: string;
  paid_at?: string;
  updated_at: string;
}

interface AdminPaymentHistoryProps {
  payments: AdminPayment[];
  onViewDetails?: (payment: AdminPayment) => void;
}

export const AdminPaymentHistory: React.FC<AdminPaymentHistoryProps> = ({
  payments,
  onViewDetails,
}) => {
  const getPaymentDescription = (payment: AdminPayment) => {
    if (payment.course?.title) {
      return payment.course.title;
    }
    
    switch (payment.type) {
      case 'course_purchase':
        return payment.metadata?.course_title || 'Course Purchase';
      case 'subscription':
        return `Pro Subscription (${payment.metadata?.billing_cycle || 'Monthly'})`;
      case 'refund':
        return 'Refund';
      default:
        return 'Payment';
    }
  };


  if (payments.length === 0) {
    return (
      <div className="bg-background rounded-lg shadow-sm border border-border p-8">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-muted-foreground mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium text-foreground mb-2">No payment history</p>
          <p className="text-muted-foreground">Payment transactions will appear here when available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg shadow-sm border border-border overflow-hidden">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-border">
          {payments.map((payment) => (
            <tr
              key={payment.id}
              className={onViewDetails ? 'hover:bg-muted/30 cursor-pointer' : ''}
              onClick={() => onViewDetails && onViewDetails(payment)}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {formatDate(payment.paid_at || payment.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {payment.user?.name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment.user?.email || 'unknown@email.com'}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {getPaymentDescription(payment)}
                  </p>
                  {payment.provider_payment_id && (
                    <p className="text-xs text-muted-foreground">
                      ID: {payment.provider_payment_id}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {formatCurrency(payment.amount)} {payment.currency}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={getPaymentStatusVariant(payment.status)}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails && onViewDetails(payment);
                  }}
                  className="text-primary hover:text-primary/80"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};