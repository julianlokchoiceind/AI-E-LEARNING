'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';

interface SEOHookProps {
  title?: string;
  description?: string;
  keywords?: string[];
  noIndex?: boolean;
  canonical?: string;
}

/**
 * Hook for dynamic SEO management
 */
export function useSEO({
  title,
  description,
  keywords,
  noIndex = false,
  canonical
}: SEOHookProps = {}) {
  const pathname = usePathname();
  const { locale } = useI18n();

  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    }

    // Update meta keywords
    if (keywords && keywords.length > 0) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords.join(', '));
    }

    // Update robots meta
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Update canonical URL
    if (canonical) {
      let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.href = canonical;
    }

    // Update Open Graph locale
    let ogLocale = document.querySelector('meta[property="og:locale"]');
    if (!ogLocale) {
      ogLocale = document.createElement('meta');
      ogLocale.setAttribute('property', 'og:locale');
      document.head.appendChild(ogLocale);
    }
    ogLocale.setAttribute('content', locale === 'vi' ? 'vi_VN' : 'en_US');

  }, [title, description, keywords, noIndex, canonical, locale]);

  return {
    pathname,
    locale
  };
}

/**
 * Hook for tracking page views and SEO analytics
 */
export function usePageTracking() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Track page view for analytics
    if (typeof window !== 'undefined') {
      // Google Analytics 4
      if (window.gtag) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
          page_location: window.location.href,
          page_path: pathname
        });
      }

      // Facebook Pixel
      if (window.fbq) {
        window.fbq('track', 'PageView');
      }

      // Custom analytics
      console.log('Page view tracked:', pathname);
    }
  }, [pathname]);

  const trackEvent = (eventName: string, parameters?: object) => {
    if (typeof window !== 'undefined') {
      // Google Analytics 4
      if (window.gtag) {
        window.gtag('event', eventName, parameters);
      }

      // Facebook Pixel
      if (window.fbq) {
        window.fbq('track', eventName, parameters);
      }

      // Custom analytics
      console.log('Event tracked:', eventName, parameters);
    }
  };

  const trackCourseView = (courseId: string, courseName: string) => {
    trackEvent('view_item', {
      item_id: courseId,
      item_name: courseName,
      item_category: 'course',
      currency: 'USD'
    });
  };

  const trackCourseEnrollment = (courseId: string, courseName: string, price: number) => {
    trackEvent('purchase', {
      transaction_id: `enrollment_${courseId}_${Date.now()}`,
      value: price,
      currency: 'USD',
      items: [{
        item_id: courseId,
        item_name: courseName,
        item_category: 'course',
        price: price,
        quantity: 1
      }]
    });
  };

  const trackLessonComplete = (courseId: string, lessonId: string, lessonName: string) => {
    trackEvent('lesson_complete', {
      course_id: courseId,
      lesson_id: lessonId,
      lesson_name: lessonName
    });
  };

  const trackSearch = (searchTerm: string, resultCount: number) => {
    trackEvent('search', {
      search_term: searchTerm,
      result_count: resultCount
    });
  };

  const trackVideoPlay = (videoId: string, videoTitle: string, position: number) => {
    trackEvent('video_play', {
      video_id: videoId,
      video_title: videoTitle,
      video_current_time: position
    });
  };

  return {
    trackEvent,
    trackCourseView,
    trackCourseEnrollment,
    trackLessonComplete,
    trackSearch,
    trackVideoPlay
  };
}

/**
 * Hook for generating sitemap data
 */
export function useSitemap() {
  const generateSitemapEntry = (
    url: string,
    lastmod?: string,
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
    priority?: number
  ) => {
    return {
      url,
      lastmod: lastmod || new Date().toISOString(),
      changefreq: changefreq || 'weekly',
      priority: priority || 0.5
    };
  };

  const generateCoursesSitemap = (courses: Array<{
    _id: string;
    title: string;
    updated_at: string;
  }>) => {
    return courses.map(course => 
      generateSitemapEntry(
        `/courses/${course._id}`,
        course.updated_at,
        'weekly',
        0.8
      )
    );
  };

  const generateLessonsSitemap = (lessons: Array<{
    _id: string;
    course_id: string;
    updated_at: string;
  }>) => {
    return lessons.map(lesson => 
      generateSitemapEntry(
        `/learn/${lesson.course_id}/${lesson._id}`,
        lesson.updated_at,
        'monthly',
        0.6
      )
    );
  };

  return {
    generateSitemapEntry,
    generateCoursesSitemap,
    generateLessonsSitemap
  };
}

/**
 * Hook for managing Open Graph and Twitter meta tags
 */
export function useSocialMeta() {
  const updateOpenGraph = (data: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
  }) => {
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        let metaTag = document.querySelector(`meta[property="og:${key}"]`);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('property', `og:${key}`);
          document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', value);
      }
    });
  };

  const updateTwitterCard = (data: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
    site?: string;
    creator?: string;
  }) => {
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        let metaTag = document.querySelector(`meta[name="twitter:${key}"]`);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('name', `twitter:${key}`);
          document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', value);
      }
    });
  };

  const generateSocialImage = (
    title: string,
    description?: string,
    author?: string
  ): string => {
    // This would typically call an API to generate dynamic social images
    const params = new URLSearchParams({
      title,
      ...(description && { description }),
      ...(author && { author })
    });
    
    return `/api/og-image?${params.toString()}`;
  };

  return {
    updateOpenGraph,
    updateTwitterCard,
    generateSocialImage
  };
}

/**
 * Hook for schema.org structured data management
 */
export function useStructuredData() {
  const addStructuredData = (data: object, id?: string) => {
    const scriptId = id || `structured-data-${Date.now()}`;
    
    // Remove existing script if updating
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data script
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return scriptId;
  };

  const removeStructuredData = (id: string) => {
    const script = document.getElementById(id);
    if (script) {
      script.remove();
    }
  };

  const generateBreadcrumbs = (
    items: Array<{ name: string; url: string }>
  ) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  };

  return {
    addStructuredData,
    removeStructuredData,
    generateBreadcrumbs
  };
}

// Global type declarations for analytics
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
  }
}