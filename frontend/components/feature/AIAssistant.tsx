"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, Minimize2, Maximize2, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ToastService } from '@/lib/toast/ToastService';
import { useApiMutation } from '@/hooks/useApiMutation';
import { api } from '@/lib/api/api-client';
import { StandardResponse } from '@/lib/types/api';

// Types
interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  context?: any;
}

interface AIAssistantProps {
  courseId?: string;
  lessonId?: string;
  userLevel?: string;
  className?: string;
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

export const AIAssistant: React.FC<AIAssistantProps> = ({
  courseId,
  lessonId,
  userLevel,
  className = ""
}) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // React Query mutation for AI chat - uses API client for consistent auth and error handling
  const { mutate: sendAIMessage, loading: isLoading } = useApiMutation(
    async ({ message, context }: { message: string; context?: any }): Promise<StandardResponse<any>> => {
      return api.chatWithAI({ message, context }) as Promise<StandardResponse<any>>;
    },
    {
      // Don't show automatic toasts for AI chat
      showToast: false,
    }
  );
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);
  
  // Initialize chat with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: `Hi! I'm your AI Study Buddy 🤖. I'm here to help you learn and answer any questions you have. ${courseId ? 'I can see you\'re working on a course' : 'Feel free to ask me anything!'} - how can I assist you today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, courseId]);
  
  // Send message to AI using React Query mutation
  const sendMessage = () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputValue.trim();
    setInputValue('');
    setIsTyping(true);
    
    // Prepare context for AI
    const context: any = {};
    if (courseId) context.course_id = courseId;
    if (lessonId) context.lesson_id = lessonId;
    if (userLevel) context.user_level = userLevel;
    
    sendAIMessage(
      {
        message: messageContent,
        context: Object.keys(context).length > 0 ? context : undefined
      },
      {
        onSuccess: async (response) => {
          // Simulate typing delay for better UX
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Handle API response format (StandardResponse)
          const aiResponse = response.data || response;
          
          const aiMessage: Message = {
            id: Date.now().toString(),
            type: 'ai',
            content: aiResponse.response || aiResponse.message || 'I received your message but had trouble generating a response.',
            timestamp: new Date(),
            context: aiResponse.context
          };
          
          setMessages(prev => [...prev, aiMessage]);
          setIsTyping(false);
        },
        onError: (error: any) => {
          console.error('AI chat error:', error);
          
          // Handle rate limiting
          if (error.message.includes('rate limit')) {
            ToastService.error('You\'re sending messages too quickly. Please wait a moment.');
          } else {
            ToastService.error(error.message || 'Something went wrong');
          }
          
          // Add error message to chat
          const errorMessage: Message = {
            id: Date.now().toString(),
            type: 'ai',
            content: 'I\'m sorry, I\'m having trouble responding right now. Please try again in a moment.',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, errorMessage]);
          setIsTyping(false);
        }
      }
    );
  };
  
  // Handle input key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
    ToastService.success('Conversation cleared');
  };
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Render chat bubble
  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }
  
  // Render chat interface
  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className={`w-96 bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300 ${
        isMinimized ? 'h-14' : 'h-[600px]'
      }`}>
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <h3 className="font-medium">AI Study Buddy</h3>
            {isLoading && (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-blue-700 p-1"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Chat content - only show when not minimized */}
        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto h-[480px] space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                      message.type === 'user' ? 'bg-gray-500' : 'bg-blue-600'
                    }`}>
                      {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    
                    {/* Message bubble */}
                    <div className={`rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input area */}
            <div className="border-t p-4">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Quick actions */}
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500">
                  {courseId && lessonId ? 'Context: Current lesson' : courseId ? 'Context: Current course' : 'General chat'}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearConversation}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AIAssistant;