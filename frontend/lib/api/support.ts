/**
 * Support ticket API client
 */
import { apiClient } from './api-client';
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const supportAPI = {
  /**
   * Create a new support ticket
   */
  async createTicket(data: TicketCreateData): Promise<SupportTicket> {
    return apiClient.post(`${API_BASE_URL}/support/tickets`, data);
  },

  /**
   * Get tickets with filtering and pagination
   */
  async getTickets(params?: TicketSearchParams): Promise<{
    items: SupportTicket[];
    total_count: number;
    total_pages: number;
    page: number;
    per_page: number;
  }> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    return apiClient.get(
      `${API_BASE_URL}/support/tickets?${queryParams.toString()}`
    );
  },

  /**
   * Get ticket statistics
   */
  async getTicketStats(): Promise<TicketStats> {
    return apiClient.get(`${API_BASE_URL}/support/tickets/stats`);
  },

  /**
   * Get a specific ticket with messages
   */
  async getTicket(ticketId: string): Promise<TicketWithMessages> {
    return apiClient.get(`${API_BASE_URL}/support/tickets/${ticketId}`);
  },

  /**
   * Update a ticket
   */
  async updateTicket(ticketId: string, data: TicketUpdateData): Promise<SupportTicket> {
    return apiClient.put(`${API_BASE_URL}/support/tickets/${ticketId}`, data);
  },

  /**
   * Close a ticket
   */
  async closeTicket(ticketId: string): Promise<SupportTicket> {
    return apiClient.post(`${API_BASE_URL}/support/tickets/${ticketId}/close`);
  },

  /**
   * Reopen a ticket
   */
  async reopenTicket(ticketId: string): Promise<SupportTicket> {
    return apiClient.post(`${API_BASE_URL}/support/tickets/${ticketId}/reopen`);
  },

  /**
   * Add a message to a ticket
   */
  async addMessage(ticketId: string, data: MessageCreateData): Promise<TicketWithMessages> {
    return apiClient.post(`${API_BASE_URL}/support/tickets/${ticketId}/messages`, data);
  },

  /**
   * Upload attachment to a ticket
   */
  async uploadAttachment(ticketId: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.upload(
      `${API_BASE_URL}/support/tickets/${ticketId}/attachments`,
      formData
    );
  },

  /**
   * Rate ticket satisfaction
   */
  async rateTicket(ticketId: string, data: SatisfactionRatingData): Promise<void> {
    await apiClient.post(`${API_BASE_URL}/support/tickets/${ticketId}/rate`, data);
  },

  /**
   * Get knowledge base articles
   */
  async getKnowledgeBase(query?: string) {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    const response = await fetch(`${API_BASE_URL}/support/knowledge-base${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch knowledge base');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Admin: Get all tickets
   */
  async getAllTickets(params?: TicketSearchParams) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    return apiClient.get(`${API_BASE_URL}/support/admin/tickets?${queryParams.toString()}`);
  },

  /**
   * Admin: Assign ticket to agent
   */
  async assignTicket(ticketId: string, agentId: string): Promise<SupportTicket> {
    return apiClient.post(`${API_BASE_URL}/support/admin/tickets/${ticketId}/assign`, {
      agent_id: agentId
    });
  },

  /**
   * Admin: Update ticket priority
   */
  async updatePriority(
    ticketId: string,
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): Promise<SupportTicket> {
    return apiClient.post(`${API_BASE_URL}/support/admin/tickets/${ticketId}/priority`, {
      priority
    });
  },
};