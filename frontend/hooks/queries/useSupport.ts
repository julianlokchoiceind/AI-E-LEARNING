'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { supportAPI } from '@/lib/api/support';
import { ToastService } from '@/lib/toast/ToastService';
import type { TicketCategory, TicketStatus, TicketPriority } from '@/lib/types/support';

// Types for support ticket queries
interface SupportTicketFilters {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignee?: string;
  category?: TicketCategory;
  page?: number;
  limit?: number;
}

interface SupportTicketCreateData {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  user_id?: string;
}

interface SupportTicketUpdateData {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignee_id?: string;
  admin_response?: string;
}

/**
 * SUPPORT TICKETS LIST - Admin ticket management
 * Critical: Customer support workflow
 */
export function useSupportTicketsQuery(filters: SupportTicketFilters = {}) {
  const { 
    search = '', 
    status, 
    priority, 
    assignee, 
    category, 
    page = 1, 
    limit = 20 
  } = filters;
  
  return useApiQuery(
    ['support-tickets', { search, status, priority, assignee, category, page, limit }],
    () => supportAPI.getTickets({ 
      q: search, 
      status, 
      priority, 
      category, 
      page, 
      per_page: limit 
    }),
    getCacheConfig('SUPPORT_TICKETS') // Support tickets - fresh data
  );
}

/**
 * CREATE SUPPORT TICKET - User creates new ticket
 * High-impact: Customer support entry point
 */
export function useCreateSupportTicket() {
  return useApiMutation(
    (ticketData: SupportTicketCreateData) => supportAPI.createTicket(ticketData),
    {
      invalidateQueries: [
        ['support-tickets'], // Refresh tickets list
        ['support-stats'], // Update support statistics
      ],
    }
  );
}

/**
 * UPDATE SUPPORT TICKET - Edit ticket details with optimistic update
 * Critical: Support management
 */
