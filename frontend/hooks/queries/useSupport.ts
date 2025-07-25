'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { supportAPI } from '@/lib/api/support';
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
 * UPDATE SUPPORT TICKET - Edit ticket details
 * Critical: Support management
 */
export function useUpdateSupportTicket() {
  return useApiMutation(
    ({ ticketId, data }: { ticketId: string; data: SupportTicketUpdateData }) => 
      supportAPI.updateTicket(ticketId, data),
    {
      operationName: 'update-ticket',
      invalidateQueries: [
        ['support-tickets'], // Refresh tickets list
        ['support-ticket', 'ticketId'], // Refresh specific ticket
        ['support-stats'], // Update support statistics
      ],
    }
  );
}

/**
 * ASSIGN SUPPORT TICKET - Assign ticket to admin
 * Critical: Support workflow management
 */
export function useAssignSupportTicket() {
  return useApiMutation(
    ({ ticketId, assigneeId }: { ticketId: string; assigneeId: string }) => 
      supportAPI.assignTicket(ticketId, assigneeId),
    {
      operationName: 'assign-ticket',
      invalidateQueries: [
        ['support-tickets'], // Refresh tickets list
        ['support-stats'], // Update support statistics
      ],
    }
  );
}

/**
 * RESOLVE SUPPORT TICKET - Mark ticket as resolved
 * Critical: Support completion workflow
 */
export function useResolveSupportTicket() {
  return useApiMutation(
    ({ ticketId, resolution }: { ticketId: string; resolution: string }) => 
      supportAPI.updateTicket(ticketId, { status: 'resolved', resolution_note: resolution }),
    {
      operationName: 'resolve-ticket',
      invalidateQueries: [
        ['support-tickets'], // Refresh tickets list
        ['support-stats'], // Update support statistics
      ],
    }
  );
}

/**
 * DELETE SUPPORT TICKET - Remove ticket (admin only)
 * Medium-impact: Support management
 */
export function useDeleteSupportTicket() {
  return useApiMutation(
    (ticketId: string) => supportAPI.updateTicket(ticketId, { status: 'closed' }),
    {
      operationName: 'delete-ticket',
      invalidateQueries: [
        ['support-tickets'], // Refresh tickets list
        ['support-stats'], // Update support statistics
      ],
    }
  );
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