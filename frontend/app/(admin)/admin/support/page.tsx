'use client';

import React, { useState } from 'react';
import { 
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  TrendingUp,
  Users,
  BarChart3
} from 'lucide-react';
import { ToastService } from '@/lib/toast/ToastService';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner, EmptyState, SupportTicketsTableSkeleton } from '@/components/ui/LoadingStates';
import { 
  useSupportTicketsQuery, 
  useSupportStatsQuery, 
  useUpdateSupportTicket 
} from '@/hooks/queries/useSupport';
import {
  SupportTicket,
  TicketStats,
  TicketSearchParams,
  TicketUpdateData,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES
} from '@/lib/types/support';
import { Pagination } from '@/components/ui/Pagination';

export default function AdminSupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // React Query hooks for data fetching
  const { 
    data: ticketsResponse, 
    loading: ticketsLoading,
    error: ticketsError 
  } = useSupportTicketsQuery({
    search: searchQuery,
    status: filters.status as any || undefined,
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

  const tickets = ticketsResponse?.data?.items || [];
  const totalPages = ticketsResponse?.data?.total_pages || 1;
  const totalItems = ticketsResponse?.data?.total || 0;
  const stats = statsResponse?.data;

  // Debug logging
  React.useEffect(() => {
    console.log('🎫 Debug - Tickets Response FULL:', JSON.stringify(ticketsResponse, null, 2));
    console.log('🎫 Debug - Tickets Array:', tickets);
    console.log('🎫 Debug - Total Items:', totalItems);
    console.log('🎫 Debug - Tickets Length:', tickets.length);
    console.log('🎫 Debug - ticketsResponse?.data:', ticketsResponse?.data);
    if (ticketsResponse?.data) {
      console.log('🎫 Debug - Response Keys:', Object.keys(ticketsResponse.data));
    }
    console.log('🎫 Debug - Tickets Loading:', ticketsLoading);
    console.log('🎫 Debug - Tickets Error:', ticketsError);
    console.log('🔍 Debug - Stats Response:', statsResponse);
    console.log('🔍 Debug - Stats Data:', stats);
    console.log('🔍 Debug - Stats Loading:', statsLoading);
    console.log('🔍 Debug - Stats Error:', statsError);
  }, [ticketsResponse, tickets, totalItems, ticketsLoading, ticketsError, statsResponse, stats, statsLoading, statsError]);

  const handleQuickUpdate = async (ticketId: string, update: TicketUpdateData) => {
    try {
      await updateTicketMutation.mutateAsync({ ticketId, data: update as any });
      ToastService.success('Ticket updated successfully');
    } catch (error: any) {
      ToastService.error(error.message || 'Something went wrong');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Safe stat getters with fallbacks
  const getTotalTickets = () => stats?.total_tickets ?? 0;
  const getOpenTickets = () => stats?.open_tickets ?? 0;
  const getAvgResponseTime = () => {
    if (stats?.avg_response_time_hours && stats.avg_response_time_hours > 0) {
      return `${stats.avg_response_time_hours.toFixed(1)}h`;
    }
    return '< 1h';
  };
  const getSatisfactionRating = () => {
    if (stats?.satisfaction_avg && stats.satisfaction_avg > 0) {
      return `${stats.satisfaction_avg.toFixed(1)}/5`;
    }
    return 'No Reviews';
  };

  // Filter change handlers - reset to page 1 when filters change
  const handleFilterChange = (newValue: string, filterType: 'search' | 'status' | 'priority' | 'category') => {
    setCurrentPage(1); // Reset to first page when filters change
    
    switch (filterType) {
      case 'search':
        setSearchQuery(newValue);
        break;
      case 'status':
        setFilters({ ...filters, status: newValue });
        break;
      case 'priority':
        setFilters({ ...filters, priority: newValue });
        break;
      case 'category':
        setFilters({ ...filters, category: newValue });
        break;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Ticket Management</h1>
          <p className="text-gray-600">Manage and respond to customer support tickets</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {statsLoading ? '...' : getTotalTickets()}
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
                {statsLoading ? '...' : getOpenTickets()}
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
                {statsLoading ? '...' : getAvgResponseTime()}
              </p>
              <p className="text-sm text-gray-600">Avg Response Time</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {statsLoading ? '...' : getSatisfactionRating()}
              </p>
              <p className="text-sm text-gray-600">Satisfaction</p>
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
          
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange(e.target.value, 'status')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Status</option>
            {TICKET_STATUSES.map(status => (
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
          <h2 className="text-lg font-semibold">
            Tickets ({totalItems})
          </h2>
        </div>

        {ticketsLoading ? (
          <SupportTicketsTableSkeleton />
        ) : tickets.length === 0 ? (
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
                {tickets.map((ticket: any) => {
                  const categoryInfo = TICKET_CATEGORIES.find(c => c.value === ticket.category);
                  
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">
                            {ticket.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            #{ticket.id.slice(-8)}
                          </p>
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
                          {categoryInfo?.label}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={ticket.priority}
                          onChange={(e) => handleQuickUpdate(ticket.id, { 
                            priority: e.target.value as any 
                          })}
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
                        <select
                          value={ticket.status}
                          onChange={(e) => handleQuickUpdate(ticket.id, { 
                            status: e.target.value as any 
                          })}
                          className="text-sm border rounded px-2 py-1"
                        >
                          {TICKET_STATUSES.map(s => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.created_at)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          size="sm"
                          onClick={() => window.location.href = `/support/${ticket.id}`}
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
        {totalPages > 1 && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              loading={ticketsLoading}
              showInfo={true}
              className="flex justify-center"
            />
          </div>
        )}
      </Card>

      {/* Category Distribution */}
      {stats && stats.tickets_by_category && Object.keys(stats.tickets_by_category).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Tickets by Category</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.tickets_by_category).map(([category, count]) => {
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
                {Object.entries(stats.tickets_by_priority || {}).map(([priority, count]) => {
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