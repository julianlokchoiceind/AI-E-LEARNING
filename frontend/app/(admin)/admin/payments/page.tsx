'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AdminPaymentHistory } from '@/components/ui/AdminPaymentHistory';
import { LoadingSpinner, EmptyState, AdPaymentsTableSkeleton } from '@/components/ui/LoadingStates';
import { Pagination } from '@/components/ui/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { usePaymentAnalyticsQuery, useAdminPaymentHistoryQuery } from '@/hooks/queries/usePayments';
import { ToastService } from '@/lib/toast/ToastService';
import { formatCurrency } from '@/lib/utils/formatters';
import { 
  DollarSign, 
  Users, 
  CreditCard,
  Download,
  Search,
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
    loading: isInitialLoading,
    query: { isFetching, isRefetching },
    execute: refetchHistory
  } = useAdminPaymentHistoryQuery(
    currentPage, 
    itemsPerPage, 
    statusFilter !== 'all' ? statusFilter : undefined, 
    typeFilter !== 'all' ? typeFilter : undefined, 
    !!user
  );

  // Smart loading states: Only show spinner on initial load, not background refetch
  const showLoadingSpinner = isInitialLoading && !adminPaymentHistoryResponse;

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


  // useApiQuery automatically handles errors via Toast notifications

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
          <h1 className="text-2xl font-bold text-foreground">Payment Management</h1>
          <p className="text-muted-foreground">Manage platform payments and analytics</p>
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
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(summaryData.revenue.total)}
                  </p>
                  <p className="text-sm text-success">
                    +{formatCurrency(summaryData.revenue.this_month)} this month
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-success" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Payments</p>
                  <p className="text-2xl font-bold text-foreground">
                    {summaryData.payments.total_count}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Avg: {formatCurrency(summaryData.revenue.average_payment)}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    {trendsData?.payment_stats?.success_rate?.toFixed(1) || 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Payment success rate
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-foreground">
                    {summaryData.subscriptions.active_count}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pro subscribers
                  </p>
                </div>
                <Users className="w-8 h-8 text-secondary" />
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
                  <span className="text-foreground">Course Purchases</span>
                  <span className="font-semibold">
                    {summaryData.payments.by_type.course_purchases} payments
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Subscriptions</span>
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
                    <span className="text-foreground capitalize">{status}</span>
                    <span className="font-semibold">
                      {String(count)} payments
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
              {trendsData.daily_revenue.slice(-7).map((day: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-muted-foreground mb-1">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="bg-primary/20 rounded p-2">
                    <div className="font-semibold text-primary">
                      {formatCurrency(day.total_revenue)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {day.payment_count} payments
                    </div>
                    <div className="text-success text-xs">
                      {day.success_rate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </Card>
      )}

      {/* Filters - Thống nhất với các modules khác */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search payments..."
              className="pl-10 w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
              value={searchQuery}
              onChange={(e) => {
                setCurrentPage(1); // Reset to first page when search changes
                setSearchQuery(e.target.value);
              }}
            />
          </div>
          <select
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
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
          <select
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
            value={typeFilter}
            onChange={(e) => {
              setCurrentPage(1); // Reset to first page when filter changes  
              setTypeFilter(e.target.value);
            }}
          >
            <option value="all">All Types</option>
            <option value="course_purchase">Course Purchase</option>
            <option value="subscription">Subscription</option>
          </select>
        </div>
      </Card>

      {/* Payment History Table - Thống nhất layout với modules khác */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Payments ({totalItems})
            </h2>
          </div>
        </div>
        
        {showLoadingSpinner ? (
          <AdPaymentsTableSkeleton rows={6} />
        ) : paymentHistory.length > 0 ? (
          <AdminPaymentHistory payments={paymentHistory} />
        ) : (
          <div className="flex justify-center items-center h-64">
            <EmptyState
              title="No payments found"
              description="No payment transactions match your current search and filter criteria"
              action={searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? {
                label: 'Clear Filters',
                onClick: () => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setCurrentPage(1);
                }
              } : undefined}
            />
          </div>
        )}

        {/* Table Footer with Pagination - Thống nhất với modules khác */}
        {totalPages > 1 && (
          <div className="border-t border-border bg-muted/50 px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              loading={isFetching}
              showInfo={true}
              className="flex justify-center"
            />
          </div>
        )}
      </Card>
    </div>
  );
}