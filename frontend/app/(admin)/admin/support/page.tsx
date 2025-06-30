'use client';

import React, { useState, useEffect } from 'react';
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
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { supportAPI } from '@/lib/api/support';
import {
  SupportTicket,
  TicketStats,
  TicketSearchParams,
  TicketUpdateData,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES
} from '@/lib/types/support';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch tickets and stats
  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [searchQuery, filters, currentPage]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params: TicketSearchParams = {
        q: searchQuery || undefined,
        status: filters.status as any || undefined,
        priority: filters.priority as any || undefined,
        category: filters.category as any || undefined,
        page: currentPage,
        per_page: 20,
        sort_by: 'created_at',
        sort_order: 'desc',
      };

      const response = await supportAPI.getTickets(params);
      setTickets(response.items);
      setTotalPages(response.total_pages);
    } catch (error: any) {
      console.error('Failed to fetch tickets:', error);
      toast.error(error.message || 'Operation Failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await supportAPI.getTicketStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleQuickUpdate = async (ticketId: string, update: TicketUpdateData) => {
    try {
      const response = await supportAPI.updateTicket(ticketId, update);
      toast.success(response.message || 'Operation Failed');
      fetchTickets(); // Refresh list
    } catch (error: any) {
      console.error('Failed to update ticket:', error);
      toast.error(error.message || 'Operation Failed');
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

  const getStatusColor = (status: string) => {
    const statusInfo = TICKET_STATUSES.find(s => s.value === status);
    return statusInfo?.color || 'gray';
  };

  const getPriorityColor = (priority: string) => {
    const priorityInfo = TICKET_PRIORITIES.find(p => p.value === priority);
    return priorityInfo?.color || 'gray';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Support Ticket Management</h1>
        <p className="text-gray-600">Manage and respond to customer support tickets</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold">{stats.total_tickets}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Open Tickets</p>
                  <p className="text-2xl font-bold">{stats.open_tickets}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold">
                    {stats.avg_response_time_hours 
                      ? `${stats.avg_response_time_hours.toFixed(1)}h`
                      : 'N/A'}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Satisfaction</p>
                  <p className="text-2xl font-bold">
                    {stats.satisfaction_avg 
                      ? `${stats.satisfaction_avg.toFixed(1)}/5`
                      : 'N/A'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">All Status</option>
              {TICKET_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">All Priority</option>
              {TICKET_PRIORITIES.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
            
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">All Categories</option>
              {TICKET_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-left font-medium text-gray-700">Ticket</th>
                    <th className="p-4 text-left font-medium text-gray-700">User</th>
                    <th className="p-4 text-left font-medium text-gray-700">Category</th>
                    <th className="p-4 text-left font-medium text-gray-700">Priority</th>
                    <th className="p-4 text-left font-medium text-gray-700">Status</th>
                    <th className="p-4 text-left font-medium text-gray-700">Created</th>
                    <th className="p-4 text-left font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tickets.map((ticket) => {
                    const categoryInfo = TICKET_CATEGORIES.find(c => c.value === ticket.category);
                    
                    return (
                      <tr key={ticket._id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {ticket.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              #{ticket._id.slice(-8)}
                            </p>
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <div>
                            <p className="text-sm font-medium">{ticket.user_name}</p>
                            <p className="text-xs text-gray-500">{ticket.user_email}</p>
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <span className="text-sm">
                            {categoryInfo?.icon} {categoryInfo?.label}
                          </span>
                        </td>
                        
                        <td className="p-4">
                          <select
                            value={ticket.priority}
                            onChange={(e) => handleQuickUpdate(ticket._id, { 
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
                        
                        <td className="p-4">
                          <select
                            value={ticket.status}
                            onChange={(e) => handleQuickUpdate(ticket._id, { 
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
                        
                        <td className="p-4 text-sm text-gray-600">
                          {formatDate(ticket.created_at)}
                        </td>
                        
                        <td className="p-4">
                          <Button
                            size="sm"
                            onClick={() => window.location.href = `/support/${ticket._id}`}
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
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Category Distribution */}
      {stats && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        {catInfo?.icon} {catInfo?.label || category}
                      </span>
                      <span className="font-medium">{count}</span>
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
                {Object.entries(stats.tickets_by_priority).map(([priority, count]) => {
                  const priInfo = TICKET_PRIORITIES.find(p => p.value === priority);
                  return (
                    <div key={priority} className="flex items-center justify-between">
                      <Badge variant={priInfo?.color as any}>
                        {priInfo?.label || priority}
                      </Badge>
                      <span className="font-medium">{count}</span>
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