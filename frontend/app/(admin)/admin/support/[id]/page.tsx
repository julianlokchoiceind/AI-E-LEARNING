'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Shield,
  Star
} from 'lucide-react';
import { ToastService } from '@/lib/toast/ToastService';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { 
  useSupportTicketQuery,
  useCreateSupportMessage,
  useMarkTicketViewed,
} from '@/hooks/queries/useSupport';
import {
  TicketWithMessages,
  MessageCreateData,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES
} from '@/lib/types/support';

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const ticketId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasMarkedAsViewed = useRef(false);
  
  // React Query hooks for support ticket management
  const { 
    data: ticketResponse, 
    loading, 
    error: ticketError,
    refetch: refetchTicket 
  } = useSupportTicketQuery(ticketId);
  
  const { mutate: sendMessage, loading: sending } = useCreateSupportMessage();
  const { mutate: markAsViewed } = useMarkTicketViewed();
  
  const ticket = ticketResponse?.data || null;
  const [message, setMessage] = useState('');

  // Handle ticket error
  useEffect(() => {
    if (ticketError) {
      ToastService.error('Failed to load ticket');
      router.push('/admin/support');
    }
  }, [ticketError, router]);

  // Mark ticket as viewed when loaded (for notification system)
  useEffect(() => {
    if (ticketId && user?.id && !hasMarkedAsViewed.current) {
      hasMarkedAsViewed.current = true;
      markAsViewed(ticketId, {
        onError: (error) => {
          hasMarkedAsViewed.current = false; // Reset on error to allow retry
        }
      });
    }
  }, [ticketId, user?.id, markAsViewed]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const messageData: MessageCreateData = {
      message: message.trim(),
    };
    
    sendMessage(
      { ticketId, messageData },
      {
        onSuccess: (response) => {
          setMessage('');
          refetchTicket(); // Refresh to get new message
          // useApiMutation already handles toast notifications automatically
        }
      }
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  const categoryInfo = TICKET_CATEGORIES.find(c => c.value === ticket.category);
  const statusInfo = TICKET_STATUSES.find(s => s.value === ticket.status);
  const priorityInfo = TICKET_PRIORITIES.find(p => p.value === ticket.priority);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/support')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Support
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
              <Badge variant="outline" size="sm">Admin View</Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Badge variant={statusInfo?.color as any}>
                {statusInfo?.label}
              </Badge>
              
              <Badge variant={priorityInfo?.color as any}>
                {priorityInfo?.label} Priority
              </Badge>
              
              <span>Ticket #{ticket.id.slice(-8)}</span>
              
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Created {formatDate(ticket.created_at)}
              </span>

              <span>From: {ticket.user_name}</span>
            </div>
          </div>
          
          {ticket.satisfaction_rating && (
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < ticket.satisfaction_rating!
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">Customer Rating</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {ticket.messages.map((msg: any) => {
              const isSupport = msg.sender_role === 'support';
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      isSupport
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isSupport ? (
                        <Shield className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      <span className="font-medium">{msg.sender_name}</span>
                      <span className={`text-xs ${
                        isSupport ? 'text-red-100' : 'text-gray-500'
                      }`}>
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                    
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    
                    {msg.is_internal_note && (
                      <p className="text-xs mt-2 text-red-200 italic">
                        Internal Note
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          {ticket.status !== 'closed' && (
            <div className="border-t p-4">
              <div className="flex gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your admin response..."
                  className="flex-1 px-3 py-2 border rounded-md resize-none"
                  rows={3}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {ticket.status === 'closed' && (
            <div className="border-t p-4 text-center text-gray-600">
              This ticket has been closed. You can still add internal notes or reopen if needed.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution Note */}
      {ticket.resolution_note && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Resolution
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{ticket.resolution_note}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}