'use client';

import React from 'react';
import { MessageType } from '@/lib/inline/InlineService';

interface InlineMessageProps {
  message: string;
  type: MessageType;
  onDismiss?: () => void;
  className?: string;
}

const getMessageStyles = (type: MessageType) => {
  const baseStyles = 'mb-4 rounded-md border border-l-4 p-3 flex items-start';
  
  switch (type) {
    case 'success':
      return `${baseStyles} bg-green-50 border-green-200 border-l-green-500`;
    case 'error':
      return `${baseStyles} bg-red-50 border-red-200 border-l-red-500`;
    case 'warning':
      return `${baseStyles} bg-yellow-50 border-yellow-200 border-l-yellow-500`;
    case 'info':
      return `${baseStyles} bg-blue-50 border-blue-200 border-l-blue-500`;
    default:
      return `${baseStyles} bg-gray-50 border-gray-200 border-l-gray-500`;
  }
};

const getIconForType = (type: MessageType) => {
  switch (type) {
    case 'success':
      return (
        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    case 'error':
      return (
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    case 'warning':
      return (
        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    case 'info':
      return (
        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    default:
      return null;
  }
};

const getTextColorForType = (type: MessageType) => {
  switch (type) {
    case 'success':
      return 'text-green-800';
    case 'error':
      return 'text-red-800';
    case 'warning':
      return 'text-yellow-800';
    case 'info':
      return 'text-blue-800';
    default:
      return 'text-gray-800';
  }
};

export function InlineMessage({ message, type, onDismiss, className = '' }: InlineMessageProps) {
  const messageStyles = getMessageStyles(type);
  const textColor = getTextColorForType(type);
  const icon = getIconForType(type);

  return (
    <div className={`${messageStyles} ${className}`}>
      {icon && (
        <div className="flex-shrink-0 mr-3">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className={`text-sm font-medium ${textColor}`}>
          {message}
        </p>
      </div>
      {onDismiss && (
        <div className="ml-auto pl-2 flex items-center -mr-1">
          <button
            type="button"
            onClick={onDismiss}
            className={`inline-flex items-center justify-center rounded-md p-0.5 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === 'success' ? 'text-green-500 hover:bg-green-500 focus:ring-green-600' :
              type === 'error' ? 'text-red-500 hover:bg-red-500 focus:ring-red-600' :
              type === 'warning' ? 'text-yellow-500 hover:bg-yellow-500 focus:ring-yellow-600' :
              'text-blue-500 hover:bg-blue-500 focus:ring-blue-600'
            }`}
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}