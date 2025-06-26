'use client';

import React from 'react';
import { useMobile, useMobilePerformance } from '@/hooks/useMobile';

interface MobileLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  type?: 'spinner' | 'dots' | 'skeleton' | 'pulse';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * Mobile-optimized loading component that adapts to device capabilities
 */
export function MobileLoading({ 
  size = 'md', 
  type = 'spinner',
  text,
  fullScreen = false,
  className = ''
}: MobileLoadingProps) {
  const { isMobile } = useMobile();
  const { shouldReduceAnimations } = useMobilePerformance();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // Reduce animations on low-power devices or slow connections
  const animationClass = shouldReduceAnimations ? '' : 'animate-spin';

  const LoadingSpinner = () => (
    <div className={`${sizeClasses[size]} ${animationClass} ${className}`}>
      <div className="border-2 border-gray-300 border-t-blue-600 rounded-full w-full h-full"></div>
    </div>
  );

  const LoadingDots = () => (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} bg-blue-600 rounded-full ${
            shouldReduceAnimations ? '' : 'animate-bounce'
          }`}
          style={{
            animationDelay: shouldReduceAnimations ? '0ms' : `${i * 200}ms`
          }}
        />
      ))}
    </div>
  );

  const LoadingSkeleton = () => (
    <div className={`space-y-3 ${className}`}>
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse"></div>
      </div>
    </div>
  );

  const LoadingPulse = () => (
    <div className={`${sizeClasses[size]} bg-blue-600 rounded-full ${
      shouldReduceAnimations ? 'opacity-50' : 'animate-pulse'
    } ${className}`} />
  );

  const renderLoading = () => {
    switch (type) {
      case 'dots':
        return <LoadingDots />;
      case 'skeleton':
        return <LoadingSkeleton />;
      case 'pulse':
        return <LoadingPulse />;
      default:
        return <LoadingSpinner />;
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-3">
      {renderLoading()}
      {text && (
        <p className={`text-gray-600 text-center ${textSizeClasses[size]} ${
          isMobile ? 'max-w-xs' : 'max-w-sm'
        }`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
}

interface MobileSkeletonProps {
  lines?: number;
  className?: string;
}

/**
 * Skeleton loading for mobile-optimized list items
 */
export function MobileSkeleton({ lines = 3, className = '' }: MobileSkeletonProps) {
  const { shouldReduceAnimations } = useMobilePerformance();

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 rounded ${
            shouldReduceAnimations ? '' : 'animate-pulse'
          }`}
          style={{
            width: `${Math.random() * 40 + 60}%`
          }}
        />
      ))}
    </div>
  );
}

interface MobileCardSkeletonProps {
  hasImage?: boolean;
  hasButton?: boolean;
  className?: string;
}

/**
 * Skeleton loading for mobile course cards
 */
export function MobileCardSkeleton({ 
  hasImage = true, 
  hasButton = true, 
  className = '' 
}: MobileCardSkeletonProps) {
  const { shouldReduceAnimations } = useMobilePerformance();
  const animationClass = shouldReduceAnimations ? '' : 'animate-pulse';

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {hasImage && (
        <div className={`h-40 sm:h-48 bg-gray-200 ${animationClass}`} />
      )}
      <div className="p-4 sm:p-6 space-y-3">
        {/* Title */}
        <div className={`h-6 bg-gray-200 rounded ${animationClass}`} />
        
        {/* Description lines */}
        <div className="space-y-2">
          <div className={`h-4 bg-gray-200 rounded ${animationClass}`} />
          <div className={`h-4 bg-gray-200 rounded w-3/4 ${animationClass}`} />
        </div>
        
        {/* Meta info */}
        <div className="flex space-x-4">
          <div className={`h-3 bg-gray-200 rounded w-16 ${animationClass}`} />
          <div className={`h-3 bg-gray-200 rounded w-20 ${animationClass}`} />
        </div>
        
        {hasButton && (
          <div className={`h-10 bg-gray-200 rounded ${animationClass}`} />
        )}
      </div>
    </div>
  );
}

interface MobileProgressIndicatorProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

/**
 * Mobile-optimized progress indicator
 */
export function MobileProgressIndicator({ 
  progress, 
  size = 'md', 
  showPercentage = true,
  className = '' 
}: MobileProgressIndicatorProps) {
  const { isMobile } = useMobile();

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className={`flex justify-between items-center mb-1 ${
          isMobile ? 'mb-2' : 'mb-1'
        }`}>
          <span className={`font-medium text-gray-700 ${textSizeClasses[size]}`}>
            Progress
          </span>
          <span className={`font-medium text-gray-900 ${textSizeClasses[size]}`}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`bg-blue-600 ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

interface MobileRefreshIndicatorProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  threshold?: number;
}

/**
 * Pull-to-refresh indicator for mobile
 * Note: This is a basic implementation. Full pull-to-refresh requires additional gesture handling
 */
export function MobileRefreshIndicator({ 
  isRefreshing, 
  onRefresh,
  threshold = 60 
}: MobileRefreshIndicatorProps) {
  const { isMobile } = useMobile();

  if (!isMobile || !isRefreshing) return null;

  return (
    <div className="flex justify-center py-4">
      <div className="flex items-center space-x-2 text-blue-600">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Refreshing...</span>
      </div>
    </div>
  );
}