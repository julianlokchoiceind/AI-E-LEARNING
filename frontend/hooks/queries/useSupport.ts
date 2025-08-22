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
    {
      ...getCacheConfig('SUPPORT_TICKETS'), // Support tickets - fresh data
      keepPreviousData: true, // Smooth filter transitions
    }
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
        ['admin-support-tickets'], // Refresh admin table - prefix matching
        ['support-stats'], // Update support statistics
        ['support-notifications'], // Update badge count immediately
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
        ['admin-support-tickets'], // Refresh admin tickets list
        ['support-tickets'], // Refresh tickets list
        ['support-ticket', 'ticketId'], // Refresh specific ticket
        ['support-stats'], // Update support statistics
        ['support-notifications'], // Update badge count immediately
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
        ['admin-support-tickets'], // Refresh admin table
        ['support-notifications'], // Update badge count immediately
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
      action: 'assign' | 'close' | 'delete'; 
      ticketIds: string[];
      data?: any;
    }) => {
      // Implementation would depend on backend bulk API
      const results = await Promise.all(
        ticketIds.map(id => {
          switch (action) {
            case 'assign':
              return supportAPI.assignTicket(id, data.assigneeId);
            case 'close':
              return supportAPI.closeTicket(id);
            case 'delete':
              return supportAPI.closeTicket(id); // Delete = Close for now
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
        ['admin-support-tickets'], // Refresh admin table
        ['support-stats'], // Update statistics
        ['support-notifications'], // Update badge count immediately
      ],
    }
  );
}

/**
 * MARK TICKET AS VIEWED - Update viewed timestamps for notifications
 * High-impact: Badge count accuracy
 */
export function useMarkTicketViewed() {
  return useApiMutation(
    (ticketId: string) => supportAPI.markTicketViewed(ticketId),
    {
      operationName: 'mark-ticket-viewed',
      showToast: false, // Silent operation
      invalidateQueries: [
        ['support-notifications'], // Update badge count immediately
        ['support-ticket'], // Refresh specific ticket if needed
        ['admin-support-tickets'], // Refresh admin table
      ],
    }
  );
}

/**
 * ADMIN SUPPORT TICKETS - Admin view with all tickets and show_unread filter
 * Critical: Admin support management workflow
 */
export function useAdminSupportTicketsQuery(filters: SupportTicketFilters = {}) {
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
    ['admin-support-tickets', { search, status, priority, assignee, category, page, limit }],
    () => supportAPI.getTickets({ 
      q: search, 
      status,  // Backend handles "unread" as virtual status
      priority, 
      category, 
      page, 
      per_page: limit 
    }),
    {
      ...getCacheConfig('SUPPORT_TICKETS'), // Support tickets - fresh data
      keepPreviousData: true, // Smooth filter transitions
    }
  );
}

/**
 * CLOSE SUPPORT TICKET - Use dedicated close endpoint
 * High-impact: Proper ticket closure with timestamps
 */
export function useCloseSupportTicket() {
  return useApiMutation(
    (ticketId: string) => supportAPI.closeTicket(ticketId),
    {
      operationName: 'close-ticket',
      invalidateQueries: [
        ['admin-support-tickets'], // Refresh admin tickets list
        ['support-tickets'], // Refresh user tickets list
        ['support-notifications'], // Update badge count
        ['support-ticket'], // Refresh specific ticket
      ],
    }
  );
}

/**
 * REOPEN SUPPORT TICKET - Use dedicated reopen endpoint
 * High-impact: Proper ticket reopening with timestamp updates
 */
export function useReopenSupportTicket() {
  return useApiMutation(
    (ticketId: string) => supportAPI.reopenTicket(ticketId),
    {
      operationName: 'reopen-ticket',
      invalidateQueries: [
        ['admin-support-tickets'], // Refresh admin tickets list
        ['support-tickets'], // Refresh user tickets list
        ['support-notifications'], // Update badge count
        ['support-ticket'], // Refresh specific ticket
      ],
    }
  );
}