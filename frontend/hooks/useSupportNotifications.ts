'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/api-client';

interface NotificationData {
  unreadCount: number;
  lastChecked: Date;
}

/**
 * Hook for polling support ticket notifications every 30 seconds.
 * Returns unread ticket count for displaying notification badge.
 */
export function useSupportNotifications() {
  const { isAuthenticated, user } = useAuth();
  const [data, setData] = useState<NotificationData>({
    unreadCount: 0,
    lastChecked: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use existing support tickets endpoint to get user's open tickets
      const response = await apiClient.get('/support/tickets', {
        params: {
          status: 'open', // Only get unresolved tickets
          per_page: 50, // Get more tickets to properly count unread ones
          page: 1
        }
      });

      if (response.data?.success) {
        const ticketsData = response.data.data;
        // Count tickets that haven't been responded to by support yet
        // or tickets where user's last message is newer than support's last message
        const tickets = ticketsData?.items || []; // Use 'items' from pagination response
        const unreadCount = tickets.filter((ticket: any) => {
          // New ticket with no responses from support
          if (ticket.response_count === 0) return true;
          
          // Ticket where user messaged after support's last response
          if (ticket.last_user_message_at && ticket.last_support_message_at) {
            return new Date(ticket.last_user_message_at) > new Date(ticket.last_support_message_at);
          }
          
          // Ticket with user messages but no support response
          return ticket.last_user_message_at && !ticket.last_support_message_at;
        }).length;

        setData({
          unreadCount,
          lastChecked: new Date()
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch support notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Poll every 30 seconds as specified in the plan
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Fetch immediately on mount
    fetchUnreadCount();

    // Set up polling interval (30 seconds)
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30 * 1000); // 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, fetchUnreadCount]);

  // Manually refresh notifications (can be called when user creates new ticket)
  const refresh = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    unreadCount: data.unreadCount,
    lastChecked: data.lastChecked,
    isLoading,
    error,
    refresh
  };
}

export default useSupportNotifications;