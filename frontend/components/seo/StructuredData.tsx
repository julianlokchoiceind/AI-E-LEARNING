/**
 * Structured Data components for SEO
 */

import React from 'react';

interface StructuredDataProps {
  data: object;
}

/**
 * Generic structured data component
 */
export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data)
      }}
    />
  );
}

interface OrganizationProps {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    telephone?: string;
    email?: string;
    contactType?: string;
  };
  socialMedia?: string[];
}

/**
 * Organization structured data
 */
export function OrganizationStructuredData({
  name,
  url,
  logo,
  description,
  contactPoint,
  socialMedia
}: OrganizationProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    ...(logo && { logo }),
    ...(description && { description }),
    ...(contactPoint && { contactPoint }),
    ...(socialMedia && { sameAs: socialMedia })
  };

  return <StructuredData data={data} />;
}

interface WebsiteProps {
  name: string;
  url: string;
  description?: string;
  searchAction?: {
    target: string;
    queryInput: string;
  };
}

/**
 * Website structured data with search functionality
 */
export function WebsiteStructuredData({
  name,
  url,
  description,
  searchAction
}: WebsiteProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    ...(description && { description }),
    ...(searchAction && {
      potentialAction: {
        '@type': 'SearchAction',
        target: searchAction.target,
        'query-input': searchAction.queryInput
      }
    })
  };

  return <StructuredData data={data} />;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb structured data
 */
export function BreadcrumbStructuredData({ items }: BreadcrumbProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return <StructuredData data={data} />;
}

interface CourseProps {
  name: string;
  description: string;
  provider: {
    name: string;
    url: string;
  };
  instructor?: {
    name: string;
    url?: string;
  };
  category?: string;
  level?: string;
  duration?: number; // in minutes
  lessons?: number;
  language?: string;
  price?: {
    amount: number;
    currency: string;
  };
  rating?: {
    value: number;
    count: number;
  };
  image?: string;
  url?: string;
}

/**
 * Course structured data
 */
export function CourseStructuredData({
  name,
  description,
  provider,
  instructor,
  category,
  level,
  duration,
  lessons,
  language = 'vi-VN',
  price,
  rating,
  image,
  url
}: CourseProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: provider.name,
      url: provider.url
    },
    ...(instructor && {
      instructor: {
        '@type': 'Person',
        name: instructor.name,
        ...(instructor.url && { url: instructor.url })
      }
    }),
    ...(category && { courseCode: category }),
    ...(level && { educationalLevel: level }),
    ...(duration && { 
      timeRequired: `PT${Math.floor(duration / 60)}H${duration % 60}M` 
    }),
    ...(lessons && { numberOfCredits: lessons }),
    inLanguage: language,
    ...(price && {
      offers: {
        '@type': 'Offer',
        price: price.amount,
        priceCurrency: price.currency,
        availability: 'https://schema.org/InStock'
      }
    }),
    ...(rating && rating.count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.value,
        reviewCount: rating.count,
        bestRating: 5,
        worstRating: 1
      }
    }),
    ...(image && { image }),
    ...(url && { url })
  };

  return <StructuredData data={data} />;
}

interface VideoProps {
  name: string;
  description: string;
  thumbnail?: string;
  duration?: number; // in seconds
  uploadDate?: string;
  contentUrl?: string;
  embedUrl?: string;
  publisher?: {
    name: string;
    logo?: string;
  };
}

/**
 * Video structured data
 */
export function VideoStructuredData({
  name,
  description,
  thumbnail,
  duration,
  uploadDate,
  contentUrl,
  embedUrl,
  publisher
}: VideoProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    ...(thumbnail && { thumbnailUrl: thumbnail }),
    ...(duration && { 
      duration: `PT${Math.floor(duration / 60)}M${duration % 60}S` 
    }),
    ...(uploadDate && { uploadDate }),
    ...(contentUrl && { contentUrl }),
    ...(embedUrl && { embedUrl }),
    ...(publisher && {
      publisher: {
        '@type': 'Organization',
        name: publisher.name,
        ...(publisher.logo && {
          logo: {
            '@type': 'ImageObject',
            url: publisher.logo
          }
        })
      }
    })
  };

  return <StructuredData data={data} />;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

/**
 * FAQ structured data
 */
export function FAQStructuredData({ items }: FAQProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };

  return <StructuredData data={data} />;
}

interface ArticleProps {
  headline: string;
  description: string;
  image?: string;
  author: {
    name: string;
    url?: string;
  };
  publisher: {
    name: string;
    logo?: string;
  };
  datePublished: string;
  dateModified?: string;
  url?: string;
  wordCount?: number;
  keywords?: string[];
  section?: string;
  language?: string;
}

/**
 * Article structured data
 */
export function ArticleStructuredData({
  headline,
  description,
  image,
  author,
  publisher,
  datePublished,
  dateModified,
  url,
  wordCount,
  keywords,
  section,
  language = 'vi-VN'
}: ArticleProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    ...(image && { image }),
    author: {
      '@type': 'Person',
      name: author.name,
      ...(author.url && { url: author.url })
    },
    publisher: {
      '@type': 'Organization',
      name: publisher.name,
      ...(publisher.logo && {
        logo: {
          '@type': 'ImageObject',
          url: publisher.logo
        }
      })
    },
    datePublished,
    dateModified: dateModified || datePublished,
    ...(url && {
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url
      }
    }),
    ...(wordCount && { wordCount }),
    ...(keywords && { keywords: keywords.join(', ') }),
    ...(section && { articleSection: section }),
    inLanguage: language
  };

  return <StructuredData data={data} />;
}

interface ReviewProps {
  itemReviewed: {
    name: string;
    type: 'Course' | 'Product' | 'Service';
  };
  author: {
    name: string;
  };
  reviewRating: {
    ratingValue: number;
    bestRating?: number;
    worstRating?: number;
  };
  reviewBody: string;
  datePublished: string;
}

/**
 * Review structured data
 */
export function ReviewStructuredData({
  itemReviewed,
  author,
  reviewRating,
  reviewBody,
  datePublished
}: ReviewProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': itemReviewed.type,
      name: itemReviewed.name
    },
    author: {
      '@type': 'Person',
      name: author.name
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: reviewRating.ratingValue,
      bestRating: reviewRating.bestRating || 5,
      worstRating: reviewRating.worstRating || 1
    },
    reviewBody,
    datePublished
  };

  return <StructuredData data={data} />;
}

interface LearningResourceProps {
  name: string;
  description: string;
  learningResourceType: string;
  educationalLevel: string;
  teaches: string[];
  timeRequired?: number; // in minutes
  inLanguage?: string;
  author?: {
    name: string;
  };
  publisher?: {
    name: string;
  };
}

/**
 * Learning Resource structured data
 */
export function LearningResourceStructuredData({
  name,
  description,
  learningResourceType,
  educationalLevel,
  teaches,
  timeRequired,
  inLanguage = 'vi-VN',
  author,
  publisher
}: LearningResourceProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name,
    description,
    learningResourceType,
    educationalLevel,
    teaches,
    ...(timeRequired && { 
      timeRequired: `PT${Math.floor(timeRequired / 60)}H${timeRequired % 60}M` 
    }),
    inLanguage,
    ...(author && {
      author: {
        '@type': 'Person',
        name: author.name
      }
    }),
    ...(publisher && {
      publisher: {
        '@type': 'Organization',
        name: publisher.name
      }
    })
  };

  return <StructuredData data={data} />;
}