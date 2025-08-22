'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Users,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner, EmptyState, AdSupportTableSkeleton } from '@/components/ui/LoadingStates';
import { 
  useAdminSupportTicketsQuery, 
  useSupportStatsQuery, 
  useUpdateSupportTicket,
  useCloseSupportTicket,
  useReopenSupportTicket
} from '@/hooks/queries/useSupport';
import {
  SupportTicket,
  TicketStats,
  TicketSearchParams,
  TicketUpdateData,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_FILTER_OPTIONS
} from '@/lib/types/support';
import { Pagination } from '@/components/ui/Pagination';

export default function AdminSupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [processingTicketId, setProcessingTicketId] = useState<string | null>(null);

  // Handle URL parameters - set filters from URL on mount
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setFilters(prev => ({ ...prev, status: statusParam }));
    }
  }, [searchParams]);
  
  // React Query hooks for data fetching
  const { 
    data: ticketsResponse, 
    loading: isInitialLoading,
    query: { isFetching, isRefetching },
    error: ticketsError,
    refetch: refetchTickets
  } = useAdminSupportTicketsQuery({
    search: searchQuery,
    status: filters.status as any || undefined,  // Send "unread" as status, backend will handle it
    priority: filters.priority as any || undefined,
    category: filters.category as any || undefined,
    page: currentPage,
    limit: itemsPerPage
  });

  const { 
    data: statsResponse, 
    loading: statsLoading,
    error: statsError
  } = useSupportStatsQuery();

  const updateTicketMutation = useUpdateSupportTicket();
  const closeTicketMutation = useCloseSupportTicket();
  const reopenTicketMutation = useReopenSupportTicket();

  // Memoized computed values for better performance
  const computedValues = useMemo(() => {
    // Smart loading states: Only show spinner on initial load, not background refetch
    const showLoadingSpinner = isInitialLoading && !ticketsResponse;
    const showBackgroundUpdate = (isFetching || isRefetching) && ticketsResponse;

    const tickets = ticketsResponse?.data?.items || [];
    const totalPages = ticketsResponse?.data?.total_pages || 1;
    const totalItems = ticketsResponse?.data?.total || 0;
    const stats = statsResponse?.data;

    return {
      showLoadingSpinner,
      showBackgroundUpdate,
      tickets,
      totalPages,
      totalItems,
      stats
    };
  }, [ticketsResponse, statsResponse, isInitialLoading, isFetching, isRefetching]);

  // Optimized callback handlers with useCallback
  const handleQuickUpdate = useCallback(async (ticketId: string, update: TicketUpdateData) => {
    try {
      await updateTicketMutation.mutateAsync({ ticketId, data: update as any });
      ToastService.success('Ticket updated successfully');
    } catch (error: any) {
      ToastService.error(error.message || 'Something went wrong');
    }
  }, [updateTicketMutation]);

  // Toggle status handler - uses dedicated close/reopen endpoints
  const handleToggleStatus = useCallback(async (ticketId: string, currentStatus: string) => {
    try {
      setProcessingTicketId(ticketId);
      if (currentStatus === 'closed') {
        await reopenTicketMutation.mutateAsync(ticketId);
      } else {
        await closeTicketMutation.mutateAsync(ticketId);
      }
    } catch (error: any) {
      // Error toast is handled automatically by useApiMutation
    } finally {
      setProcessingTicketId(null);
    }
  }, [closeTicketMutation, reopenTicketMutation]);

  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Memoized stat getters with fallbacks
  const statGetters = useMemo(() => ({
    getTotalTickets: () => computedValues.stats?.total_tickets ?? 0,
    getOpenTickets: () => computedValues.stats?.open_tickets ?? 0,
    getAvgResponseTime: () => {
      if (computedValues.stats?.avg_response_time_hours && computedValues.stats.avg_response_time_hours > 0) {
        return `${computedValues.stats.avg_response_time_hours.toFixed(1)}h`;
      }
      return '< 1h';
    }
  }), [computedValues.stats]);

  // Memoized category lookup for better performance
  const categoryMap = useMemo(() => {
    const map: Record<string, any> = {};
    TICKET_CATEGORIES.forEach(category => {
      map[category.value] = category;
    });
    return map;
  }, []);

  // Filter change handlers - reset to page 1 when filters change
  const handleFilterChange = useCallback((newValue: string, filterType: 'search' | 'status' | 'priority' | 'category') => {
    setCurrentPage(1); // Reset to first page when filters change
    
    switch (filterType) {
      case 'search':
        setSearchQuery(newValue);
        break;
      case 'status':
        setFilters(prev => ({ ...prev, status: newValue }));
        break;
      case 'priority':
        setFilters(prev => ({ ...prev, priority: newValue }));
        break;
      case 'category':
        setFilters(prev => ({ ...prev, category: newValue }));
        break;
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Ticket Management</h1>
          <p className="text-gray-600">Manage and respond to customer support tickets</p>
        </div>
        <Button
          onClick={() => refetchTickets()}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {statsLoading ? '...' : statGetters.getTotalTickets()}
              </p>
              <p className="text-sm text-gray-600">Total Tickets</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {statsLoading ? '...' : statGetters.getOpenTickets()}
              </p>
              <p className="text-sm text-gray-600">Open Tickets</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {statsLoading ? '...' : statGetters.getAvgResponseTime()}
              </p>
              <p className="text-sm text-gray-600">Avg Response Time</p>
            </div>
          </div>
        </Card>

      </div>

      {/* Show stats error if any */}
      {statsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm text-red-700">
              Error loading statistics: {statsError.message}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => handleFilterChange(e.target.value, 'search')}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          {/* Status Filter - Simplified to Open/Closed/Unread */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange(e.target.value, 'status')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Status</option>
            {TICKET_FILTER_OPTIONS.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          
          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange(e.target.value, 'priority')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Priority</option>
            {TICKET_PRIORITIES.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
          
          {/* Clear Filters Button */}
          <Button 
            onClick={() => {
              handleFilterChange('', 'search');
              handleFilterChange('', 'status');
              handleFilterChange('', 'priority');
            }} 
            variant="outline"
            className="w-full"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Tickets ({computedValues.totalItems})
            </h2>
            {computedValues.showBackgroundUpdate && (
              <div className="flex items-center text-sm text-blue-600">
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                Refreshing...
              </div>
            )}
          </div>
        </div>

        {computedValues.showLoadingSpinner ? (
          <AdSupportTableSkeleton />
        ) : computedValues.tickets.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <EmptyState
              title="No tickets found"
              description="No support tickets match your current search and filter criteria"
              action={{
                label: 'Clear Filters',
                onClick: () => {
                  handleFilterChange('', 'search');
                  handleFilterChange('', 'status');
                  handleFilterChange('', 'priority');
                }
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {computedValues.tickets.map((ticket: any, index: number) => {
                  // Use is_unread computed at DB level - much more efficient
                  const isUnread = ticket.is_unread === true;
                  
                  return (
                    <tr 
                      key={ticket.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${isUnread ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                      onClick={() => router.push(`/admin/support/${ticket.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {isUnread && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse" title="New messages"></div>
                          )}
                          <div>
                            <p className={`font-medium text-gray-900 ${isUnread ? 'font-bold' : ''}`}>
                              {ticket.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              #{ticket.id.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium">{ticket.user_name}</p>
                          <p className="text-xs text-gray-500">{ticket.user_email}</p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="text-sm">
                          {categoryMap[ticket.category]?.label}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={ticket.priority}
                          onChange={(e) => handleQuickUpdate(ticket.id, { 
                            priority: e.target.value as any 
                          })}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm border rounded px-2 py-1"
                        >
                          {TICKET_PRIORITIES.map(p => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant={ticket.status === 'closed' ? 'primary' : 'danger'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(ticket.id, ticket.status);
                          }}
                          loading={processingTicketId === ticket.id}
                        >
                          {ticket.status === 'closed' ? 'Re-open' : 'Close'}
                        </Button>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.created_at)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/support/${ticket.id}`);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        {computedValues.totalPages > 1 && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={computedValues.totalPages}
              totalItems={computedValues.totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              loading={isInitialLoading}
              showInfo={true}
              className="flex justify-center"
            />
          </div>
        )}
      </Card>

      {/* Category Distribution */}
      {computedValues.stats && computedValues.stats.tickets_by_category && Object.keys(computedValues.stats.tickets_by_category).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Tickets by Category</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(computedValues.stats.tickets_by_category).map(([category, count]) => {
                  const catInfo = TICKET_CATEGORIES.find(c => c.value === category);
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm">
                        {catInfo?.label || category}
                      </span>
                      <span className="font-medium">{String(count)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold">Tickets by Priority</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(computedValues.stats?.tickets_by_priority || {}).map(([priority, count]) => {
                  const priInfo = TICKET_PRIORITIES.find(p => p.value === priority);
                  return (
                    <div key={priority} className="flex items-center justify-between">
                      <Badge variant={priInfo?.color as any}>
                        {priInfo?.label || priority}
                      </Badge>
                      <span className="font-medium">{String(count)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}