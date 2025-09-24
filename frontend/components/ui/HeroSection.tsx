import React from 'react';
import { Container } from './Container';
import { cn } from '@/lib/utils';

export interface HeroSectionProps {
  title: string | React.ReactNode;
  subtitle?: string;
  children?: React.ReactNode; // CTAs, search bars

  // Images (optional - fallback to gradient if not provided)
  backgroundImage?: string; // Desktop image (1920x600)
  tabletImage?: string; // Tablet-optimized image (1024x400)
  mobileImage?: string; // Mobile-optimized image (768x300)

  // Layout
  align?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg'; // Fixed heights instead of padding

  // Overlay (for text readability)
  overlayOpacity?: number; // 0.3 to 0.7 default 0.4

  className?: string;
}

export function HeroSection({
  title,
  subtitle,
  children,
  backgroundImage,
  tabletImage,
  mobileImage,
  align = 'center',
  size = 'md',
  overlayOpacity = 0.2,
  className
}: HeroSectionProps) {

  const sizeClasses = {
    sm: 'h-[250px] md:h-[350px] lg:h-[400px]',
    md: 'h-[250px] md:h-[350px] lg:h-[500px]',
    lg: 'h-[300px] md:h-[400px] lg:h-[500px]'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const justifyClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  return (
    <div className={cn('relative overflow-hidden', sizeClasses[size], className)}>
      {/* Background - Image or Gradient Fallback */}
      <div
        className={cn(
          'absolute inset-0',
          // If no backgroundImage, use gradient fallback like courses page
          !backgroundImage && 'bg-gradient-to-r from-primary to-primary/80'
        )}
        style={backgroundImage ? {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : undefined}
      />

      {/* Tablet Background - Image or inherit from desktop */}
      {tabletImage && (
        <div
          className="absolute inset-0 hidden md:block lg:hidden"
          style={{
            backgroundImage: `url(${tabletImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      {/* Mobile Background - Image or inherit gradient */}
      {mobileImage && (
        <div
          className="absolute inset-0 md:hidden"
          style={{
            backgroundImage: `url(${mobileImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      {/* Overlay for text readability - only if image exists */}
      {(backgroundImage || tabletImage || mobileImage) && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
        />
      )}

      {/* Content */}
      <Container
        variant="header"
        className={cn(
          'hero-content text-white relative z-10 h-full flex flex-col justify-center',
          alignClasses[align]
        )}
      >
        <h1 className="hero-title">{title}</h1>
        {subtitle && <p className="hero-subtitle opacity-90">{subtitle}</p>}
        {children && (
          <div className={cn('flex flex-wrap gap-4', justifyClasses[align])}>
            {children}
          </div>
        )}
      </Container>
    </div>
  );
}