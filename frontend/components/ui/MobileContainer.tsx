'use client';

import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Container component optimized for mobile layouts
 * Provides consistent spacing and responsive behavior
 */
export function MobileContainer({ 
  children, 
  className = '', 
  fullHeight = false,
  padding = 'md'
}: MobileContainerProps) {
  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12'
  };

  const heightClass = fullHeight ? 'min-h-screen' : '';

  return (
    <div className={`w-full ${heightClass} ${paddingClasses[padding]} ${className}`}>
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </div>
  );
}

interface MobileGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Responsive grid optimized for mobile-first design
 */
export function MobileGrid({ 
  children, 
  columns = 2, 
  gap = 'md',
  className = '' 
}: MobileGridProps) {
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

interface MobileStackProps {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

/**
 * Vertical stack component for mobile layouts
 */
export function MobileStack({ 
  children, 
  spacing = 'md',
  align = 'stretch',
  className = ''
}: MobileStackProps) {
  const spacingClasses = {
    sm: 'space-y-2 sm:space-y-3',
    md: 'space-y-4 sm:space-y-6',
    lg: 'space-y-6 sm:space-y-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  return (
    <div className={`flex flex-col ${spacingClasses[spacing]} ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  );
}

interface MobileSafeAreaProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Safe area component for handling notches and bottom bars on mobile
 */
export function MobileSafeArea({ children, className = '' }: MobileSafeAreaProps) {
  return (
    <div 
      className={`pt-safe-area-inset-top pb-safe-area-inset-bottom ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {children}
    </div>
  );
}

interface TouchableOpacityProps {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
  activeOpacity?: number;
}

/**
 * Touchable opacity component for mobile interactions
 */
export function TouchableOpacity({ 
  children, 
  onPress, 
  disabled = false,
  className = '',
  activeOpacity = 0.6
}: TouchableOpacityProps) {
  return (
    <button
      onClick={onPress}
      disabled={disabled}
      className={`touch-manipulation transition-all duration-150 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'active:opacity-60 cursor-pointer'
      } ${className}`}
      style={{
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {children}
    </button>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg';
}

/**
 * Card component optimized for mobile touch interfaces
 */
export function MobileCard({ 
  children, 
  className = '',
  padding = 'md',
  shadow = 'md',
  rounded = 'md'
}: MobileCardProps) {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md hover:shadow-lg',
    lg: 'shadow-lg hover:shadow-xl'
  };

  const roundedClasses = {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl'
  };

  return (
    <div className={`
      bg-white transition-shadow duration-200
      ${paddingClasses[padding]}
      ${shadowClasses[shadow]}
      ${roundedClasses[rounded]}
      ${className}
    `}>
      {children}
    </div>
  );
}