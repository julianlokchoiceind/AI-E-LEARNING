"use client";

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

// Types
interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  context?: any;
}

interface ChatContext {
  course_id?: string;
  lesson_id?: string;
  user_level?: string;
}

interface ChatResponse {
  response: string;
  context?: any;
  timestamp: string;
  model: string;
}

interface ChatError {
  error: string;
  retry_after?: number;
  details?: string;
}

interface UseAIChatParams {
  courseId?: string;
  lessonId?: string;
  userLevel?: string;
  onError?: (error: string) => void;
}

interface UseAIChatReturn {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  getConversationHistory: () => Promise<void>;
  clearConversationHistory: () => Promise<void>;
}

export const useAIChat = ({
  courseId,
  lessonId,
  userLevel,
  onError
}: UseAIChatParams = {}): UseAIChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Add a message to the conversation
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Send message to AI
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Prepare context for AI
      const context: ChatContext = {};
      if (courseId) context.course_id = courseId;
      if (lessonId) context.lesson_id = lessonId;
      if (userLevel) context.user_level = userLevel;

      // Call AI API
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          message: content,
          context: Object.keys(context).length > 0 ? context : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error types
        if (response.status === 429) {
          const errorData = data as ChatError;
          throw new Error(errorData.error || 'Rate limit exceeded');
        } else if (response.status === 401) {
          throw new Error('Authentication required');
        } else {
          throw new Error(data.error || 'Failed to get AI response');
        }
      }

      // Simulate typing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        context: data.context
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      console.error('AI chat error:', error);
      
      const errorMessage = error.message || 'Failed to get AI response';
      
      // Handle different error types
      if (errorMessage.includes('rate limit')) {
        toast.error('You\'re sending messages too quickly. Please wait a moment.');
      } else if (errorMessage.includes('Authentication')) {
        toast.error('Please log in to use the AI assistant.');
      } else if (errorMessage.includes('credit balance')) {
        toast.error('AI service is temporarily unavailable. Please try again later.');
      } else {
        toast.error('Failed to get AI response. Please try again.');
      }

      // Add error message to chat
      const errorChatMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'I\'m sorry, I\'m having trouble responding right now. Please try again in a moment.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorChatMessage]);

      // Call onError callback if provided
      if (onError) {
        onError(errorMessage);
      }

    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [isLoading, courseId, lessonId, userLevel, onError]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Get conversation history from server
  const getConversationHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/ai/conversation-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get conversation history');
      }

      const data = await response.json();
      
      // Convert server history to messages
      const historyMessages: Message[] = data.history.map((entry: any) => [
        {
          id: `history-q-${entry.timestamp}`,
          type: 'user' as const,
          content: entry.question,
          timestamp: new Date(entry.timestamp)
        },
        {
          id: `history-a-${entry.timestamp}`,
          type: 'ai' as const,
          content: entry.answer,
          timestamp: new Date(entry.timestamp),
          context: entry.context
        }
      ]).flat();

      setMessages(historyMessages);

    } catch (error) {
      console.error('Failed to get conversation history:', error);
      toast.error('Failed to load conversation history');
    }
  }, []);

  // Clear conversation history on server
  const clearConversationHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/ai/conversation-history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to clear conversation history');
      }

      clearMessages();
      toast.success('Conversation history cleared');

    } catch (error) {
      console.error('Failed to clear conversation history:', error);
      toast.error('Failed to clear conversation history');
    }
  }, [clearMessages]);

  return {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    clearMessages,
    addMessage,
    getConversationHistory,
    clearConversationHistory
  };
};

export default useAIChat;