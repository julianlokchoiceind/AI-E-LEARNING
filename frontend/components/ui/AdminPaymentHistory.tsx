'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
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
          <p className="text-lg font-medium text-gray-900 mb-2">No payment history</p>
          <p className="text-gray-500">Payment transactions will appear here when available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {payments.map((payment) => (
            <tr
              key={payment.id}
              className={onViewDetails ? 'hover:bg-gray-50 cursor-pointer' : ''}
              onClick={() => onViewDetails && onViewDetails(payment)}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(payment.paid_at || payment.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {payment.user?.name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {payment.user?.email || 'unknown@email.com'}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {getPaymentDescription(payment)}
                  </p>
                  {payment.provider_payment_id && (
                    <p className="text-xs text-gray-500">
                      ID: {payment.provider_payment_id}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(payment.amount)} {payment.currency}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge className={getStatusColor(payment.status)}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails && onViewDetails(payment);
                  }}
                  className="text-indigo-600 hover:text-indigo-900"
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