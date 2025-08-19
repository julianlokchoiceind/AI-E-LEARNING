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
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { 
  useSupportTicketQuery,
  useCreateSupportMessage,
  useRateSupportTicket
} from '@/hooks/queries/useSupport';
import {
  TicketWithMessages,
  MessageCreateData,
  SatisfactionRatingData,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES
} from '@/lib/types/support';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const ticketId = params.ticketId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // React Query hooks for support ticket management
  const { 
    data: ticketResponse, 
    loading, 
    error: ticketError,
    refetch: refetchTicket 
  } = useSupportTicketQuery(ticketId);
  
  const { mutate: sendMessage, loading: sending } = useCreateSupportMessage();
  const { mutate: rateTicket, loading: submittingRating } = useRateSupportTicket();
  
  const ticket = ticketResponse?.data || null;
  const [message, setMessage] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  // Handle ticket error
  useEffect(() => {
    if (ticketError) {
      ToastService.error('Failed to load ticket');
      router.push('/support');
    }
  }, [ticketError, router]);

  useEffect(() => {
    scrollToBottom();
    
    // Show rating modal if resolved and not rated
    if (ticket?.status === 'resolved' && !ticket.satisfaction_rating) {
      setShowRatingModal(true);
    }
  }, [ticket?.messages, ticket?.status, ticket?.satisfaction_rating]);


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
          ToastService.success(response.message || 'Something went wrong');
        },
        onError: (error: any) => {
          console.error('Failed to send message:', error);
          ToastService.error(error.message || 'Something went wrong');
        }
      }
    );
  };

  const handleRateTicket = () => {
    if (rating === 0) {
      ToastService.error('Please select a rating');
      return;
    }

    const ratingData: SatisfactionRatingData = {
      rating,
      comment: ratingComment.trim() || undefined,
    };
    
    rateTicket(
      { ticketId, ratingData },
      {
        onSuccess: (response) => {
          ToastService.success(response.message || 'Something went wrong');
          setShowRatingModal(false);
          refetchTicket(); // Refresh to show rating
        },
        onError: (error: any) => {
          console.error('Failed to rate ticket:', error);
          ToastService.error(error.message || 'Something went wrong');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/support')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Support
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
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
                  className={`flex ${isSupport ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      isSupport
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-blue-600 text-white'
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
                        isSupport ? 'text-gray-500' : 'text-blue-100'
                      }`}>
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                    
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    
                    {msg.is_internal_note && (
                      <p className="text-xs mt-2 text-gray-500 italic">
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
                  placeholder="Type your message..."
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
              This ticket has been closed. Create a new ticket if you need further assistance.
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

      {/* Rating Modal */}
      <Modal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title="Rate Your Support Experience"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            How satisfied are you with the resolution of your ticket?
          </p>
          
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className="p-2 hover:scale-110 transition-transform"
              >
                <Star
                  className={`h-8 w-8 ${
                    value <= rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Comments (Optional)
            </label>
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              className="w-full px-3 py-2 border rounded-md"
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setShowRatingModal(false)}
            >
              Skip
            </Button>
            <Button
              onClick={handleRateTicket}
              loading={submittingRating}
              disabled={rating === 0}
            >
              Submit Rating
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}