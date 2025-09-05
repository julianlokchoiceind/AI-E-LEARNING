'use client';

import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  message
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
};

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 shadow-xl">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  );
};

// =============================================================================
// ⭐ NEW: 3 UNIFIED SKELETON BASE COMPONENTS - CONSISTENT bg-muted COLOR
// =============================================================================

interface SkeletonBoxProps {
  className?: string;
  animate?: boolean;
  style?: React.CSSProperties;
}

/**
 * SkeletonBox - Universal skeleton for rectangles (text, images, buttons)
 * Usage: <SkeletonBox className="h-4 w-32" /> - text line
 *        <SkeletonBox className="h-48 w-full" /> - image
 *        <SkeletonBox className="h-10 w-24 rounded-full" /> - button
 */
export const SkeletonBox: React.FC<SkeletonBoxProps> = ({ 
  className = '', 
  animate = true,
  style
}) => {
  return (
    <div
      className={`bg-muted border border-border rounded ${animate ? 'animate-pulse' : ''} ${className}`}
      style={style}
    />
  );
};

interface SkeletonCircleProps {
  className?: string;
  animate?: boolean;
}

/**
 * SkeletonCircle - Universal skeleton for circles (avatars, icons)
 * Usage: <SkeletonCircle className="h-10 w-10" />
 */
export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({ 
  className = '', 
  animate = true 
}) => {
  return (
    <div
      className={`bg-muted border border-border rounded-full ${animate ? 'animate-pulse' : ''} ${className}`}
    />
  );
};

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  animate?: boolean;
}

/**
 * SkeletonText - Universal skeleton for multiple text lines
 * Usage: <SkeletonText lines={3} />
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({ 
  lines = 3, 
  className = '',
  animate = true 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox 
          key={i} 
          className="h-4"
          style={{ width: `${100 - (i % 3) * 15}%` }} // Random widths: 100%, 85%, 70%
          animate={animate}
        />
      ))}
    </div>
  );
};

// =============================================================================
// LEGACY COMPONENTS - KEEP FOR BACKWARD COMPATIBILITY
// =============================================================================


interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  children,
  loadingText = 'Loading...',
  className = '',
  disabled,
  onClick
}) => {
  return (
    <button
      className={`relative ${className}`}
      disabled={loading || disabled}
      onClick={onClick}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="flex justify-center mb-4">
          <div className="bg-muted p-3 rounded-full">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="text-primary hover:text-primary/80 font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  error?: Error | string | null;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  error,
  description,
  action,
  className = ""
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {/* Error Icon */}
      <div className="flex justify-center mb-4">
        <div className="bg-destructive/10 p-3 rounded-full">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      {/* Error Message */}
      {(description || error) && (
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          {description || (error instanceof Error ? error.message : String(error))}
        </p>
      )}
      
      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

