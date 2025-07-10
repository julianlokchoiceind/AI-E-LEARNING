'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { ToastService } from '@/lib/toast/ToastService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import {
  SupportTicket,
  TicketCreateData,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES
} from '@/lib/types/support';
import {
  useSupportTicketsQuery,
  useCreateSupportTicket
} from '@/hooks/queries/useSupport';

export default function SupportPage() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<TicketCreateData>({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
  });

  // React Query hooks for support data - replaces manual API calls
  const { 
    data: ticketsResponse, 
    loading, 
    error 
  } = useSupportTicketsQuery({
    search: searchQuery,
    status: selectedStatus as any || undefined,
    page: currentPage,
    limit: 10
  });

  const { mutate: createTicket, loading: isCreating } = useCreateSupportTicket();

  // Extract data from React Query responses
  const tickets = ticketsResponse?.data?.items || [];
  const totalPages = ticketsResponse?.data?.total_pages || 1;

  // ✅ React Query automatically handles data fetching when dependencies change

  const handleCreateTicket = () => {
    createTicket({
      ...formData,
      priority: formData.priority || 'medium' // Default to medium priority
    }, {
      onSuccess: (response) => {
        ToastService.success(response.message || 'Something went wrong');
        setShowCreateModal(false);
        resetForm();
        // React Query automatically invalidates and refetches tickets list
      },
      onError: (error: any) => {
        ToastService.error(error.message || 'Something went wrong');
      }
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'other',
      priority: 'medium',
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-2">Get help with any issues or questions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">All Status</option>
              {TICKET_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No support tickets yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create a ticket to get help from our support team
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket: any) => {
            const categoryInfo = TICKET_CATEGORIES.find(c => c.value === ticket.category);
            
            return (
              <Card 
                key={ticket.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.location.href = `/support/${ticket.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{categoryInfo?.icon}</span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {ticket.title}
                        </h3>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant={getStatusColor(ticket.status) as any}>
                          {TICKET_STATUSES.find(s => s.value === ticket.status)?.label}
                        </Badge>
                        
                        <Badge variant={getPriorityColor(ticket.priority) as any}>
                          {TICKET_PRIORITIES.find(p => p.value === ticket.priority)?.label} Priority
                        </Badge>
                        
                        <span className="text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(ticket.created_at)}
                        </span>
                        
                        <span className="text-gray-500 flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {ticket.response_count} messages
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {ticket.status === 'resolved' ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : ticket.status === 'waiting_for_user' ? (
                        <AlertCircle className="h-6 w-6 text-purple-500" />
                      ) : (
                        <Clock className="h-6 w-6 text-blue-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
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

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create Support Ticket"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-md"
            >
              {TICKET_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-md"
            >
              {TICKET_PRIORITIES.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please provide detailed information about your issue..."
              className="w-full px-3 py-2 border rounded-md min-h-[150px]"
              rows={6}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTicket}
              disabled={!formData.title || !formData.description}
            >
              Create Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}