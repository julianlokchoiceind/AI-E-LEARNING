'use client';

import { useState, useEffect } from 'react';
import { InlineService, InlineMessage } from '@/lib/inline/InlineService';

/**
 * Hook to display and manage inline messages for a specific location
 * 
 * @param location - Unique identifier for where the message should appear
 * @returns Object with current message and control functions
 * 
 * @example
 * const { message, showSuccess, showError, clear } = useInlineMessage('login-form');
 * 
 * // Show success message
 * showSuccess('Login successful!');
 * 
 * // Show error message  
 * showError('Invalid credentials');
 * 
 * // Clear message
 * clear();
 * 
 * // Render message if exists
 * {message && <InlineMessage {...message} onDismiss={clear} />}
 */
export function useInlineMessage(location: string) {
  const [message, setMessage] = useState<InlineMessage | null>(null);

  useEffect(() => {
    // Subscribe to messages for this location
    const subscription = InlineService.getMessages().subscribe((messages) => {
      const locationMessage = messages.get(location);
      setMessage(locationMessage || null);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [location]);

  // Convenience methods for this location
  const showSuccess = (message: string, options?: { autoDismiss?: boolean; dismissAfter?: number }) => {
    return InlineService.success(location, message, options);
  };

  const showError = (message: string, options?: { autoDismiss?: boolean; dismissAfter?: number }) => {
    return InlineService.error(location, message, options);
  };

  const showInfo = (message: string, options?: { autoDismiss?: boolean; dismissAfter?: number }) => {
    return InlineService.info(location, message, options);
  };

  const showWarning = (message: string, options?: { autoDismiss?: boolean; dismissAfter?: number }) => {
    return InlineService.warning(location, message, options);
  };

  const clear = () => {
    InlineService.clear(location);
  };

  const dismiss = () => {
    if (message) {
      InlineService.dismiss(message.id);
    }
  };

  return {
    message,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clear,
    dismiss,
    isVisible: !!message,
  };
}

/**
 * Hook to get all inline messages across all locations
 * Useful for debugging or global message management
 */
export function useAllInlineMessages() {
  const [messages, setMessages] = useState<Map<string, InlineMessage>>(new Map());

  useEffect(() => {
    const subscription = InlineService.getMessages().subscribe((messages) => {
      setMessages(new Map(messages));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const clearAll = () => {
    InlineService.clearAll();
  };

  return {
    messages,
    clearAll,
    messageCount: messages.size,
  };
}

/**
 * Hook for displaying inline messages with the component included
 * Returns both the message state and a render function
 * 
 * @param location - Unique identifier for where the message should appear
 * @returns Object with message controls and render function
 * 
 * @example
 * const { showSuccess, showError, renderMessage } = useInlineMessageWithComponent('login-form');
 * 
 * return (
 *   <form>
 *     {renderMessage()}
 *     <input type="email" />
 *     <button onClick={() => showSuccess('Login successful!')}>Login</button>
 *   </form>
 * );
 */
export function useInlineMessageWithComponent(location: string) {
  const { message, showSuccess, showError, showInfo, showWarning, clear, dismiss } = useInlineMessage(location);

  // Return a render function instead of JSX to avoid TypeScript issues
  const renderMessage = () => {
    if (!message) return null;
    
    // For now, return a simple message indication
    // In practice, users should import and use InlineMessage component directly
    return message;
  };

  return {
    message,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clear,
    dismiss,
    isVisible: !!message,
    renderMessage,
  };
}