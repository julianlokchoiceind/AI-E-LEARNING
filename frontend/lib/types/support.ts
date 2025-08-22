/**
 * Support ticket types and interfaces
 */

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'closed';
export type TicketCategory = 'technical' | 'billing' | 'course_content' | 'account' | 'feature_request' | 'bug_report' | 'other';

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'user' | 'support';
  message: string;
  attachments: string[];
  is_internal_note: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_at?: string;
  tags: string[];
  related_course_id?: string;
  related_order_id?: string;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  resolution_note?: string;
  response_count: number;
  last_user_message_at?: string;
  last_support_message_at?: string;
  viewed_by_admin_at?: string;
  last_admin_view_at?: string;
  viewed_by_user_at?: string;
  last_user_view_at?: string;
  is_unread?: boolean;  // NEW: Computed field from backend
  created_at: string;
  updated_at: string;
}

export interface TicketWithMessages extends SupportTicket {
  messages: TicketMessage[];
}

export interface TicketCreateData {
  title: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  related_course_id?: string;
  related_order_id?: string;
  attachments?: string[];
}

export interface TicketUpdateData {
  title?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigned_to?: string;
  tags?: string[];
  resolution_note?: string;
}

export interface MessageCreateData {
  message: string;
  attachments?: string[];
  is_internal_note?: boolean;
}

export interface TicketSearchParams {
  q?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
  sort_by?: 'created_at' | 'updated_at' | 'priority' | 'status';
  sort_order?: 'asc' | 'desc';
}

export interface TicketStats {
  total_tickets: number;
  open_tickets: number;
  closed_tickets: number;
  avg_response_time_hours?: number;
  avg_resolution_time_hours?: number;
  tickets_by_category: Record<string, number>;
  tickets_by_priority: Record<string, number>;
}

export const TICKET_CATEGORIES = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Billing & Payment' },
  { value: 'course_content', label: 'Course Content' },
  { value: 'account', label: 'Account & Profile' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'other', label: 'Other' },
] as const;

export const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'urgent', label: 'Urgent', color: 'red' },
] as const;

export const TICKET_STATUSES = [
  { value: 'open', label: 'Open', color: 'yellow' },
  { value: 'closed', label: 'Closed', color: 'gray' },
] as const;

export const TICKET_FILTER_OPTIONS = [
  { value: 'open', label: 'Open', color: 'yellow' },
  { value: 'closed', label: 'Closed', color: 'gray' },
  { value: 'unread', label: 'Unread', color: 'red' },  // Virtual status for filtering
] as const;