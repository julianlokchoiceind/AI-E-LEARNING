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
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner, EmptyState, SkeletonBox, SkeletonCircle, SkeletonText } from '@/components/ui/LoadingStates';
import { Container } from '@/components/ui/Container';
import { SearchBar } from '@/components/ui/SearchBar';
import { 
  useAdminSupportTicketsQuery, 
  useSupportStatsQuery, 
  useUpdateSupportTicket,
  useCloseSupportTicket,
  useReopenSupportTicket
} from '@/hooks/queries/useSupport';
import { ToastService } from '@/lib/toast/ToastService';
import {
  SupportTicket,
  TicketStats,
  TicketSearchParams,
  TicketUpdateData,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_FILTER_OPTIONS
} from '@/lib/types/support';
import { Pagination } from '@/components/ui/Pagination';
import { getTicketPriorityVariant } from '@/lib/utils/badge-helpers';

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
    status: (filters.status && (filters.status === 'open' || filters.status === 'closed')) ? filters.status as TicketStatus : undefined,  // Only pass valid TicketStatus values
    priority: (filters.priority && ['low', 'medium', 'high', 'urgent'].includes(filters.priority)) ? filters.priority as TicketPriority : undefined,
    category: (filters.category && ['technical', 'billing', 'course_content', 'account', 'feature_request', 'bug_report', 'other'].includes(filters.category)) ? filters.category as TicketCategory : undefined,
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

    const tickets = ticketsResponse?.data?.items || [];
    const totalPages = ticketsResponse?.data?.total_pages || 1;
    const totalItems = ticketsResponse?.data?.total || 0;
    const stats = statsResponse?.data;

    return {
      showLoadingSpinner,
      tickets,
      totalPages,
      totalItems,
      stats
    };
  }, [ticketsResponse, statsResponse, isInitialLoading]);

  // Smart polling for table data - only poll when tab is active
  useEffect(() => {
    if (document.hidden) return;
    
    const interval = setInterval(() => {
      refetchTickets();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [refetchTickets]);

  // Listen for visibility change - refresh when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetchTickets(); // Immediate refresh when tab becomes active
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchTickets]);

  // Optimized callback handlers with useCallback
  const handleQuickUpdate = useCallback(async (ticketId: string, update: TicketUpdateData) => {
    try {
      await updateTicketMutation.mutateAsync({ ticketId, data: update });
      // Manual toast removed - useApiMutation handles API response toast automatically
    } catch (error: any) {
      // Manual toast removed - useApiMutation handles API error toast automatically
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
    const map: Record<string, any> = { };
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
    <Container variant="admin">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Ticket Management</h1>
          <p className="text-muted-foreground">Manage and respond to customer support tickets</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {statsLoading ? '...' : statGetters.getTotalTickets()}
              </p>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
            </div>
            <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {statsLoading ? '...' : statGetters.getOpenTickets()}
              </p>
              <p className="text-sm text-muted-foreground">Open Tickets</p>
            </div>
            <div className="h-12 w-12 bg-warning/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-warning" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {statsLoading ? '...' : statGetters.getAvgResponseTime()}
              </p>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
            </div>
            <div className="h-12 w-12 bg-secondary/20 rounded-lg flex items-center justify-center">
              <Clock className="w-8 h-8 text-secondary" />
            </div>
          </div>
        </Card>

      </div>

      {/* Show stats error if any */}
      {statsError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-destructive mr-2" />
            <span className="text-sm text-destructive/90">
              Error loading statistics: {statsError.message}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <SearchBar
              value={searchQuery}
              onChange={(value) => handleFilterChange(value, 'search')}
              placeholder="Search tickets..."
              size="sm"
              className="w-full"
            />
          </div>
          
          {/* Status Filter - Simplified to Open/Closed/Unread */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange(e.target.value, 'status')}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
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
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
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
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Tickets ({computedValues.totalItems})
            </h2>
          </div>
        </div>

        {computedValues.showLoadingSpinner ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-20" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <SkeletonBox className="h-4 w-40 mb-1" />
                        <SkeletonBox className="h-3 w-20" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <SkeletonBox className="h-4 w-32 mb-1" />
                        <SkeletonBox className="h-3 w-40" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonBox className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonBox className="h-8 w-20 rounded" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonBox className="h-8 w-16 rounded" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonBox className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <SkeletonBox className="h-8 w-12 rounded" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {computedValues.tickets.map((ticket: any, index: number) => {
                  // Use is_unread computed at DB level - much more efficient
                  const isUnread = ticket.is_unread === true;
                  
                  return (
                    <tr 
                      key={ticket.id} 
                      className={`hover:bg-muted/50 cursor-pointer ${isUnread ? 'bg-primary/10' : ''}`}
                      onClick={() => router.push(`/admin/support/${ticket.id}`)}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap relative ${isUnread ? 'border-l-4 border-primary' : ''}`}>
                        <div className="flex items-center">
                          {isUnread && (
                            <div className="w-3 h-3 bg-primary rounded-full mr-3 animate-pulse" title="New messages"></div>
                          )}
                          <div>
                            <p className={`text-foreground ${isUnread ? 'font-bold' : 'font-normal'}`}>
                              {ticket.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              #{ticket.id.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium">{ticket.user_name}</p>
                          <p className="text-xs text-muted-foreground">{ticket.user_email}</p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        <span className="text-sm">
                          {categoryMap[ticket.category]?.label}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={ticket.priority}
                          onChange={(e) => handleQuickUpdate(ticket.id, { 
                            priority: e.target.value as TicketPriority
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
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
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
          <div className="border-t border-border bg-muted/50 px-6 py-4">
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
                {Object.entries(computedValues.stats?.tickets_by_priority || { }).map(([priority, count]) => {
                  const priInfo = TICKET_PRIORITIES.find(p => p.value === priority);
                  return (
                    <div key={priority} className="flex items-center justify-between">
                      <Badge variant={getTicketPriorityVariant(priority)}>
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
    </Container>
  );
}