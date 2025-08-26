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
  FileText,
  FileArchive,
  Image as ImageIcon,
  Upload
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
  useMarkTicketViewed
} from '@/hooks/queries/useSupport';
import { supportAPI } from '@/lib/api/support';
import { useQueryClient } from '@tanstack/react-query';
import {
  TicketWithMessages,
  MessageCreateData,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES
} from '@/lib/types/support';
import { getAttachmentUrl, isImageFile } from '@/lib/utils/attachmentUrl';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ticketId = params.ticketId as string;
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Handle ticket error
  useEffect(() => {
    if (ticketError) {
      ToastService.error('Failed to load ticket');
      router.push('/support');
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


  const handleSendMessage = async () => {
    if (!message.trim() && selectedFiles.length === 0) return;

    // If there's text message, send it first
    if (message.trim()) {
      const messageData: MessageCreateData = {
        message: message.trim(),
        attachments: [],
      };
      
      sendMessage(
        { ticketId, messageData },
        {
          onSuccess: async (response) => {
            // After text message sent, upload files if any
            if (selectedFiles.length > 0) {
              try {
                for (const file of selectedFiles) {
                  await supportAPI.uploadAttachment(ticketId, file);
                }
                // Invalidate to show attachments immediately
                await queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
              } catch (uploadError) {
                console.error('File upload error:', uploadError);
              }
            }
            
            setMessage('');
            setSelectedFiles([]);
            refetchTicket(); // Refresh to get new messages
          }
        }
      );
    } else if (selectedFiles.length > 0) {
      // Only files, no text message
      try {
        for (const file of selectedFiles) {
          await supportAPI.uploadAttachment(ticketId, file);
        }
        // Invalidate to show attachments immediately
        await queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
        
        setSelectedFiles([]);
        refetchTicket(); // Refresh to get new messages
      } catch (error) {
        console.error('File upload error:', error);
      }
    }
  };

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        ToastService.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        continue;
      }
      validFiles.push(file);
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="h-4 w-4 text-success" />;
    }
    if (['pdf'].includes(ext || '')) {
      return <FileText className="h-4 w-4 text-destructive" />;
    }
    if (['zip', 'rar', '7z'].includes(ext || '')) {
      return <FileArchive className="h-4 w-4 text-primary" />;
    }
    return <FileText className="h-4 w-4 text-primary" />;
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
              <h1 className="text-2xl font-bold text-foreground">{ticket.title}</h1>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                        ? 'bg-muted/50 text-foreground'
                        : 'bg-primary text-primary-foreground'
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
                        isSupport ? 'text-muted-foreground' : 'text-primary-foreground/80'
                      }`}>
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                    
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    
                    {/* Message Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.attachments.map((attachment: string, attachIndex: number) => {
                          const filename = attachment.split('/').pop() || attachment;
                          const isImage = isImageFile(filename);
                          
                          return (
                            <div key={attachIndex}>
                              {isImage ? (
                                <div className="mt-2">
                                  <img
                                    src={getAttachmentUrl(attachment)}
                                    alt={filename}
                                    className="max-w-xs max-h-64 rounded-lg border"
                                    onClick={() => window.open(getAttachmentUrl(attachment), '_blank')}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  <p className="text-xs mt-1 text-muted-foreground">{filename}</p>
                                </div>
                              ) : (
                                <a
                                  href={getAttachmentUrl(attachment)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-opacity-80 ${
                                    isSupport 
                                      ? 'bg-background text-foreground border-border' 
                                      : 'bg-primary text-primary-foreground border-primary/60'
                                  }`}
                                >
                                  {getFileIcon(filename)}
                                  <span className="truncate max-w-[200px]">{filename}</span>
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {msg.is_internal_note && (
                      <p className="text-xs mt-2 text-muted-foreground italic">
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
              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="mb-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">Attachments:</p>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 bg-muted/50 p-2 rounded-md">
                      {getFileIcon(file.name)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-destructive hover:text-destructive/80 p-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <div className="flex flex-col flex-1 gap-2">
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
                  
                  <div className="flex gap-2">
                    {/* File Upload Button */}
                    <div className="relative">
                      <input
                        type="file"
                        id="message-file-upload"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.zip,.rar"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('message-file-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Attach
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sending}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {ticket.status === 'closed' && (
            <div className="border-t p-4 text-center text-muted-foreground">
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
              <CheckCircle className="h-5 w-5 text-success" />
              Resolution
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{ticket.resolution_note}</p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}