/**
 * Support ticket API client
 */
import { authFetch } from '@/lib/utils/auth-helpers';
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
    const response = await authFetch(`${API_BASE_URL}/support/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create ticket');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get tickets with filtering and pagination
   */
  async getTickets(params?: TicketSearchParams) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await authFetch(
      `${API_BASE_URL}/support/tickets?${queryParams.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch tickets');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get ticket statistics
   */
  async getTicketStats(): Promise<TicketStats> {
    const response = await authFetch(`${API_BASE_URL}/support/tickets/stats`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch ticket stats');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get a specific ticket with messages
   */
  async getTicket(ticketId: string, includeInternal = false): Promise<TicketWithMessages> {
    const queryParams = includeInternal ? '?include_internal=true' : '';
    const response = await authFetch(
      `${API_BASE_URL}/support/tickets/${ticketId}${queryParams}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch ticket');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Update a ticket (admin/support only)
   */
  async updateTicket(ticketId: string, data: TicketUpdateData): Promise<SupportTicket> {
    const response = await authFetch(`${API_BASE_URL}/support/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update ticket');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Add a message to a ticket
   */
  async addMessage(ticketId: string, data: MessageCreateData) {
    const response = await authFetch(
      `${API_BASE_URL}/support/tickets/${ticketId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to add message');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Rate ticket satisfaction
   */
  async rateTicket(ticketId: string, data: SatisfactionRatingData): Promise<SupportTicket> {
    const response = await authFetch(
      `${API_BASE_URL}/support/tickets/${ticketId}/rate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to rate ticket');
    }

    const result = await response.json();
    return result.data;
  },
};