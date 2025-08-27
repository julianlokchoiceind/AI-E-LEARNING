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

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  animate = true 
}) => {
  return (
    <div
      className={`bg-muted rounded ${animate ? 'animate-pulse' : ''} ${className}`}
    />
  );
};

export const CourseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-background rounded-lg shadow p-6">
      <Skeleton className="h-48 w-full mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-4" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4 pb-3 border-b">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-6 w-1/4" />
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex space-x-4 py-3">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
        </div>
      ))}
    </div>
  );
};

/**
 * Specialized skeleton for admin course management table
 * Matches the exact structure of admin/courses/page.tsx table
 * 7 columns: Checkbox | Course | Creator | Status | Content | Pricing | Actions
 */
export const AdCoursesTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            {/* Checkbox column */}
            <th className="px-4 py-3">
              <Skeleton className="h-4 w-4" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-12" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-14" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-12" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-14" />
            </th>
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="hover:bg-muted">
              {/* Checkbox */}
              <td className="px-4 py-4">
                <Skeleton className="h-4 w-4" />
              </td>
              {/* Course column with thumbnail */}
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <Skeleton className="h-12 w-16 rounded-lg mr-4" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </td>
              {/* Creator */}
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-20" />
              </td>
              {/* Status */}
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </td>
              {/* Content */}
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-3 w-14" />
              </td>
              {/* Pricing */}
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-12" />
              </td>
              {/* Actions */}
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Specialized skeleton for admin user management table
 * Matches the exact structure of admin/users/page.tsx table
 * 7 columns: Checkbox | User | Role | Status | Courses | Last Login | Actions
 */
export const AdUsersTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            {/* Checkbox column */}
            <th className="px-4 py-3">
              <Skeleton className="h-4 w-4" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-8" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-8" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-12" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-14" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-14" />
            </th>
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="hover:bg-muted">
              {/* Checkbox */}
              <td className="px-4 py-4">
                <Skeleton className="h-4 w-4" />
              </td>
              {/* User column with avatar */}
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full mr-4" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </td>
              {/* Role */}
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
              </td>
              {/* Status */}
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </td>
              {/* Courses */}
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-3 w-14" />
              </td>
              {/* Last Login */}
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-20" />
              </td>
              {/* Actions */}
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * ButtonSkeleton - Specialized loading skeleton for button states
 * Replaces inline loading spinners in modals and forms for consistency
 */
