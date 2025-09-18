'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { BreadcrumbStructuredData } from './StructuredData';

export interface BreadcrumbItem {
  name: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  separator?: React.ReactNode;
}

/**
 * SEO-friendly breadcrumbs component with structured data
 */
export function Breadcrumbs({ 
  items, 
  className = '',
  showHome = true,
  separator
}: BreadcrumbsProps) {
  const { t } = useI18n();

  // Prepare items for structured data (only items with href)
  const structuredDataItems = items
    .filter(item => item.href)
    .map(item => ({
      name: item.name,
      url: `${process.env.NEXT_PUBLIC_APP_URL}${item.href}`
    }));

  // Add home to structured data if showHome is true
  if (showHome) {
    structuredDataItems.unshift({
      name: t('nav.home'),
      url: process.env.NEXT_PUBLIC_APP_URL || ''
    });
  }

  const defaultSeparator = <ChevronRight className="h-4 w-4 text-muted-foreground" />;

  return (
    <>
      <BreadcrumbStructuredData items={structuredDataItems} />
      
      <nav aria-label="Breadcrumb" className={`${className}`}>
        <ol className="flex items-center space-x-2 text-sm">
          {showHome && (
            <>
              <li>
                <Link 
                  href="/"
                  className="link-hover transition-colors flex items-center"
                  aria-label={t('nav.home')}
                >
                  <Home className="h-4 w-4" />
                  <span className="sr-only">{t('nav.home')}</span>
                </Link>
              </li>
              {items.length > 0 && (
                <li className="flex items-center">
                  {separator || defaultSeparator}
                </li>
              )}
            </>
          )}
          
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <li>
                {item.current || !item.href ? (
                  <span 
                    className="font-medium text-foreground"
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link 
                    href={item.href}
                    className="link-hover transition-colors"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
              
              {index < items.length - 1 && (
                <li className="flex items-center">
                  {separator || defaultSeparator}
                </li>
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>
    </>
  );
}

/**
 * Breadcrumbs specifically for course pages
 */
export function CourseBreadcrumbs({ 
  course,
  currentPage,
  className = ''
}: {
  course: {
    id: string;
    title: string;
    category: string;
  };
  currentPage?: string;
  className?: string;
}) {
  const { t } = useI18n();

  const items: BreadcrumbItem[] = [
    {
      name: t('nav.courses'),
      href: '/courses'
    },
    {
      name: course.category,
      href: `/courses?category=${course.category}`
    },
    {
      name: course.title,
      href: `/courses/${course.id}`,
      current: !currentPage
    }
  ];

  if (currentPage) {
    items.push({
      name: currentPage,
      current: true
    });
  }

  return <Breadcrumbs items={items} className={className} />;
}

/**
 * Breadcrumbs for lesson pages
 */
export function LessonBreadcrumbs({ 
  course,
  lesson,
  className = ''
}: {
  course: {
    id: string;
    title: string;
    category: string;
  };
  lesson: {
    id: string;
    title: string;
  };
  className?: string;
}) {
  const { t } = useI18n();

  const items: BreadcrumbItem[] = [
    {
      name: t('nav.courses'),
      href: '/courses'
    },
    {
      name: course.category,
      href: `/courses?category=${course.category}`
    },
    {
      name: course.title,
      href: `/courses/${course.id}`
    },
    {
      name: lesson.title,
      current: true
    }
  ];

  return <Breadcrumbs items={items} className={className} />;
}

/**
 * Breadcrumbs for admin pages
 */
export function AdminBreadcrumbs({ 
  items,
  className = ''
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  const { t } = useI18n();

  const adminItems: BreadcrumbItem[] = [
    {
      name: t('nav.dashboard'),
      href: '/dashboard'
    },
    {
      name: 'Admin',
      href: '/admin'
    },
    ...items
  ];

  return <Breadcrumbs items={adminItems} className={className} />;
}

/**
 * Breadcrumbs for creator pages
 */
export function CreatorBreadcrumbs({ 
  items,
  className = ''
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  const { t } = useI18n();

  const creatorItems: BreadcrumbItem[] = [
    {
      name: t('nav.dashboard'),
      href: '/dashboard'
    },
    {
      name: 'Creator Studio',
      href: '/creator'
    },
    ...items
  ];

  return <Breadcrumbs items={creatorItems} className={className} />;
}

/**
 * Compact breadcrumbs for mobile
 */
export function MobileBreadcrumbs({ 
  items, 
  className = '' 
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  const { t } = useI18n();

  // On mobile, only show the last 2 items
  const mobileItems = items.slice(-2);
  const hasMore = items.length > 2;

  return (
    <nav aria-label="Breadcrumb" className={`md:hidden ${className}`}>
      <ol className="flex items-center space-x-2 text-sm">
        {hasMore && (
          <>
            <li>
              <span className="text-muted-foreground">...</span>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </li>
          </>
        )}
        
        {mobileItems.map((item, index) => (
          <React.Fragment key={index}>
            <li>
              {item.current || !item.href ? (
                <span 
                  className="font-medium text-foreground truncate max-w-[120px]"
                  aria-current={item.current ? 'page' : undefined}
                  title={item.name}
                >
                  {item.name}
                </span>
              ) : (
                <Link 
                  href={item.href}
                  className="link-hover transition-colors truncate max-w-[120px]"
                  title={item.name}
                >
                  {item.name}
                </Link>
              )}
            </li>
            
            {index < mobileItems.length - 1 && (
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}