"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAIChat } from '@/hooks/useAIChat';

interface SimpleChatWidgetProps {
  courseId?: string;
  lessonId?: string;
  userLevel?: string;
  position?: 'bottom-right' | 'bottom-left' | 'embedded';
  className?: string;
}

export const SimpleChatWidget: React.FC<SimpleChatWidgetProps> = ({
  courseId,
  lessonId,
  userLevel,
  position = 'bottom-right',
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Add welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage({
        type: 'ai',
        content: `Hi! I'm your AI Study Buddy 🤖. I'm here to help you with your learning. ${
          courseId ? "I can see you're working on a course" : "Feel free to ask me anything!"
        } How can I assist you today?`
      });
      
      // Fetch contextual suggestions
      fetchQuickSuggestions();
    }
  }, [isOpen, messages.length, courseId, addMessage]);

  // Hide suggestions after first user message
  useEffect(() => {
    if (messages.some(m => m.type === 'user')) {
      setShowQuickSuggestions(false);
    }
  }, [messages]);

  const fetchQuickSuggestions = async () => {
    if (!courseId && !lessonId) return;

    try {
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
        setQuickSuggestions(data.suggestions.slice(0, 3)); // Show max 3 in widget
      }
    } catch (error) {
      console.error('Failed to fetch quick suggestions:', error);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
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

  // Position classes
  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'embedded': 'relative'
  };

  if (!isOpen && position !== 'embedded') {
    return (
      <div className={`${positionClasses[position]} ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`${position !== 'embedded' ? positionClasses[position] : ''} ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-80 h-96 flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span className="font-medium">AI Study Buddy</span>
            {isLoading && (
              <div className="flex space-x-1 ml-2">
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-100" />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-200" />
              </div>
            )}
          </div>
          
          {position !== 'embedded' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3">
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
                
                <div className={`rounded-lg p-2 ${
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
                <div className="bg-gray-100 text-gray-900 rounded-lg p-2">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {showQuickSuggestions && quickSuggestions.length > 0 && (
          <div className="border-t border-gray-100 p-2">
            <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
            <div className="space-y-1">
              {quickSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    sendMessage(suggestion);
                    setShowQuickSuggestions(false);
                  }}
                  className="w-full text-left justify-start text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-1 h-auto"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-3">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white p-1"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <div className="text-xs text-gray-500">
              {courseId && lessonId ? 'Context: Current lesson' : courseId ? 'Context: Course' : 'General chat'}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="text-xs text-gray-500 hover:text-gray-700 p-1"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleChatWidget;