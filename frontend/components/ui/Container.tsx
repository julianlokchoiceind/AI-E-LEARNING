import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  variant?: 'admin' | 'public' | 'auth' | 'header';
  className?: string;
}

/**
 * Unified Container component - manages ALL padding and width constraints
 * Replaces individual container classes across the app for consistency
 */
export function Container({
  children,
  variant = 'public',
  className = ''
}: ContainerProps) {
  const variantClasses = {
    // Admin/Creator: Full width with padding (matches current layout)
    admin: 'p-6',

    // Header: Content width with only horizontal padding (no vertical)
    header: 'container mx-auto px-4 lg:px-8',

    // Public/Dashboard: Content width with responsive padding
    public: 'container mx-auto px-4 lg:px-8 py-12',

    // Auth: Narrow centered with padding
    auth: 'p-8 max-w-md mx-auto'
  };

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}