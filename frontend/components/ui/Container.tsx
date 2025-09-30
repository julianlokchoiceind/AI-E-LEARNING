import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  variant?: 'admin' | 'public' | 'auth' | 'header';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Unified Container component - manages ALL padding and width constraints
 * Replaces individual container classes across the app for consistency
 */
export function Container({
  children,
  variant = 'public',
  className = '',
  style
}: ContainerProps) {
  const variantClasses = {
    // Admin/Creator: Full width with padding (matches current layout)
    admin: 'p-6',

    // Header: Content width with only horizontal padding (no vertical)
    header: 'container mx-auto px-4 lg:px-8',

    // Public/Dashboard: Content width with responsive padding
    public: 'container mx-auto px-4 lg:px-8 py-12',

    // Auth: Comfortable width - responsive padding across breakpoints
    auth: 'p-5 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-sm mx-auto'
  };

  return (
    <div className={`${variantClasses[variant]} ${className}`} style={style}>
      {children}
    </div>
  );
}