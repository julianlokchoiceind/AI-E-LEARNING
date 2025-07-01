/**
 * Support ticket API client
 */
import { apiClient } from './api-client';
import { StandardResponse } from '@/types/api';
import type {
  SupportTicket,
  TicketWithMessages,
  TicketCreateData,
  TicketUpdateData,
  MessageCreateData,
  TicketSearchParams,
  SatisfactionRatingData,
  TicketStats
} from '@/lib/types/support';

// Remove API_BASE_URL as apiClient already handles the base URL

export const supportAPI = {
  /**
   * Create a new support ticket
   */
  async createTicket(data: TicketCreateData): Promise<StandardResponse<SupportTicket>> {
    return apiClient.post<StandardResponse<SupportTicket>>('/support/tickets', data);
  },

  /**
   * Get tickets with filtering and pagination
   */
  async getTickets(params?: TicketSearchParams): Promise<StandardResponse<{
    items: SupportTicket[];
    total_count: number;
    total_pages: number;
    page: number;
    per_page: number;
  }>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    return apiClient.get<StandardResponse<{
      items: SupportTicket[];
      total_count: number;
      total_pages: number;
      page: number;
      per_page: number;
    }>>(`/support/tickets?${queryParams.toString()}`);
  },

  /**
   * Get ticket statistics
   */
  async getTicketStats(): Promise<StandardResponse<TicketStats>> {
    return apiClient.get<StandardResponse<TicketStats>>('/support/tickets/stats');
  },

  /**
   * Get a specific ticket with messages
   */
  async getTicket(ticketId: string): Promise<StandardResponse<TicketWithMessages>> {
    return apiClient.get<StandardResponse<TicketWithMessages>>(`/support/tickets/${ticketId}`);
  },

  /**
   * Update a ticket
   */
  async updateTicket(ticketId: string, data: TicketUpdateData): Promise<StandardResponse<SupportTicket>> {
    return apiClient.put<StandardResponse<SupportTicket>>(`/support/tickets/${ticketId}`, data);
  },

  /**
   * Close a ticket
   */
  async closeTicket(ticketId: string): Promise<StandardResponse<SupportTicket>> {
    return apiClient.post<StandardResponse<SupportTicket>>(`/support/tickets/${ticketId}/close`, {});
  },

  /**
   * Reopen a ticket
   */
  async reopenTicket(ticketId: string): Promise<StandardResponse<SupportTicket>> {
    return apiClient.post<StandardResponse<SupportTicket>>(`/support/tickets/${ticketId}/reopen`, {});
  },

  /**
   * Add a message to a ticket
   */
  async addMessage(ticketId: string, data: MessageCreateData): Promise<StandardResponse<TicketWithMessages>> {
    return apiClient.post<StandardResponse<TicketWithMessages>>(`/support/tickets/${ticketId}/messages`, data);
  },

  /**
   * Upload attachment to a ticket
   */
  async uploadAttachment(ticketId: string, file: File): Promise<StandardResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.upload<StandardResponse<{ url: string }>>(
      `/support/tickets/${ticketId}/attachments`,
      formData
    );
  },

  /**
   * Rate ticket satisfaction
   */
  async rateTicket(ticketId: string, data: SatisfactionRatingData): Promise<StandardResponse<any>> {
    return apiClient.post<StandardResponse<any>>(`/support/tickets/${ticketId}/rate`, data);
  },

  /**
   * Get knowledge base articles
   */
  async getKnowledgeBase(query?: string): Promise<StandardResponse<any>> {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    return apiClient.get<StandardResponse<any>>(`/support/knowledge-base${params}`);
  },

  /**
   * Admin: Get all tickets
   */
  async getAllTickets(params?: TicketSearchParams): Promise<StandardResponse<{
    items: SupportTicket[];
    total_count: number;
    total_pages: number;
    page: number;
    per_page: number;
  }>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    return apiClient.get<StandardResponse<{
      items: SupportTicket[];
      total_count: number;
      total_pages: number;
      page: number;
      per_page: number;
    }>>(`/support/admin/tickets?${queryParams.toString()}`);
  },

  /**
   * Admin: Assign ticket to agent
   */
  async assignTicket(ticketId: string, agentId: string): Promise<StandardResponse<SupportTicket>> {
    return apiClient.post<StandardResponse<SupportTicket>>(`/support/admin/tickets/${ticketId}/assign`, {
      agent_id: agentId
    });
  },

  /**
   * Admin: Update ticket priority
   */
  async updatePriority(
    ticketId: string,
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): Promise<StandardResponse<SupportTicket>> {
    return apiClient.post<StandardResponse<SupportTicket>>(`/support/admin/tickets/${ticketId}/priority`, {
      priority
    });
  },
};