export function useUpdateSupportTicket() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: SupportTicketUpdateData }) => 
      supportAPI.updateTicket(ticketId, data),
    
    // Optimistic update - Update UI immediately
    onMutate: async ({ ticketId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['support-tickets'] });
      await queryClient.cancelQueries({ queryKey: ['support-ticket', ticketId] });
      
      // Snapshot previous values
      const previousTickets = queryClient.getQueryData(['support-tickets']);
      const previousTicket = queryClient.getQueryData(['support-ticket', ticketId]);
      
      // Optimistically update ticket in list
      queryClient.setQueryData(['support-tickets'], (old: any) => {
        if (!old) return old;
        
        // Handle different data structures
        const tickets = old?.data?.tickets || old?.tickets || [];
        const updatedTickets = tickets.map((ticket: any) => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              ...data,
              updated_at: new Date().toISOString()
            };
          }
          return ticket;
        });
        
        // Maintain same structure
        if (old?.data?.tickets) {
          return {
            ...old,
            data: {
              ...old.data,
              tickets: updatedTickets
            }
          };
        }
        
        return {
          ...old,
          tickets: updatedTickets
        };
      });
      
      // Also update single ticket query if it exists
      queryClient.setQueryData(['support-ticket', ticketId], (old: any) => {
        if (!old) return old;
        
        const ticket = old?.data || old;
        return {
          ...old,
          data: {
            ...ticket,
            ...data,
            updated_at: new Date().toISOString()
          }
        };
      });
      
      return { previousTickets, previousTicket, ticketId };
    },
    
    // Rollback on error
    onError: (error: any, variables, context: any) => {
      if (context?.previousTickets) {
        queryClient.setQueryData(['support-tickets'], context.previousTickets);
      }
      if (context?.previousTicket && context?.ticketId) {
        queryClient.setQueryData(['support-ticket', context.ticketId], context.previousTicket);
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: (data: any, error: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (data: { ticketId: string; data: SupportTicketUpdateData }, options?: any) => {
      mutation.mutate(data, {
        onSuccess: (response) => {
          ToastService.success(response?.message || 'Ticket updated successfully', 'update-ticket');
          options?.onSuccess?.(response);
        },
        onError: (error: any) => {
          ToastService.error(error?.message || 'Failed to update ticket', 'update-ticket-error');
          options?.onError?.(error);
        }
      });
    },
    mutateAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}

/**
 * ASSIGN SUPPORT TICKET - Assign ticket to admin with optimistic update
 * Critical: Support workflow management
 */
export function useAssignSupportTicket() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: ({ ticketId, assigneeId }: { ticketId: string; assigneeId: string }) => 
      supportAPI.assignTicket(ticketId, assigneeId),
    
    // Optimistic update - Update UI immediately
    onMutate: async ({ ticketId, assigneeId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['support-tickets'] });
      
      // Snapshot previous value
      const previousTickets = queryClient.getQueryData(['support-tickets']);
      
      // Optimistically update ticket assignment
      queryClient.setQueryData(['support-tickets'], (old: any) => {
        if (!old) return old;
        
        // Handle different data structures
        const tickets = old?.data?.tickets || old?.tickets || [];
        const updatedTickets = tickets.map((ticket: any) => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              assignee_id: assigneeId,
              status: 'in_progress' // Usually assignment changes status
            };
          }
          return ticket;
        });
        
        // Maintain same structure
        if (old?.data?.tickets) {
          return {
            ...old,
            data: {
              ...old.data,
              tickets: updatedTickets
            }
          };
        }
        
        return {
          ...old,
          tickets: updatedTickets
        };
      });
      
      return { previousTickets, ticketId, assigneeId };
    },
    
    // Rollback on error
    onError: (error: any, variables, context: any) => {
      if (context?.previousTickets) {
        queryClient.setQueryData(['support-tickets'], context.previousTickets);
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (data: { ticketId: string; assigneeId: string }, options?: any) => {
      mutation.mutate(data, {
        onSuccess: (response) => {
          ToastService.success(response?.message || 'Ticket assigned successfully', 'assign-ticket');
          options?.onSuccess?.(response);
        },
        onError: (error: any) => {
          ToastService.error(error?.message || 'Failed to assign ticket', 'assign-ticket-error');
          options?.onError?.(error);
        }
      });
    },
    mutateAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}

/**
 * RESOLVE SUPPORT TICKET - Mark ticket as resolved with optimistic update
 * Critical: Support completion workflow
 */
export function useResolveSupportTicket() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: ({ ticketId, resolution }: { ticketId: string; resolution: string }) => 
      supportAPI.updateTicket(ticketId, { status: 'resolved', resolution_note: resolution }),
    
    // Optimistic update - Update UI immediately
    onMutate: async ({ ticketId, resolution }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['support-tickets'] });
      
      // Snapshot previous value
      const previousTickets = queryClient.getQueryData(['support-tickets']);
      
      // Optimistically update ticket status
      queryClient.setQueryData(['support-tickets'], (old: any) => {
        if (!old) return old;
        
        // Handle different data structures
        const tickets = old?.data?.tickets || old?.tickets || [];
        const updatedTickets = tickets.map((ticket: any) => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              status: 'resolved',
              resolution_note: resolution,
              resolved_at: new Date().toISOString()
            };
          }
          return ticket;
        });
        
        // Maintain same structure
        if (old?.data?.tickets) {
          return {
            ...old,
            data: {
              ...old.data,
              tickets: updatedTickets
            }
          };
        }
        
        return {
          ...old,
          tickets: updatedTickets
        };
      });
      
      return { previousTickets, ticketId };
    },
    
    // Rollback on error
    onError: (error: any, variables, context: any) => {
      if (context?.previousTickets) {
        queryClient.setQueryData(['support-tickets'], context.previousTickets);
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (data: { ticketId: string; resolution: string }, options?: any) => {
      mutation.mutate(data, {
        onSuccess: (response) => {
          ToastService.success(response?.message || 'Ticket resolved successfully', 'resolve-ticket');
          options?.onSuccess?.(response);
        },
        onError: (error: any) => {
          ToastService.error(error?.message || 'Failed to resolve ticket', 'resolve-ticket-error');
          options?.onError?.(error);
        }
      });
    },
    mutateAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}

/**
 * DELETE SUPPORT TICKET - Remove ticket (admin only) with optimistic update
 * Medium-impact: Support management
 */
export function useDeleteSupportTicket() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: (ticketId: string) => supportAPI.updateTicket(ticketId, { status: 'closed' }),
    
    // Optimistic update - Update UI immediately
    onMutate: async (ticketId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['support-tickets'] });
      
      // Snapshot previous value
      const previousTickets = queryClient.getQueryData(['support-tickets']);
      
      // Optimistically remove ticket from list
      queryClient.setQueryData(['support-tickets'], (old: any) => {
        if (!old) return old;
        
        // Handle different data structures
        const tickets = old?.data?.tickets || old?.tickets || [];
        const filteredTickets = tickets.filter((ticket: any) => {
          const id = ticket.id;
          return id !== ticketId;
        });
        
        // Maintain same structure
        if (old?.data?.tickets) {
          return {
            ...old,
            data: {
              ...old.data,
              tickets: filteredTickets,
              total: filteredTickets.length
            }
          };
        }
        
        return {
          ...old,
          tickets: filteredTickets,
          total: filteredTickets.length
        };
      });
      
      return { previousTickets, ticketId };
    },
    
    // Rollback on error
    onError: (error: any, ticketId: string, context: any) => {
      if (context?.previousTickets) {
        queryClient.setQueryData(['support-tickets'], context.previousTickets);
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (ticketId: string, options?: any) => {
      mutation.mutate(ticketId, {
        onSuccess: (response) => {
          ToastService.success(response?.message || 'Ticket closed successfully', 'delete-ticket');
          options?.onSuccess?.(response);
        },
        onError: (error: any) => {
          ToastService.error(error?.message || 'Failed to close ticket', 'delete-ticket-error');
          options?.onError?.(error);
        }
      });
    },
    mutateAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}

/**
 * SUPPORT STATISTICS - Overview metrics for admin
 * High-impact: Support performance tracking
 */
export function useSupportStatsQuery() {
  return useApiQuery(
    ['support-stats'],
    () => supportAPI.getTicketStats(),
    getCacheConfig('SUPPORT_STATS') // Support statistics - moderate freshness
  );
}

/**
 * SUPPORT TICKET BY ID - Get specific ticket details
 * High-impact: Ticket detail view
 */
export function useSupportTicketQuery(ticketId: string, enabled: boolean = true) {
  return useApiQuery(
    ['support-ticket', ticketId],
    () => supportAPI.getTicket(ticketId),
    {
      enabled: enabled && !!ticketId,
      ...getCacheConfig('SUPPORT_TICKET_DETAILS') // Ticket details - fresh data
    }
  );
}

/**
 * SUPPORT CATEGORIES - Get ticket categories
 * Medium-impact: Ticket organization
 */
export function useSupportCategoriesQuery() {
  return useApiQuery(
    ['support-categories'],
    async () => {
      // Static categories or fetch from API
      const categories = [
        'Technical Issue',
        'Billing Question',
        'Course Content',
        'Account Access',
        'Feature Request',
        'Bug Report',
        'General Inquiry'
      ];
      return { success: true, data: { categories }, message: 'Support categories retrieved successfully' };
    },
    getCacheConfig('SUPPORT_CATEGORIES') // Support categories - stable content
  );
}

/**
 * USER SUPPORT TICKETS - Get tickets for specific user
 * Medium-impact: User support history
 */
export function useUserSupportTicketsQuery(userId: string, enabled: boolean = true) {
  return useApiQuery(
    ['user-support-tickets', userId],
    () => supportAPI.getTickets({ user_id: userId, per_page: 100 }),
    {
      enabled: enabled && !!userId,
      ...getCacheConfig('USER_SUPPORT_TICKETS') // User tickets - moderate freshness
    }
  );
}

/**
 * CREATE SUPPORT MESSAGE - Add message to ticket
 * High-impact: Support communication
 */
export function useCreateSupportMessage() {
  return useApiMutation(
    ({ ticketId, messageData }: { ticketId: string; messageData: any }) => 
      supportAPI.addMessage(ticketId, messageData),
    {
      invalidateQueries: [
        ['support-ticket'], // Refresh specific ticket
        ['support-tickets'], // Refresh tickets list
      ],
    }
  );
}

/**
 * RATE SUPPORT TICKET - Submit satisfaction rating
 * Medium-impact: Support quality tracking
 */
export function useRateSupportTicket() {
  return useApiMutation(
    ({ ticketId, ratingData }: { ticketId: string; ratingData: any }) => 
      supportAPI.rateTicket(ticketId, ratingData),
    {
      invalidateQueries: [
        ['support-ticket'], // Refresh specific ticket
        ['support-stats'], // Update satisfaction statistics
      ],
    }
  );
}

/**
 * SUPPORT BULK ACTIONS - Bulk operations on tickets
 * Medium-impact: Admin efficiency
 */
export function useBulkSupportActions() {
  return useApiMutation(
    async ({ action, ticketIds, data }: { 
      action: 'assign' | 'resolve' | 'close' | 'delete'; 
      ticketIds: string[];
      data?: any;
    }) => {
      // Implementation would depend on backend bulk API
      const results = await Promise.all(
        ticketIds.map(id => {
          switch (action) {
            case 'assign':
              return supportAPI.assignTicket(id, data.assigneeId);
            case 'resolve':
              return supportAPI.updateTicket(id, { status: 'resolved', resolution_note: data.resolution });
            case 'close':
              return supportAPI.updateTicket(id, { status: 'closed' });
            case 'delete':
              return supportAPI.updateTicket(id, { status: 'closed' });
            default:
              throw new Error('Invalid bulk action');
          }
        })
      );
      
      // Wrap results in StandardResponse format
      return {
        success: true,
        data: { affected_count: results.length, results },
        message: `Successfully ${action}ed ${results.length} ticket(s)`
      };
    },
    {
      invalidateQueries: [
        ['support-tickets'], // Refresh tickets list
        ['support-stats'], // Update statistics
      ],
    }
  );
}