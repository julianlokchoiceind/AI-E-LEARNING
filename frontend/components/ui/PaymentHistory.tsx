'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import {
  PaymentResponse,
  PaymentType,
  getPaymentStatusColor,
  formatPrice,
} from '@/lib/api/payments';

interface PaymentHistoryProps {
  payments: PaymentResponse[];
  onViewDetails?: (payment: PaymentResponse) => void;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  payments,
  onViewDetails,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentDescription = (payment: PaymentResponse) => {
    switch (payment.type) {
      case PaymentType.COURSE_PURCHASE:
        return payment.metadata?.course_title || 'Course Purchase';
      case PaymentType.SUBSCRIPTION:
        return `Pro Subscription (${payment.metadata?.billing_cycle || 'Monthly'})`;
      case PaymentType.REFUND:
        return 'Refund';
      default:
        return 'Payment';
    }
  };

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-border p-8">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-1">
            No payment history
          </h3>
          <p className="text-muted-foreground">
            Your payment transactions will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Date
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
              Invoice
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-border">
          {payments.map((payment) => (
            <tr
              key={payment.id}
              className={onViewDetails ? 'hover:bg-muted cursor-pointer' : ''}
              onClick={() => onViewDetails && onViewDetails(payment)}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {formatDate(payment.paid_at || payment.created_at)}
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
                {formatPrice(payment.amount, payment.currency)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge className={getPaymentStatusColor(payment.status)}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {payment.status === 'completed' && (
                  <button className="text-primary hover:text-primary/80">
                    Download
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};