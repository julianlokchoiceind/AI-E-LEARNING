'use client';

import { BehaviorSubject } from 'rxjs';

export type MessageType = 'success' | 'error' | 'info' | 'warning';

export interface InlineMessage {
  id: string;
  message: string;
  type: MessageType;
  location: string; // Where to display (e.g., 'login-form', 'register-form')
  autoDismiss?: boolean;
  dismissAfter?: number; // milliseconds
  createdAt: number;
}

class InlineServiceClass {
  private messages$ = new BehaviorSubject<Map<string, InlineMessage>>(new Map());
  private dismissTimers = new Map<string, NodeJS.Timeout>();

  // Get observable for React components
  getMessages() {
    return this.messages$.asObservable();
  }

  // Get current messages snapshot
  getCurrentMessages() {
    return this.messages$.value;
  }

  // Show message at specific location
  show(
    location: string,
    message: string,
    type: MessageType = 'info',
    options?: {
      autoDismiss?: boolean;
      dismissAfter?: number;
    }
  ): string {
    const id = `${location}-${Date.now()}`;
    const inlineMessage: InlineMessage = {
      id,
      message,
      type,
      location,
      autoDismiss: options?.autoDismiss ?? true,
      dismissAfter: options?.dismissAfter ?? (type === 'success' ? 5000 : 8000),
      createdAt: Date.now(),
    };

    // Clear any existing message at this location
    this.clearLocation(location);

    // Add new message
    const messages = new Map(this.messages$.value);
    messages.set(location, inlineMessage);
    this.messages$.next(messages);

    // Setup auto-dismiss if enabled
    if (inlineMessage.autoDismiss && inlineMessage.dismissAfter) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, inlineMessage.dismissAfter);
      this.dismissTimers.set(id, timer);
    }

    return id;
  }

  // Convenience methods
  success(location: string, message: string, options?: { autoDismiss?: boolean; dismissAfter?: number }) {
    return this.show(location, message, 'success', options);
  }

  error(location: string, message: string, options?: { autoDismiss?: boolean; dismissAfter?: number }) {
    return this.show(location, message, 'error', {
      autoDismiss: options?.autoDismiss ?? true,
      dismissAfter: options?.dismissAfter ?? 8000,
    });
  }

  info(location: string, message: string, options?: { autoDismiss?: boolean; dismissAfter?: number }) {
    return this.show(location, message, 'info', options);
  }

  warning(location: string, message: string, options?: { autoDismiss?: boolean; dismissAfter?: number }) {
    return this.show(location, message, 'warning', options);
  }

  // Dismiss specific message
  dismiss(id: string) {
    const messages = new Map(this.messages$.value);
    
    // Find and remove message by ID
    for (const [location, msg] of messages.entries()) {
      if (msg.id === id) {
        messages.delete(location);
        
        // Clear timer if exists
        const timer = this.dismissTimers.get(id);
        if (timer) {
          clearTimeout(timer);
          this.dismissTimers.delete(id);
        }
        
        break;
      }
    }
    
    this.messages$.next(messages);
  }

  // Clear all messages at a specific location
  clearLocation(location: string) {
    const messages = new Map(this.messages$.value);
    const existingMsg = messages.get(location);
    
    if (existingMsg) {
      // Clear timer if exists
      const timer = this.dismissTimers.get(existingMsg.id);
      if (timer) {
        clearTimeout(timer);
        this.dismissTimers.delete(existingMsg.id);
      }
      
      messages.delete(location);
      this.messages$.next(messages);
    }
  }

  // Clear specific location (alias for clearLocation)
  clear(location: string) {
    return this.clearLocation(location);
  }

  // Clear all messages
  clearAll() {
    // Clear all timers
    for (const timer of this.dismissTimers.values()) {
      clearTimeout(timer);
    }
    this.dismissTimers.clear();
    
    // Clear all messages
    this.messages$.next(new Map());
  }
}

// Export singleton instance (following ToastService pattern)
export const InlineService = new InlineServiceClass();