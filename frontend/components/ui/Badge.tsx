import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 
  | 'default' 
  | 'secondary' 
  | 'destructive' 
  | 'outline' 
  | 'success' 
  | 'warning' 
  | 'info'
  | 'draft'
  | 'published';

export type BadgeSize = 'sm' | 'md' | 'lg';

export type StatusType = 'draft' | 'published' | 'completed' | 'pending' | 'active' | 'inactive';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  status?: StatusType;
  showIcon?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    icon,
    status,
    showIcon = true,
    children,
    ...props 
  }, ref) => {
    // Auto-map status to variant if status is provided
    const effectiveVariant = status ? getStatusVariant(status) : variant;
    
    // Get status-specific icon if status is provided and no custom icon
    const effectiveIcon = icon || (status && showIcon ? getStatusIcon(status) : null);
    
    // Get status-specific text if status is provided and no children
    const effectiveText = children || (status ? getStatusText(status) : '');

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          // Base size classes
          {
            'px-2 py-1 text-xs': size === 'sm',
            'px-2.5 py-0.5 text-xs': size === 'md',
            'px-3 py-1.5 text-sm': size === 'lg',
          },
          // Variant classes
          {
            'bg-primary text-primary-foreground hover:bg-primary/80':
              effectiveVariant === 'default',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80':
              effectiveVariant === 'secondary',
            'bg-destructive text-destructive-foreground hover:bg-destructive/80':
              effectiveVariant === 'destructive',
            'text-foreground border border-input':
              effectiveVariant === 'outline',
            'bg-green-100 text-green-700 border border-green-200':
              effectiveVariant === 'success' || effectiveVariant === 'published',
            'bg-yellow-100 text-yellow-700 border border-yellow-200':
              effectiveVariant === 'warning',
            'bg-blue-100 text-blue-700 border border-blue-200':
              effectiveVariant === 'info',
            'bg-gray-100 text-gray-700 border border-gray-200':
              effectiveVariant === 'draft',
          },
          className
        )}
        {...props}
      >
        {effectiveIcon && (
          <span className={cn('mr-1 flex-shrink-0', {
            'w-3 h-3': size === 'sm' || size === 'md',
            'w-4 h-4': size === 'lg',
          })}>
            {effectiveIcon}
          </span>
        )}
        <span>{effectiveText}</span>
      </div>
    );
  }
);

// Helper function to map status to variant
function getStatusVariant(status: StatusType): BadgeVariant {
  switch (status) {
    case 'published':
    case 'completed':
    case 'active':
      return 'success';
    case 'draft':
    case 'pending':
    case 'inactive':
      return 'draft';
    default:
      return 'default';
  }
}

// Helper function to get status icon
function getStatusIcon(status: StatusType): React.ReactNode {
  switch (status) {
    case 'published':
    case 'completed':
    case 'active':
      return (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    case 'draft':
    case 'pending':
    case 'inactive':
      return (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      );
    default:
      return null;
  }
}

// Helper function to get status text
function getStatusText(status: StatusType): string {
  switch (status) {
    case 'published':
      return 'Published';
    case 'draft':
      return 'Draft';
    case 'completed':
      return 'Completed';
    case 'pending':
      return 'Pending';
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    default:
      return 'Unknown';
  }
}

Badge.displayName = 'Badge';

export { Badge };