export const ButtonSkeleton: React.FC<{ 
  className?: string;
  variant?: 'primary' | 'danger' | 'outline';
}> = ({ 
  className = '',
  variant = 'primary'
}) => {
  const variantClasses = {
    primary: 'bg-primary/10 border-primary/30',
    danger: 'bg-destructive/10 border-destructive/30', 
    outline: 'bg-muted border-border'
  };

  return (
    <div className={`flex items-center justify-center px-4 py-2 rounded border ${variantClasses[variant]} ${className}`}>
      <Skeleton className="h-4 w-4 rounded-full mr-2" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
};


/**
 * AdAnalyticsSkeleton - Specialized skeleton for admin analytics page
 * Matches the structure of /app/(admin)/admin/analytics/page.tsx
 * Includes KPI cards, chart placeholders, and analytics sections
 */
export const AdAnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-muted rounded-lg p-1">
            <Skeleton className="h-8 w-16 mr-1" />
            <Skeleton className="h-8 w-20 mr-1" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-background rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section 1: Revenue & User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background rounded-lg border p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="h-72 bg-muted rounded-lg flex items-center justify-center">
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
        
        <div className="bg-background rounded-lg border p-6">
          <Skeleton className="h-6 w-36 mb-4" />
          <div className="h-72 bg-muted rounded-lg flex items-center justify-center">
            <Skeleton className="h-48 w-48 rounded-full mx-auto" />
          </div>
        </div>
      </div>

      {/* Charts Section 2: Course & Activity Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background rounded-lg border p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="h-72 bg-muted rounded-lg flex items-center justify-center">
            <Skeleton className="h-48 w-48 rounded-full mx-auto" />
          </div>
        </div>
        
        <div className="bg-background rounded-lg border p-6">
          <Skeleton className="h-6 w-44 mb-4" />
          <div className="h-72 bg-muted rounded-lg flex items-center justify-center">
            <div className="flex items-end space-x-2 w-full h-40">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className={`w-8 ${index % 2 === 0 ? 'h-20' : 'h-16'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-background rounded-lg border p-6">
        <div className="flex items-center mb-4">
          <Skeleton className="h-5 w-5 mr-2" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
        <div className="flex items-start">
          <Skeleton className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-40 mb-1" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * AdMainPageSkeleton - Specialized skeleton for admin main page initial load
 * Used when accessing /admin route for the first time
 * Includes sidebar and main content area skeletons
 */
export const AdMainPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-muted">
      {/* Admin Header */}
      <div className="bg-background border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 mr-3" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-background h-screen shadow-sm">
          <div className="p-6">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex items-center p-3 rounded-lg">
                  <Skeleton className="h-5 w-5 mr-3" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          
          {/* Content Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-background rounded-lg border p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-background rounded-lg border p-6">
              <Skeleton className="h-6 w-36 mb-4" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

/**
 * MyCoursesGridSkeleton - Specialized skeleton for student enrolled courses
 * Matches the exact structure of /app/(dashboard)/my-courses/page.tsx
 * Includes course cards with progress bars, filters, and summary stats
 */
export const MyCoursesGridSkeleton: React.FC<{ courses?: number }> = ({ courses = 6 }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {Array.from({ length: courses }).map((_, index) => (
          <div key={index} className="bg-background rounded-lg shadow overflow-hidden">
            {/* Course Thumbnail */}
            <div className="relative h-48">
              <Skeleton className="w-full h-full" />
              {/* Completion Badge */}
              <div className="absolute top-2 right-2">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>

            {/* Course Info */}
            <div className="p-6">
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4 mb-4" />

              {/* Course Meta */}
              <div className="flex items-center gap-4 text-sm mb-4">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>

              {/* Watch Time */}
              <div className="flex items-center justify-between text-sm mb-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Skeleton className="flex-1 h-10 rounded" />
                <Skeleton className="h-10 w-24 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="p-6 bg-muted rounded-lg">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="h-8 w-12 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * FAQListSkeleton - Specialized skeleton for public FAQ page
 * Matches the exact structure of /app/(public)/faq/page.tsx
 * Includes expandable FAQ cards, search, filters, and pagination
 */
export const FAQListSkeleton: React.FC<{ faqs?: number }> = ({ faqs = 8 }) => {
  return (
    <div className="min-h-screen bg-muted py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-80 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-4 mb-8">
          {Array.from({ length: faqs }).map((_, index) => (
            <div key={index} className="bg-background rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <Skeleton className="h-6 w-full mb-2" />
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-3 rounded" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2 mb-16">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-16" />
        </div>

        {/* Contact Support */}
        <div className="bg-background rounded-lg shadow">
          <div className="py-8 text-center">
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-80 mx-auto mb-4" />
            <Skeleton className="h-10 w-32 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * AdFAQTableSkeleton - Specialized skeleton for admin FAQ management
 * Matches the exact structure of /app/(admin)/admin/faq/page.tsx
 * Includes table with checkboxes, filters, bulk actions, and modal support
 * 7 columns: Checkbox | Question | Category | Priority | Views | Status | Actions
 */
export const AdFAQTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Filters and Actions */}
      <div className="bg-background rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col gap-4">
          {/* Search and Category Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>

          {/* Bulk Actions (when items selected) */}
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Table */}
      <div className="bg-background rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                <th className="p-4 text-left">
                  <Skeleton className="h-4 w-4" />
                </th>
                <th className="p-4 text-left">
                  <Skeleton className="h-4 w-16" />
                </th>
                <th className="p-4 text-left">
                  <Skeleton className="h-4 w-16" />
                </th>
                <th className="p-4 text-left">
                  <Skeleton className="h-4 w-12" />
                </th>
                <th className="p-4 text-left">
                  <Skeleton className="h-4 w-12" />
                </th>
                <th className="p-4 text-left">
                  <Skeleton className="h-4 w-12" />
                </th>
                <th className="p-4 text-left">
                  <Skeleton className="h-4 w-14" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Array.from({ length: rows }).map((_, index) => (
                <tr key={index} className="hover:bg-muted">
                  {/* Checkbox */}
                  <td className="p-4">
                    <Skeleton className="h-4 w-4" />
                  </td>
                  {/* Question */}
                  <td className="p-4">
                    <div>
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </td>
                  {/* Category */}
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </td>
                  {/* Priority */}
                  <td className="p-4">
                    <Skeleton className="h-6 w-8 rounded-full" />
                  </td>
                  {/* Views */}
                  <td className="p-4">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  {/* Status */}
                  <td className="p-4">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </td>
                  {/* Actions */}
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * AdPaymentsTableSkeleton - Specialized skeleton for admin payment management
 * Matches the exact structure of AdminPaymentHistory.tsx component
 * 6 columns: Date | User | Description | Amount | Status | Actions
 */
export const AdPaymentsTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="bg-background rounded-lg shadow-sm border border-border overflow-hidden">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-8" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-8" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-12" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-12" />
            </th>
            <th className="px-6 py-3 text-left">
              <Skeleton className="h-4 w-14" />
            </th>
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="hover:bg-muted">
              {/* Date */}
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-20" />
              </td>
              {/* User */}
              <td className="px-6 py-4">
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </td>
              {/* Description */}
              <td className="px-6 py-4">
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </td>
              {/* Amount */}
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-16" />
              </td>
              {/* Status */}
              <td className="px-6 py-4">
                <Skeleton className="h-6 w-20 rounded-full" />
              </td>
              {/* Actions */}
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-20" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


/**
 * CertificatesGridSkeleton - Specialized skeleton for user certificates page
 * Matches the exact structure of /app/(dashboard)/certificates/page.tsx
 * Includes certificate cards with stats, filters, and summary section
 */
export const CertificatesGridSkeleton: React.FC<{ certificates?: number }> = ({ certificates = 6 }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {Array.from({ length: certificates }).map((_, index) => (
          <div key={index} className="bg-background rounded-lg shadow-lg overflow-hidden">
            {/* Certificate Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
              <div className="text-center">
                <Skeleton className="h-6 w-32 mx-auto mb-2 bg-background bg-opacity-20" />
                <Skeleton className="h-8 w-48 mx-auto mb-4 bg-background bg-opacity-20" />
                <Skeleton className="h-4 w-40 mx-auto bg-background bg-opacity-20" />
              </div>
            </div>

            {/* Certificate Body */}
            <div className="p-6">
              <div className="text-center mb-4">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-3" />
                <Skeleton className="h-5 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>

              {/* Certificate Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Skeleton className="flex-1 h-10 rounded" />
                <Skeleton className="h-10 w-10 rounded" />
                <Skeleton className="h-10 w-10 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-muted rounded-lg p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="text-center">
              <Skeleton className="h-8 w-12 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Admin Support Table Skeleton - 7 columns (Ticket | User | Category | Priority | Status | Created | Actions)
 */
export const AdSupportTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="overflow-hidden">
      {/* Table Header */}
      <div className="bg-muted px-6 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      
      {/* Table Body */}
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            <th className="px-6 py-3"><Skeleton className="h-3 w-12" /></th>
            <th className="px-6 py-3"><Skeleton className="h-3 w-8" /></th>
            <th className="px-6 py-3"><Skeleton className="h-3 w-16" /></th>
            <th className="px-6 py-3"><Skeleton className="h-3 w-12" /></th>
            <th className="px-6 py-3"><Skeleton className="h-3 w-12" /></th>
            <th className="px-6 py-3"><Skeleton className="h-3 w-14" /></th>
            <th className="px-6 py-3"><Skeleton className="h-3 w-14" /></th>
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="hover:bg-muted">
              {/* Ticket */}
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-3 w-32" />
              </td>
              {/* User */}
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </td>
              {/* Category */}
              <td className="px-6 py-4">
                <Skeleton className="h-6 w-20 rounded-full" />
              </td>
              {/* Priority */}
              <td className="px-6 py-4">
                <Skeleton className="h-6 w-16 rounded-full" />
              </td>
              {/* Status */}
              <td className="px-6 py-4">
                <Skeleton className="h-6 w-20 rounded-full" />
              </td>
              {/* Created */}
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-20" />
              </td>
              {/* Actions */}
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-16 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Course Detail Skeleton - Matches actual course detail page structure
export const CourseDetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-muted animate-pulse">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info - Left Side (2 columns) */}
            <div className="lg:col-span-2">
              {/* Breadcrumb */}
              <nav className="mb-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-16 bg-white/20" />
                  <span className="text-white/60">/</span>
                  <Skeleton className="h-4 w-20 bg-white/20" />
                </div>
              </nav>

              {/* Course Title & Description */}
              <Skeleton className="h-10 w-3/4 mb-4 bg-white/20" />
              <Skeleton className="h-6 w-full mb-2 bg-white/20" />
              <Skeleton className="h-6 w-2/3 mb-6 bg-white/20" />

              {/* Course Meta */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 bg-white/20" />
                  <Skeleton className="h-4 w-16 bg-white/20" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 bg-white/20" />
                  <Skeleton className="h-4 w-20 bg-white/20" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 bg-white/20" />
                  <Skeleton className="h-4 w-24 bg-white/20" />
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Skeleton key={star} className="h-5 w-5 bg-white/20" />
                  ))}
                </div>
                <Skeleton className="h-4 w-8 bg-white/20" />
                <Skeleton className="h-4 w-20 bg-white/20" />
              </div>

              {/* Creator */}
              <Skeleton className="h-5 w-48 bg-white/20" />
            </div>

            {/* Enrollment Card - Right Side (1 column) */}
            <div className="lg:col-span-1">
              <div className="bg-white text-foreground rounded-lg p-6">
                {/* Course Preview/Thumbnail */}
                <Skeleton className="w-full h-48 rounded-lg mb-6" />

                {/* Price */}
                <div className="mb-6">
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mb-6">
                  <Skeleton className="h-12 w-full rounded" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>

                {/* Course Includes */}
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 mb-3" />
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Tab Navigation */}
          <div className="border-b mb-8">
            <div className="flex space-x-8">
              {['Overview', 'Curriculum', 'Creator', 'Reviews'].map((tab, index) => (
                <div key={index} className="pb-4">
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                
                <div className="space-y-4">
                  <Skeleton className="h-6 w-56" />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                        <div className="space-y-2">
                          {Array.from({ length: 2 }).map((_, lessonIndex) => (
                            <div key={lessonIndex} className="flex items-center gap-3 pl-4">
                              <Skeleton className="h-4 w-4" />
                              <Skeleton className="h-4 flex-1" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <Skeleton className="h-5 w-32 mb-3" />
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <Skeleton className="h-5 w-28 mb-3" />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-4 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * DashboardSkeleton - Loading skeleton for dashboard page
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-background rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-background rounded-lg border p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-background rounded-lg border p-6">
            <Skeleton className="h-6 w-28 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile Page Skeleton - Form-based layout
export const ProfilePageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-pulse">
      {/* Page Title */}
      <div className="mb-8">
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-background border border-border rounded-lg p-6">
          <Skeleton className="h-7 w-40 mb-4" />
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <Skeleton className="h-4 w-12 mb-1" />
              <Skeleton className="h-10 w-full" />
            </div>
            {/* Email Field */}
            <div>
              <Skeleton className="h-4 w-12 mb-1" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-36 mt-1" />
            </div>
            {/* Bio Field */}
            <div>
              <Skeleton className="h-4 w-8 mb-1" />
              <Skeleton className="h-24 w-full" />
            </div>
            {/* Location Field */}
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Social Links Card */}
        <div className="bg-background border border-border rounded-lg p-6">
          <Skeleton className="h-7 w-28 mb-4" />
          <div className="space-y-4">
            {/* Website Field */}
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-10 w-full" />
            </div>
            {/* GitHub Field */}
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-10 w-full" />
            </div>
            {/* LinkedIn Field */}
            <div>
              <Skeleton className="h-4 w-18 mb-1" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
};

// Billing Page Skeleton - Dashboard-style layout
export const BillingPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-background py-8 animate-pulse">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>

        {/* 3-Column Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Current Plan Card */}
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="h-6 w-20 mb-2" />
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>

          {/* Usage Card */}
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-5 w-5" />
            </div>
            <div className="space-y-3">
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-8 w-8" />
              </div>
              <div>
                <Skeleton className="h-4 w-36 mb-1" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Next Billing Card */}
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-5" />
            </div>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

        {/* Subscription Management Card */}
        <div className="bg-background border border-border rounded-lg p-6 mb-8">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Subscription Details */}
            <div>
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-4 w-64 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
            {/* Right Column - Action Buttons */}
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Payment History Card */}
        <div className="bg-background border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-5" />
          </div>
          
          {/* Payment History Table Skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Support Card */}
        <div className="mt-8 bg-primary/20 border border-primary rounded-lg p-6">
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-4 w-80 mb-4" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Creator Analytics Skeleton - Analytics dashboard layout
export const CreatorAnalyticsSkeleton = () => {
  return (
    <div className="min-h-screen bg-muted/50 animate-pulse">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-80" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Overview Stats - 4 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue Card */}
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>

          {/* Total Payments Card */}
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>

          {/* Success Rate Card */}
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>

          {/* Total Students Card */}
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>

        {/* Charts Section: Top Revenue & Most Popular Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Revenue Courses */}
          <div className="bg-background border border-border rounded-lg p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Most Popular Courses */}
          <div className="bg-background border border-border rounded-lg p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Trends Chart (Full Width) */}
        <div className="bg-background border border-border rounded-lg p-6 mb-8">
          <Skeleton className="h-6 w-56 mb-4" />
          <div className="space-y-4">
            {/* 7-day chart representation */}
            <div className="grid grid-cols-7 gap-2 text-xs">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="text-center">
                  <Skeleton className="h-4 w-8 mx-auto mb-1" />
                  <div className="bg-primary/20 rounded p-2">
                    <Skeleton className="h-5 w-12 mb-1" />
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <Skeleton className="h-4 w-20 mb-1 mx-auto" />
                <Skeleton className="h-6 w-16 mx-auto" />
              </div>
              <div className="text-center">
                <Skeleton className="h-4 w-24 mb-1 mx-auto" />
                <Skeleton className="h-6 w-12 mx-auto" />
              </div>
              <div className="text-center">
                <Skeleton className="h-4 w-28 mb-1 mx-auto" />
                <Skeleton className="h-6 w-16 mx-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* Course Performance Details Table */}
        <div className="bg-background border border-border rounded-lg p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4"><Skeleton className="h-4 w-16" /></th>
                  <th className="text-left py-3 px-4"><Skeleton className="h-4 w-12" /></th>
                  <th className="text-right py-3 px-4"><Skeleton className="h-4 w-16" /></th>
                  <th className="text-right py-3 px-4"><Skeleton className="h-4 w-16" /></th>
                  <th className="text-right py-3 px-4"><Skeleton className="h-4 w-12" /></th>
                  <th className="text-right py-3 px-4"><Skeleton className="h-4 w-20" /></th>
                  <th className="text-center py-3 px-4"><Skeleton className="h-4 w-16" /></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Skeleton className="h-4 w-8" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Skeleton className="h-8 w-8 rounded" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Message */}
        <div className="mt-8 p-4 bg-primary/10 rounded-lg">
          <div className="flex items-start">
            <Skeleton className="h-4 w-12 mt-0.5 mr-2" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Creator Dashboard Skeleton - Dashboard-style layout  
export const CreatorDashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-muted animate-pulse">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue Card */}
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>

          {/* Total Students Card */}
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>

          {/* Total Courses Card */}
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-8 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>

          {/* Average Rating Card */}
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Courses */}
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-5" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-12 w-20 rounded" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-12 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-5" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
