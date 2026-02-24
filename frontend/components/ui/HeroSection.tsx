import React, { useEffect, useRef } from 'react';
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
  size?: 'sm' | 'md' | 'lg' | 'fullscreen'; // Fixed heights or fullscreen

  // Overlay (for text readability)
  overlayOpacity?: number; // 0.3 to 0.7 default 0.4

  // Parallax (only for fullscreen)
  parallax?: boolean;
  parallaxSpeed?: number; // 0.1 to 0.5, default 0.3

  // Scroll indicator
  showScrollIndicator?: boolean;
  scrollIndicatorText?: string;

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
  parallax = false,
  parallaxSpeed = 0.3,
  showScrollIndicator = false,
  scrollIndicatorText,
  className
}: HeroSectionProps) {
  const bgRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'h-[250px] md:h-[350px] lg:h-[400px]',
    md: 'h-[250px] md:h-[350px] lg:h-[500px]',
    lg: 'h-[300px] md:h-[400px] lg:h-[500px]',
    fullscreen: 'min-h-[100svh] -mt-20' // Pull up behind fixed header
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

  // Parallax effect - only on desktop
  useEffect(() => {
    if (!parallax || typeof window === 'undefined') return;
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;

    const bgEl = bgRef.current;
    if (!bgEl) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const offset = scrollY * parallaxSpeed;
          bgEl.style.transform = `translate3d(0, ${offset}px, 0)`;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [parallax, parallaxSpeed]);

  const isFullscreen = size === 'fullscreen';

  return (
    <div ref={sectionRef} className={cn('relative overflow-hidden', sizeClasses[size], isFullscreen && 'flex flex-col', className)}>
      {/* Background - Image or Gradient Fallback */}
      <div
        ref={bgRef}
        className={cn(
          'absolute inset-0',
          !backgroundImage && 'bg-gradient-to-r from-primary to-primary/80',
          backgroundImage && !parallax && 'animate-kenburns',
          parallax && 'will-change-transform'
        )}
        style={{
          ...(backgroundImage ? {
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}),
          ...(parallax ? {
            top: '-15%',
            height: '130%',
            position: 'absolute',
            left: 0,
            right: 0
          } : {})
        }}
      />

      {/* Tablet Background - Image or inherit from desktop */}
      {tabletImage && (
        <div
          className="absolute inset-0 hidden md:block lg:hidden animate-kenburns"
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
          className="absolute inset-0 md:hidden animate-kenburns"
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
          'hero-content text-white relative z-10 flex flex-col justify-center',
          isFullscreen ? 'flex-1 pt-20 pb-16' : 'h-full',
          alignClasses[align]
        )}
      >
        <h1 className="hero-title">{title}</h1>
        {subtitle && <p className="hero-subtitle opacity-90">{subtitle}</p>}
        {children && (
          <div className={cn('flex flex-col sm:flex-row gap-4 w-full sm:w-auto', justifyClasses[align])}>
            {children}
          </div>
        )}
      </Container>

      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/70 text-sm flex flex-col items-center gap-1 animate-bounce">
          {scrollIndicatorText && <span>{scrollIndicatorText}</span>}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      )}
    </div>
  );
}