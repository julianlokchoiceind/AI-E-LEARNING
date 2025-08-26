"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageCircle, X, Settings, Target, Languages, Brain, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAIChat } from '@/hooks/useAIChat';
import { useAISuggestionsQuery } from '@/hooks/queries/useAI';
import { useAuth } from '@/hooks/useAuth';

interface SimpleChatWidgetProps {
  courseId?: string;
  lessonId?: string;
  chapterId?: string;
  userLevel?: string;
  position?: 'bottom-right' | 'bottom-left' | 'embedded';
  className?: string;
  videoProgress?: number;
  videoCurrentTime?: number;
  enableEnhancedFeatures?: boolean;
}

export const SimpleChatWidget: React.FC<SimpleChatWidgetProps> = ({
  courseId,
  lessonId,
  chapterId,
  userLevel,
  position = 'bottom-right',
  className = "",
  videoProgress,
  videoCurrentTime,
  enableEnhancedFeatures = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { isAuthenticated } = useAuth();
  
  // React Query hook for AI suggestions - replaces manual fetch
  const { data: suggestionsResponse } = useAISuggestionsQuery(
    {
      course_id: courseId,
      lesson_id: lessonId,
      user_level: userLevel
    },
    isAuthenticated && !!(courseId || lessonId) // Only fetch when authenticated AND we have context
  );

  // Extract suggestions from React Query response or use fallback
  const quickSuggestions = suggestionsResponse?.data?.suggestions?.slice(0, 4) || [
    enableEnhancedFeatures ? "What should I focus on in this lesson?" : "Explain this concept in simple terms",
    enableEnhancedFeatures ? "Can you explain this concept?" : "Give me a code example", 
    enableEnhancedFeatures ? "How does this relate to my goals?" : "What should I learn next?",
    enableEnhancedFeatures ? "Give me a practical example" : "Help me understand this better"
  ];
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showLearningGoals, setShowLearningGoals] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    clearMessages,
    addMessage,
    contextHistory,
    learningGoals,
    difficultyPreference,
    languagePreference,
    setDifficulty,
    setLanguage,
    addLearningGoal,
    removeLearningGoal,
    totalQuestions,
    hasContext
  } = useAIChat({
    courseId,
    lessonId,
    chapterId,
    userLevel,
    enableContextTracking: enableEnhancedFeatures,
    enableLearningAnalytics: enableEnhancedFeatures
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      // AI suggestions are now automatically fetched via React Query
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, messages.length, courseId, addMessage]);

  // Hide suggestions after first user message
  useEffect(() => {
    if (messages.some(m => m.type === 'user')) {
      setShowQuickSuggestions(false);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Removed manual fetchQuickSuggestions - already using React Query via useAISuggestionsQuery

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    // Check authentication before sending
    if (!isAuthenticated) {
      addMessage({
        type: 'ai',
        content: 'Please log in to chat with the AI Study Buddy. 🔐'
      });
      return;
    }
    
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
          className="bg-primary hover:bg-primary/90 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`${position !== 'embedded' ? positionClasses[position] : ''} ${className}`}>
      <div className="bg-white border border-border rounded-lg shadow-xl w-80 h-96 flex flex-col">
        {/* Header */}
        <div className="bg-primary text-white p-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <div>
              <span className="font-medium">AI Study Buddy</span>
              {enableEnhancedFeatures && hasContext && (
                <div className="text-xs opacity-75">
                  {totalQuestions} questions • {learningGoals.length} goals
                </div>
              )}
            </div>
            {isLoading && (
              <div className="flex space-x-1 ml-2">
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-100" />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-200" />
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {enableEnhancedFeatures && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:bg-primary/90 p-1"
                title="AI Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
            
            {position !== 'embedded' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-primary/90 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Settings Panel */}
        {enableEnhancedFeatures && showSettings && (
          <div className="border-b border-border p-3 bg-muted/50">
            <div className="space-y-3">
              {/* Difficulty Preference */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Response Style</label>
                <div className="flex space-x-1">
                  {(['simple', 'detailed', 'technical'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={difficultyPreference === level ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setDifficulty(level)}
                      className="text-xs px-2 py-1 h-auto"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Language Preference */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Language</label>
                <div className="flex space-x-1">
                  <Button
                    variant={languagePreference === 'en' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setLanguage('en')}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    <Languages className="w-3 h-3 mr-1" />
                    English
                  </Button>
                  <Button
                    variant={languagePreference === 'vi' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setLanguage('vi')}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    <Languages className="w-3 h-3 mr-1" />
                    Tiếng Việt
                  </Button>
                </div>
              </div>
              
              {/* Learning Goals */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted-foreground">Learning Goals ({learningGoals.length})</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLearningGoals(!showLearningGoals)}
                    className="text-xs p-1 h-auto"
                  >
                    <Target className="w-3 h-3" />
                  </Button>
                </div>
                
                {showLearningGoals && (
                  <div className="space-y-1">
                    {learningGoals.map((goal, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded p-1">
                        <span className="text-xs text-muted-foreground flex-1">{goal}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLearningGoal(goal)}
                          className="text-xs p-1 h-auto text-destructive hover:text-destructive/80"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        placeholder="Add learning goal..."
                        className="flex-1 text-xs border border-border rounded px-2 py-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newGoal.trim()) {
                            addLearningGoal(newGoal.trim());
                            setNewGoal('');
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newGoal.trim()) {
                            addLearningGoal(newGoal.trim());
                            setNewGoal('');
                          }
                        }}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                  message.type === 'user' ? 'bg-muted/500' : 'bg-primary'
                }`}>
                  {message.type === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                </div>
                
                <div className={`rounded-lg p-2 ${
                  message.type === 'user' 
                    ? 'bg-primary text-white' 
                    : 'bg-muted text-foreground'
                }`}>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
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
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="bg-muted text-foreground rounded-lg p-2">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce delay-100" />
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {showQuickSuggestions && quickSuggestions.length > 0 && (
          <div className="border-t border-border/50 p-2">
            <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
            <div className="space-y-1">
              {quickSuggestions.map((suggestion: any, index: number) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!isAuthenticated) {
                      addMessage({
                        type: 'ai',
                        content: 'Please log in to chat with the AI Study Buddy. 🔐'
                      });
                      return;
                    }
                    sendMessage(suggestion);
                    setShowQuickSuggestions(false);
                  }}
                  className="w-full text-left justify-start text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 p-1 h-auto"
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
              className="flex-1 px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white p-1"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <div className="text-xs text-muted-foreground">
              {enableEnhancedFeatures ? (
                <div className="flex items-center space-x-2">
                  <span>
                    {courseId && lessonId ? 'Lesson Context' : courseId ? 'Course Context' : 'General Chat'}
                  </span>
                  {videoProgress && (
                    <span className="flex items-center">
                      <Brain className="w-3 h-3 mr-1" />
                      {Math.round(videoProgress)}% watched
                    </span>
                  )}
                </div>
              ) : (
                courseId && lessonId ? 'Context: Current lesson' : courseId ? 'Context: Course' : 'General chat'
              )}
            </div>
            <div className="flex items-center space-x-1">
              {enableEnhancedFeatures && learningGoals.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!isAuthenticated) {
                      addMessage({
                        type: 'ai',
                        content: 'Please log in to chat with the AI Study Buddy. 🔐'
                      });
                      return;
                    }
                    const goalText = learningGoals.join(', ');
                    sendMessage(`Help me with my learning goals: ${goalText}`);
                  }}
                  className="text-xs text-primary hover:text-primary/80 p-1"
                  title="Ask about learning goals"
                >
                  <Lightbulb className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="text-xs text-muted-foreground hover:text-muted-foreground p-1"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleChatWidget;