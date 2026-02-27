"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageCircle, X, Settings, Target, Languages, Brain, Lightbulb, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAIChat } from '@/hooks/useAIChat';
import { useAISuggestionsQuery } from '@/hooks/queries/useAI';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';

// Import Prism languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';

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
  onShowMessage?: (message: string, type: 'info' | 'error') => void;
  hasAIAccess?: boolean;
}

// Message content component with markdown and code highlighting
const MessageContent: React.FC<{ content: string; type: 'user' | 'ai' }> = ({ content, type }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type === 'ai' && codeRef.current) {
      Prism.highlightAllUnder(codeRef.current);
    }
  }, [content, type]);

  const copyToClipboard = async (code: string, language: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(language);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // User messages: plain text
  if (type === 'user') {
    return <div className="text-sm whitespace-pre-wrap">{content}</div>;
  }

  // AI messages: full markdown with syntax highlighting
  return (
    <div ref={codeRef}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && language) {
              return (
                <div className="relative my-3 rounded-lg overflow-hidden shadow-md">
                  <div className="flex items-center justify-between bg-[#1e1e1e] px-3 py-2 border-b border-gray-700">
                    <span className="text-xs text-gray-400 font-mono">{language}</span>
                    <button
                      onClick={() => copyToClipboard(codeString, language)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
                      title="Copy code"
                    >
                      {copiedCode === language ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="!m-0 !bg-[#1e1e1e] overflow-x-auto">
                    <code className={`language-${language} !text-sm`}>
                      {codeString}
                    </code>
                  </pre>
                </div>
              );
            }

            return (
              <code
                className="bg-[#4A90E2]/10 text-[#4A90E2] px-1.5 py-0.5 rounded text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          h1: ({ children }) => (
            <h1 className="text-lg font-semibold mb-2 pb-1 border-b-2 border-[#1E3A8A] text-[#4A90E2]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold mb-2 text-[#4A90E2]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mb-1 text-[#4A90E2]">
              {children}
            </h3>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[#4A90E2]">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-2 ml-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-2 ml-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-foreground">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#4A90E2] pl-3 py-1 my-2 bg-[#4A90E2]/5 italic text-sm">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4A90E2] hover:underline"
            >
              {children}
            </a>
          ),
          p: ({ children }) => (
            <p className="text-sm mb-2 last:mb-0">{children}</p>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export const SimpleChatWidget: React.FC<SimpleChatWidgetProps> = ({
  courseId,
  lessonId,
  chapterId,
  userLevel,
  position = 'bottom-right',
  className = "",
  videoProgress,
  videoCurrentTime,
  enableEnhancedFeatures = true,
  onShowMessage,
  hasAIAccess = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { isAuthenticated } = useAuth();
  
  // React Query hook for AI suggestions
  const { data: suggestionsResponse } = useAISuggestionsQuery(
    {
      course_id: courseId,
      lesson_id: lessonId,
      user_level: userLevel
    },
    isAuthenticated && !!(courseId || lessonId)
  );

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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
    enableLearningAnalytics: enableEnhancedFeatures,
    onShowMessage
  });

  // Auto-scroll: top for welcome message, bottom for subsequent messages
  useEffect(() => {
    if (messages.length === 1 && messages[0].type === 'ai') {
      messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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
    }
  }, [isOpen, messages.length, courseId, addMessage]);

  // Hide suggestions after first user message
  useEffect(() => {
    if (messages.some(m => m.type === 'user')) {
      setShowQuickSuggestions(false);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
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
          className="rounded-full p-4 shadow-lg transition-transform hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #4A90E2 0%, #1E3A8A 100%)',
          }}
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`${position !== 'embedded' ? positionClasses[position] : ''} ${className}`}>
      <div className="bg-white border border-border rounded-lg shadow-xl w-80 h-96 flex flex-col overflow-hidden">
        {/* Header with gradient */}
        <div 
          className="text-white p-3 rounded-t-lg flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #4A90E2 0%, #1E3A8A 100%)',
          }}
        >
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
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {enableEnhancedFeatures && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:bg-white/20 p-1"
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
                className="text-white hover:bg-white/20 p-1"
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
                        id="ai-learning-goal"
                        name="learning-goal"
                        type="text"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        placeholder="Add learning goal..."
                        className="flex-1 text-xs border border-border rounded px-2 py-1"
                        aria-label="Add learning goal"
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

        {/* Upgrade CTA for non-paid users */}
        {!hasAIAccess && (
          <div
            className="flex-1 flex flex-col items-center justify-center p-5 text-center"
            style={{
              background: 'linear-gradient(180deg, #dbeafe 0%, #eff6ff 60%, #ffffff 100%)',
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg, #4A90E2 0%, #1E3A8A 100%)' }}
            >
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">AI Study Buddy</h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Get instant AI-powered explanations, code help, and personalized learning support.
            </p>
            <div className="space-y-2 w-full">
              <a
                href="/pricing"
                className="block w-full py-2 px-4 rounded-lg text-sm font-medium text-white text-center transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #4A90E2 0%, #1E3A8A 100%)' }}
              >
                Upgrade to Pro
              </a>
              <p className="text-xs text-muted-foreground">
                Or purchase this course to unlock AI access
              </p>
            </div>
          </div>
        )}

        {/* Messages with gradient background */}
        {hasAIAccess && (
        <div
          ref={messagesContainerRef}
          className="flex-1 p-3 overflow-y-auto space-y-3"
          style={{
            background: 'linear-gradient(180deg, #dbeafe 0%, #bfdbfe 30%, #eff6ff 60%, #ffffff 100%)',
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex animate-fadeIn ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[85%] ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={message.type === 'user' ? {
                    background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                  } : {
                    background: 'linear-gradient(135deg, #4A90E2 0%, #1E3A8A 100%)',
                  }}
                >
                  {message.type === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                
                <div 
                  className={`rounded-xl p-3 shadow-md backdrop-blur-sm ${
                    message.type === 'user' ? 'text-white' : 'text-foreground'
                  }`}
                  style={message.type === 'user' ? {
                    background: 'linear-gradient(135deg, #4A90E2 0%, #1E3A8A 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  } : {
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(74, 144, 226, 0.1)'
                  }}
                >
                  <MessageContent content={message.content} type={message.type} />
                  <div className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-white/80' : 'text-muted-foreground'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start animate-fadeIn">
              <div className="flex items-start space-x-2 max-w-[85%]">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{
                    background: 'linear-gradient(135deg, #4A90E2 0%, #1E3A8A 100%)',
                  }}
                >
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div 
                  className="rounded-xl p-3 shadow-md backdrop-blur-sm"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(74, 144, 226, 0.1)'
                  }}
                >
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#4A90E2] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#4A90E2] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-[#4A90E2] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        )}

        {/* Quick Suggestions */}
        {hasAIAccess && showQuickSuggestions && quickSuggestions.length > 0 && (
          <div className="border-t border-border/50 p-2 bg-white">
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
                  className="w-full text-left justify-start text-xs text-muted-foreground hover:text-[#4A90E2] hover:bg-[#4A90E2]/10 p-1 h-auto transition-colors"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        {hasAIAccess && (
        <div className="border-t p-3 bg-white">
          <div className="flex items-center space-x-2">
            <input
              id="ai-chat-message"
              name="message"
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent transition-all"
              aria-label="AI chat message input"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="p-2 transition-transform hover:scale-105"
              style={{
                background: inputValue.trim() && !isLoading 
                  ? 'linear-gradient(135deg, #4A90E2 0%, #1E3A8A 100%)'
                  : undefined,
              }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-2">
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
                  className="text-xs text-[#4A90E2] hover:text-[#1E3A8A] p-1 transition-colors"
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
        )}
      </div>

      {/* Custom styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        /* Custom scrollbar for chat */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #4A90E2;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #1E3A8A;
        }

        /* Prism theme override for dark code blocks */
        pre[class*="language-"] {
          background: #1e1e1e !important;
        }
        
        code[class*="language-"] {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default SimpleChatWidget;
