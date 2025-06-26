'use client';

import { useState, useEffect } from 'react';

interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenSize: 'mobile' | 'tablet' | 'desktop' | 'large';
  orientation: 'portrait' | 'landscape';
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Hook for detecting mobile devices and screen properties
 */
export function useMobile(): MobileDetectionResult {
  const [detection, setDetection] = useState<MobileDetectionResult>(() => {
    // Server-side safe defaults
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        screenSize: 'desktop',
        orientation: 'landscape',
        deviceType: 'desktop'
      };
    }

    return detectDevice();
  });

  function detectDevice(): MobileDetectionResult {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        screenSize: 'desktop',
        orientation: 'landscape',
        deviceType: 'desktop'
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Screen size detection
    const isMobile = width <= 768;
    const isTablet = width > 768 && width <= 1024;
    const isDesktop = width > 1024;
    
    // Touch device detection
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Screen size categories
    let screenSize: 'mobile' | 'tablet' | 'desktop' | 'large';
    if (width <= 640) {
      screenSize = 'mobile';
    } else if (width <= 1024) {
      screenSize = 'tablet';
    } else if (width <= 1440) {
      screenSize = 'desktop';
    } else {
      screenSize = 'large';
    }
    
    // Orientation
    const orientation = width > height ? 'landscape' : 'portrait';
    
    // Device type (combination of size and touch capability)
    let deviceType: 'mobile' | 'tablet' | 'desktop';
    if (isMobile || (isTouchDevice && width <= 768)) {
      deviceType = 'mobile';
    } else if (isTablet || (isTouchDevice && width <= 1024)) {
      deviceType = 'tablet';
    } else {
      deviceType = 'desktop';
    }

    return {
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      screenSize,
      orientation,
      deviceType
    };
  }

  useEffect(() => {
    const handleResize = () => {
      setDetection(detectDevice());
    };

    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated
      setTimeout(() => {
        setDetection(detectDevice());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Initial detection
    setDetection(detectDevice());

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return detection;
}

/**
 * Hook for mobile-specific preferences and settings
 */
export function useMobilePreferences() {
  const [preferences, setPreferences] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        reduceMotion: false,
        highContrast: false,
        fontSize: 'normal',
        hapticFeedback: true
      };
    }

    return {
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      fontSize: localStorage.getItem('mobile-font-size') || 'normal',
      hapticFeedback: localStorage.getItem('haptic-feedback') !== 'false'
    };
  });

  const updateFontSize = (size: 'small' | 'normal' | 'large') => {
    setPreferences(prev => ({ ...prev, fontSize: size }));
    localStorage.setItem('mobile-font-size', size);
    
    // Apply font size to document
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
    if (size === 'small') {
      document.documentElement.classList.add('text-sm');
    } else if (size === 'large') {
      document.documentElement.classList.add('text-lg');
    }
  };

  const toggleHapticFeedback = () => {
    const newValue = !preferences.hapticFeedback;
    setPreferences(prev => ({ ...prev, hapticFeedback: newValue }));
    localStorage.setItem('haptic-feedback', newValue.toString());
  };

  const vibrate = (pattern: number | number[] = 50) => {
    if (preferences.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  return {
    ...preferences,
    updateFontSize,
    toggleHapticFeedback,
    vibrate
  };
}

/**
 * Hook for handling mobile keyboard interactions
 */
export function useMobileKeyboard() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(() => {
    return typeof window !== 'undefined' ? window.innerHeight : 0;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialHeight = window.innerHeight;
    setViewportHeight(initialHeight);

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      // Keyboard is likely visible if height decreased significantly
      const isKeyboardVisible = heightDifference > 150;
      
      setKeyboardVisible(isKeyboardVisible);
      setViewportHeight(currentHeight);
    };

    window.addEventListener('resize', handleResize);
    
    // Handle focus events for input fields
    const handleFocusIn = () => {
      setTimeout(() => {
        setKeyboardVisible(true);
      }, 300);
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        setKeyboardVisible(false);
      }, 300);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return {
    keyboardVisible,
    viewportHeight,
    isKeyboardOpen: keyboardVisible
  };
}

/**
 * Hook for mobile scroll behavior and utilities
 */
export function useMobileScroll() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastScrollY = window.scrollY;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setScrollY(currentScrollY);
      setIsScrolling(true);
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }
      
      lastScrollY = currentScrollY;
      
      // Clear scrolling state after scroll stops
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return {
    scrollY,
    scrollDirection,
    isScrolling,
    scrollToTop,
    scrollToElement
  };
}

/**
 * Hook for mobile performance optimizations
 */
export function useMobilePerformance() {
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for low power mode indicators
    const checkLowPowerMode = () => {
      // Battery API (limited browser support)
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          setIsLowPowerMode(battery.level < 0.2 || battery.charging === false);
        });
      }
    };

    // Check connection type
    const updateConnectionType = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
      }
    };

    checkLowPowerMode();
    updateConnectionType();

    // Listen for battery changes
    window.addEventListener('batterychange', checkLowPowerMode);
    
    // Listen for connection changes
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateConnectionType);
    }

    return () => {
      window.removeEventListener('batterychange', checkLowPowerMode);
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);

  const shouldReduceAnimations = isLowPowerMode || connectionType === 'slow-2g' || connectionType === '2g';
  const shouldLazyLoad = connectionType === 'slow-2g' || connectionType === '2g' || connectionType === '3g';

  return {
    isLowPowerMode,
    connectionType,
    shouldReduceAnimations,
    shouldLazyLoad
  };
}