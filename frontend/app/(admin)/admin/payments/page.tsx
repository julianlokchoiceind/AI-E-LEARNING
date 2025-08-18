'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AdminPaymentHistory } from '@/components/ui/AdminPaymentHistory';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';
import { Pagination } from '@/components/ui/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { usePaymentAnalyticsQuery, useAdminPaymentHistoryQuery } from '@/hooks/queries/usePayments';
import { ToastService } from '@/lib/toast/ToastService';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  Download,
  Filter,
  Search,
  ArrowLeft,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Payment analytics data
  const {
    summary: paymentSummary,
    trends: paymentTrends,
    loading: analyticsLoading,
    error: analyticsError,
    refetchAll: refetchAnalytics
  } = usePaymentAnalyticsQuery(30, !!user);

  // Admin payment history with user details - updated for unified pagination
  const {
    data: adminPaymentHistoryResponse,
    loading: historyLoading,
    execute: refetchHistory
  } = useAdminPaymentHistoryQuery(
    currentPage, 
    itemsPerPage, 
    statusFilter !== 'all' ? statusFilter : undefined, 
    typeFilter !== 'all' ? typeFilter : undefined, 
    !!user
  );

  useEffect(() => {
    if (user?.role !== 'admin') {
      ToastService.error('Access denied. Admin access required.');
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchAnalytics(),
        refetchHistory()
      ]);
      ToastService.success('Payment data refreshed successfully');
    } catch (error) {
      ToastService.error('Failed to refresh payment data');
    }
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export functionality
    ToastService.info('CSV export functionality coming soon');
  };

  if (analyticsLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading payment analytics..." />
      </div>
    );
  }

  if (analyticsError) {
    console.warn('Payment analytics error:', analyticsError);
  }

  const summaryData = paymentSummary?.data;
  const trendsData = paymentTrends?.data;
  
  // Extract payment history and pagination data
  const paymentHistory = adminPaymentHistoryResponse?.data?.payments || [];
  const totalItems = adminPaymentHistoryResponse?.data?.total || 0;
  const totalPages = adminPaymentHistoryResponse?.data?.total_pages || 1;

  return (
    <div className="space-y-6">
      {/* Header - Đồng nhất với admin pages khác */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Manage platform payments and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            Refresh Data
          </Button>
        </div>
      </div>
      {/* Analytics Overview */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summaryData.revenue.total)}
                  </p>
                  <p className="text-sm text-green-600">
                    +{formatCurrency(summaryData.revenue.this_month)} this month
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summaryData.payments.total_count}
                  </p>
                  <p className="text-sm text-gray-500">
                    Avg: {formatCurrency(summaryData.revenue.average_payment)}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {trendsData?.payment_stats?.success_rate?.toFixed(1) || 0}%
                  </p>
                  <p className="text-sm text-gray-500">
                    Payment success rate
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summaryData.subscriptions.active_count}
                  </p>
                  <p className="text-sm text-gray-500">
                    Pro subscribers
                  </p>
                </div>
                <Users className="w-8 h-8 text-indigo-500" />
              </div>
            </Card>
        </div>
      )}

      {/* Payment Breakdown */}
      {summaryData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Types</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Course Purchases</span>
                  <span className="font-semibold">
                    {summaryData.payments.by_type.course_purchases} payments
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Subscriptions</span>
                  <span className="font-semibold">
                    {summaryData.payments.by_type.subscriptions} payments
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Status</h2>
              <div className="space-y-3">
                {Object.entries(summaryData.payments.by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-gray-700 capitalize">{status}</span>
                    <span className="font-semibold">
                      {count} payments
                    </span>
                  </div>
                ))}
              </div>
            </Card>
        </div>
      )}

      {/* Daily Revenue Trends */}
      {trendsData?.daily_revenue && trendsData.daily_revenue.length > 0 && (
        <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Revenue Trends (Last 7 Days)</h2>
            <div className="grid grid-cols-7 gap-2 text-xs">
              {trendsData.daily_revenue.slice(-7).map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-gray-500 mb-1">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="bg-blue-100 rounded p-2">
                    <div className="font-semibold text-blue-600">
                      {formatCurrency(day.total_revenue)}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {day.payment_count} payments
                    </div>
                    <div className="text-green-600 text-xs">
                      {day.success_rate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </Card>
      )}

      {/* Payment History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Payments</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setCurrentPage(1); // Reset to first page when search changes
                  setSearchQuery(e.target.value);
                }}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={statusFilter}
              onChange={(e) => {
                setCurrentPage(1); // Reset to first page when filter changes
                setStatusFilter(e.target.value);
              }}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
        
        {paymentHistory.length > 0 ? (
          <AdminPaymentHistory payments={paymentHistory} />
        ) : (
          <EmptyState
            title="No payments found"
            description="No payment transactions match your criteria"
          />
        )}

        {/* Payment History Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              loading={historyLoading}
              showInfo={true}
              className="flex justify-center"
            />
          </div>
        )}
      </Card>
    </div>
  );
}