"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageSquare, Lightbulb, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAIChat } from '@/hooks/useAIChat';

interface InlineChatComponentProps {
  courseId?: string;
  lessonId?: string;
  userLevel?: string;
  title?: string;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
}

export const InlineChatComponent: React.FC<InlineChatComponentProps> = ({
  courseId,
  lessonId,
  userLevel,
  title = "Ask AI Study Buddy",
  placeholder = "What can I help you with?",
  suggestions: defaultSuggestions = [
    "Explain this concept in simple terms",
    "Give me a code example",
    "What should I learn next?",
    "Help me understand this better"
  ],
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [contextualSuggestions, setContextualSuggestions] = useState<string[]>(defaultSuggestions);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    clearMessages,
    addMessage
  } = useAIChat({
    courseId,
    lessonId,
    userLevel
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Fetch contextual suggestions on mount
  useEffect(() => {
    if (courseId || lessonId) {
      fetchContextualSuggestions();
    }
  }, [courseId, lessonId, userLevel]);

  // Hide suggestions after first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowSuggestions(false);
    }
  }, [messages.length]);

  const fetchContextualSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      
      const response = await fetch('/api/v1/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          course_id: courseId,
          lesson_id: lessonId,
          user_level: userLevel
        })
      });

      if (response.ok) {
        const data = await response.json();
        setContextualSuggestions(data.suggestions);
      } else {
        // Fall back to default suggestions
        setContextualSuggestions(defaultSuggestions);
      }
    } catch (error) {
      console.error('Failed to fetch contextual suggestions:', error);
      setContextualSuggestions(defaultSuggestions);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue.trim();
    setInputValue('');
    setShowSuggestions(false);
    await sendMessage(message);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className={`p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">
            Get instant help with your learning
          </p>
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && contextualSuggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            <Lightbulb className="w-4 h-4 mr-1" />
            {loadingSuggestions ? 'Loading suggestions...' : 'Try asking:'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {loadingSuggestions ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-8 bg-gray-200 rounded animate-pulse"
                />
              ))
            ) : (
              contextualSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left justify-start bg-white hover:bg-blue-50 border-blue-200 text-gray-700 text-xs"
                >
                  <HelpCircle className="w-3 h-3 mr-2 flex-shrink-0" />
                  {suggestion}
                </Button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="mb-4 max-h-80 overflow-y-auto space-y-3 border rounded-lg bg-white p-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[85%] ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                  message.type === 'user' ? 'bg-gray-500' : 'bg-blue-600'
                }`}>
                  {message.type === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                </div>
                
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
              <div className="flex items-start space-x-2 max-w-[85%]">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <Bot className="w-3 h-3" />
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
      )}

      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500 flex items-center">
            <MessageSquare className="w-3 h-3 mr-1" />
            {courseId && lessonId ? 'AI knows your current lesson context' : 
             courseId ? 'AI knows your course context' : 
             'General AI assistance'}
          </div>
          
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearMessages();
                setShowSuggestions(true);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              New conversation
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default InlineChatComponent;