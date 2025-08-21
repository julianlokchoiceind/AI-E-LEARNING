'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

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
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      {message && (
        <p className="mt-4 text-sm text-gray-600">{message}</p>
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
      <div className="bg-white rounded-lg p-6 shadow-xl">
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
      className={`bg-gray-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
    />
  );
};

export const CourseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
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
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
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
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="hover:bg-gray-50">
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
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
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
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="hover:bg-gray-50">
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
  text?: string;
  className?: string;
  variant?: 'primary' | 'danger' | 'outline';
}> = ({ 
  text = 'Loading...', 
  className = '',
  variant = 'primary'
}) => {
  const variantClasses = {
    primary: 'bg-blue-50 border-blue-200',
    danger: 'bg-red-50 border-red-200', 
    outline: 'bg-gray-50 border-gray-200'
  };

  return (
    <div className={`flex items-center justify-center px-4 py-2 rounded border ${variantClasses[variant]} ${className}`}>
      <Skeleton className="h-4 w-4 rounded-full mr-2" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
};

/**
 * DashboardSkeleton - Specialized skeleton for dashboard loading
 * Replaces LoadingSpinner in dashboard pages
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-10 w-10 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent courses section */}
        <div className="lg:col-span-2">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-24 h-16 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div>
            <Skeleton className="h-5 w-28 mb-3" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
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
          <div className="bg-gray-100 p-3 rounded-full">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="text-blue-600 hover:text-blue-700 font-medium"
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
          <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
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
      <div className="p-6 bg-gray-50 rounded-lg">
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
    <div className="min-h-screen bg-gray-50 py-12">
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
            <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
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
        <div className="bg-white rounded-lg shadow">
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
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col gap-4">
          {/* Search and Category Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>

          {/* Bulk Actions (when items selected) */}
          <div className="p-4 bg-blue-50 rounded-lg">
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
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
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
                <tr key={index} className="hover:bg-gray-50">
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
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
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="hover:bg-gray-50">
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
          <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Certificate Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="text-center">
                <Skeleton className="h-6 w-32 mx-auto mb-2 bg-white bg-opacity-20" />
                <Skeleton className="h-8 w-48 mx-auto mb-4 bg-white bg-opacity-20" />
                <Skeleton className="h-4 w-40 mx-auto bg-white bg-opacity-20" />
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
      <div className="bg-gray-50 rounded-lg p-6">
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
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      
      {/* Table Body */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
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
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="hover:bg-gray-50">
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