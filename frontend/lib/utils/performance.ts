/**
 * Performance Monitoring Utilities
 * Tools for measuring and optimizing application performance
 */

// Performance timing interface
interface PerformanceTiming {
  startTime: number;
  endTime?: number;
  duration?: number;
  label: string;
}

// Performance metrics collector
class PerformanceMonitor {
  private timings: Map<string, PerformanceTiming> = new Map();
  private metrics: any[] = [];

  /**
   * Start timing a performance metric
   */
  startTiming(label: string): void {
    this.timings.set(label, {
      startTime: performance.now(),
      label,
    });
  }

  /**
   * End timing and calculate duration
   */
  endTiming(label: string): number | null {
    const timing = this.timings.get(label);
    if (!timing) {
      console.warn(`Performance timing '${label}' not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - timing.startTime;
    
    timing.endTime = endTime;
    timing.duration = duration;

    // Log performance metric
    this.logMetric(label, duration);
    
    return duration;
  }

  /**
   * Log performance metric
   */
  private logMetric(label: string, duration: number): void {
    const metric = {
      label,
      duration,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.pathname : 'server',
    };

    this.metrics.push(metric);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ Performance: ${label} took ${duration.toFixed(2)}ms`);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  /**
   * Send performance data to analytics
   */
  private sendToAnalytics(metric: any): void {
    // In a real implementation, send to your analytics service
    // Example: Google Analytics, Mixpanel, custom analytics endpoint
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metric', {
        custom_map: {
          metric_label: metric.label,
          metric_duration: metric.duration,
        }
      });
    }
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): any[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.timings.clear();
    this.metrics = [];
  }

  /**
   * Get performance summary
   */
  getSummary(): any {
    if (this.metrics.length === 0) {
      return { message: 'No performance metrics collected' };
    }

    const durations = this.metrics.map(m => m.duration);
    const total = durations.reduce((sum, d) => sum + d, 0);
    const average = total / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      totalMetrics: this.metrics.length,
      totalDuration: total,
      averageDuration: average,
      minDuration: min,
      maxDuration: max,
      metrics: this.metrics,
    };
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Performance timing decorator for functions
 */
export function measurePerformance(label: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      perfMonitor.startTiming(label);
      
      try {
        const result = method.apply(this, args);
        
        // Handle async functions
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            perfMonitor.endTiming(label);
          });
        }
        
        perfMonitor.endTiming(label);
        return result;
      } catch (error) {
        perfMonitor.endTiming(label);
        throw error;
      }
    };
  };
}

/**
 * Measure API call performance
 */
export async function measureApiCall<T>(
  label: string,
  apiCall: () => Promise<T>
): Promise<T> {
  perfMonitor.startTiming(`API: ${label}`);
  
  try {
    const result = await apiCall();
    perfMonitor.endTiming(`API: ${label}`);
    return result;
  } catch (error) {
    perfMonitor.endTiming(`API: ${label}`);
    throw error;
  }
}

/**
 * Measure React component render performance
 */
export function measureComponentRender(componentName: string) {
  return function <P extends {}>(Component: React.ComponentType<P>) {
    return function MeasuredComponent(props: P) {
      React.useEffect(() => {
        perfMonitor.startTiming(`Render: ${componentName}`);
        
        return () => {
          perfMonitor.endTiming(`Render: ${componentName}`);
        };
      }, []);

      return React.createElement(Component, props);
    };
  };
}

/**
 * Web Vitals measurement
 */
export function measureWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Measure Largest Contentful Paint (LCP)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    
    perfMonitor.logMetric('LCP', lastEntry.startTime);
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // Measure First Input Delay (FID)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry: any) => {
      const fid = entry.processingStart - entry.startTime;
      perfMonitor.logMetric('FID', fid);
    });
  }).observe({ entryTypes: ['first-input'] });

  // Measure Cumulative Layout Shift (CLS)
  let clsValue = 0;
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        perfMonitor.logMetric('CLS', clsValue);
      }
    });
  }).observe({ entryTypes: ['layout-shift'] });
}

/**
 * Memory usage monitoring
 */
export function measureMemoryUsage(): any {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return null;
  }

  const memory = (performance as any).memory;
  
  const memoryInfo = {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  };

  // Log memory usage
  perfMonitor.logMetric('Memory Usage %', memoryInfo.usagePercentage);
  
  return memoryInfo;
}

/**
 * Bundle size analysis helper
 */
export function analyzeBundleSize(): void {
  if (typeof window === 'undefined') return;

  // Measure script sizes
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  let totalSize = 0;

  scripts.forEach(async (script: any) => {
    try {
      const response = await fetch(script.src);
      const blob = await response.blob();
      const size = blob.size;
      totalSize += size;
      
      console.log(`📦 Script size: ${script.src} - ${(size / 1024).toFixed(2)}KB`);
    } catch (error) {
      console.warn('Could not measure script size:', script.src);
    }
  });

  console.log(`📦 Total bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
}

// Export React hook for performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  React.useEffect(() => {
    perfMonitor.startTiming(`Component: ${componentName}`);
    
    return () => {
      perfMonitor.endTiming(`Component: ${componentName}`);
    };
  }, [componentName]);

  return {
    startTiming: (label: string) => perfMonitor.startTiming(label),
    endTiming: (label: string) => perfMonitor.endTiming(label),
    getMetrics: () => perfMonitor.getMetrics(),
    getSummary: () => perfMonitor.getSummary(),
  };
}

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function for expensive operations
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  },

  // Throttle function for frequent events
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Lazy loading utility
  lazyLoad: (callback: () => void, rootMargin = '50px') => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observer.disconnect();
          }
        });
      },
      { rootMargin }
    );

    return observer;
  },
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Start web vitals measurement
  measureWebVitals();
  
  // Start memory monitoring
  setInterval(() => {
    measureMemoryUsage();
  }, 30000); // Every 30 seconds
  
  // Log performance summary on page unload
  window.addEventListener('beforeunload', () => {
    const summary = perfMonitor.getSummary();
    console.log('📊 Performance Summary:', summary);
  });
}