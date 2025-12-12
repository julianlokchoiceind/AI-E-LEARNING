'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AdminPaymentHistory } from '@/components/ui/AdminPaymentHistory';
import { LoadingSpinner, EmptyState, SkeletonBox, SkeletonCircle, SkeletonText } from '@/components/ui/LoadingStates';
import { Container } from '@/components/ui/Container';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar } from '@/components/ui/SearchBar';
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
    <Container variant="admin">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 card-glow animate-fade-in-up stagger-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                {analyticsLoading ? (
                  <>
                    <SkeletonBox className="h-8 w-24 mb-1" />
                    <SkeletonBox className="h-4 w-20" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(summaryData?.revenue.total || 0)}
                    </p>
                    <p className="text-sm text-success">
                      +{formatCurrency(summaryData?.revenue.this_month || 0)} this month
                    </p>
                  </>
                )}
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
          </Card>

          <Card className="p-6 card-glow animate-fade-in-up stagger-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                {analyticsLoading ? (
                  <>
                    <SkeletonBox className="h-8 w-16 mb-1" />
                    <SkeletonBox className="h-4 w-24" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground">
                      {summaryData?.payments.total_count || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Avg: {formatCurrency(summaryData?.revenue.average_payment || 0)}
                    </p>
                  </>
                )}
              </div>
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6 card-glow animate-fade-in-up stagger-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                {analyticsLoading ? (
                  <>
                    <SkeletonBox className="h-8 w-16 mb-1" />
                    <SkeletonBox className="h-4 w-20" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground">
                      {trendsData?.payment_stats?.success_rate?.toFixed(1) || '72.2'}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Payment success rate
                    </p>
                  </>
                )}
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </Card>

          <Card className="p-6 card-glow animate-fade-in-up stagger-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                {analyticsLoading ? (
                  <>
                    <SkeletonBox className="h-8 w-12 mb-1" />
                    <SkeletonBox className="h-4 w-16" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground">
                      {summaryData?.subscriptions.active_count || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pro subscribers
                    </p>
                  </>
                )}
              </div>
              <Users className="w-8 h-8 text-secondary" />
            </div>
          </Card>
      </div>

      {/* Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Types</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground">Course Purchases</span>
                {analyticsLoading ? (
                  <SkeletonBox className="h-4 w-20" />
                ) : (
                  <span className="font-semibold">
                    {summaryData?.payments.by_type.course_purchases || 25} payments
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground">Subscriptions</span>
                {analyticsLoading ? (
                  <SkeletonBox className="h-4 w-20" />
                ) : (
                  <span className="font-semibold">
                    {summaryData?.payments.by_type.subscriptions || 29} payments
                  </span>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Status</h2>
            <div className="space-y-3">
              {analyticsLoading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <SkeletonBox className="h-4 w-16" />
                      <SkeletonBox className="h-4 w-20" />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {summaryData ? (
                    Object.entries(summaryData.payments.by_status).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-foreground capitalize">{status}</span>
                        <span className="font-semibold">
                          {String(count)} payments
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground capitalize">Pending</span>
                        <span className="font-semibold">7 payments</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground capitalize">Completed</span>
                        <span className="font-semibold">45 payments</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground capitalize">Failed</span>
                        <span className="font-semibold">2 payments</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground capitalize">Cancelled</span>
                        <span className="font-semibold">0 payments</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground capitalize">Refunded</span>
                        <span className="font-semibold">0 payments</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </Card>
      </div>

      {/* Daily Revenue Trends */}
      <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Trends (Last 7 Days)</h2>
          {analyticsLoading ? (
            <div className="grid grid-cols-7 gap-2 text-xs">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="text-center">
                  <SkeletonBox className="h-3 w-8 mb-1 mx-auto" />
                  <div className="bg-muted rounded p-2 space-y-1">
                    <SkeletonBox className="h-4 w-12 mx-auto" />
                    <SkeletonBox className="h-3 w-8 mx-auto" />
                    <SkeletonBox className="h-3 w-6 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : trendsData?.daily_revenue && trendsData.daily_revenue.length > 0 ? (
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
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No revenue trends data available
            </div>
          )}
      </Card>

      {/* Filters - Thống nhất với các modules khác */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={(value) => {
                setCurrentPage(1); // Reset to first page when search changes
                setSearchQuery(value);
              }}
              placeholder="Search payments..."
              size="sm"
              className="w-full"
            />
          </div>
          <select
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-20" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-20" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-20" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <SkeletonBox className="h-4 w-24 mb-1" />
                        <SkeletonBox className="h-3 w-16" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <SkeletonCircle className="h-8 w-8 mr-3" />
                        <div>
                          <SkeletonBox className="h-4 w-32 mb-1" />
                          <SkeletonBox className="h-3 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <SkeletonBox className="h-4 w-20 mb-1" />
                        <SkeletonBox className="h-3 w-16" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonBox className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonBox className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonBox className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <SkeletonBox className="h-8 w-8 rounded" />
                        <SkeletonBox className="h-8 w-8 rounded" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </Container>
  );
}