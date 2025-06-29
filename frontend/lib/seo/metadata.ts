/**
 * SEO metadata utilities and configurations
 */

import { Metadata } from 'next';
import { Locale } from '@/lib/i18n/config';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  locale?: Locale;
  alternateLocales?: Locale[];
  ogImage?: string;
  ogType?: 'website' | 'article' | 'video.other';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  noIndex?: boolean;
  structuredData?: object;
}

export const DEFAULT_SEO = {
  siteName: 'AI E-Learning Platform',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://ai-elearning.com',
  defaultTitle: 'AI E-Learning Platform - Master AI/ML Programming',
  defaultDescription: 'Learn AI and Machine Learning through high-quality video courses with intelligent AI assistants. Vietnamese AI programming education platform.',
  defaultKeywords: [
    'AI programming',
    'Machine Learning',
    'E-Learning',
    'Online Courses',
    'Vietnamese education',
    'Programming tutorials',
    'AI assistant',
    'Deep Learning',
    'Python',
    'TensorFlow',
    'Computer Vision',
    'NLP'
  ],
  defaultImage: '/images/og-default.jpg',
  twitterHandle: '@aielearning',
  facebookAppId: '1234567890',
  googleSiteVerification: 'your-google-verification-code',
  bingVerification: 'your-bing-verification-code'
};

/**
 * Generate comprehensive metadata for pages
 */
export function generateMetadata({
  title,
  description,
  keywords = [],
  canonical,
  locale = 'vi',
  alternateLocales = ['en', 'vi'],
  ogImage,
  ogType = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  noIndex = false,
  structuredData
}: SEOProps = {}): Metadata {
  const fullTitle = title 
    ? `${title} | ${DEFAULT_SEO.siteName}`
    : DEFAULT_SEO.defaultTitle;
  
  const finalDescription = description || DEFAULT_SEO.defaultDescription;
  const finalKeywords = [...DEFAULT_SEO.defaultKeywords, ...keywords];
  const finalImage = ogImage || DEFAULT_SEO.defaultImage;
  const canonicalUrl = canonical ? `${DEFAULT_SEO.siteUrl}${canonical}` : undefined;

  // Generate alternate language URLs
  const alternates = alternateLocales.reduce((acc, loc) => {
    if (canonical) {
      acc[loc] = `${DEFAULT_SEO.siteUrl}/${loc}${canonical}`;
    }
    return acc;
  }, {} as Record<string, string>);

  const metadata: Metadata = {
    title: fullTitle,
    description: finalDescription,
    keywords: finalKeywords.join(', '),
    authors: author ? [{ name: author }] : [{ name: 'AI E-Learning Team' }],
    creator: 'AI E-Learning Platform',
    publisher: 'AI E-Learning Platform',
    
    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
      languages: alternates
    },

    // Robots
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Open Graph
    openGraph: {
      type: ogType,
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      alternateLocale: alternateLocales.map(loc => 
        loc === 'vi' ? 'vi_VN' : 'en_US'
      ).filter(loc => loc !== (locale === 'vi' ? 'vi_VN' : 'en_US')),
      title: fullTitle,
      description: finalDescription,
      url: canonicalUrl,
      siteName: DEFAULT_SEO.siteName,
      images: [
        {
          url: finalImage,
          width: 1200,
          height: 630,
          alt: title || DEFAULT_SEO.defaultTitle,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(section && { section }),
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      site: DEFAULT_SEO.twitterHandle,
      creator: DEFAULT_SEO.twitterHandle,
      title: fullTitle,
      description: finalDescription,
      images: [finalImage],
    },

    // Facebook
    ...(DEFAULT_SEO.facebookAppId && {
      facebook: {
        appId: DEFAULT_SEO.facebookAppId,
      },
    }),

    // Verification
    verification: {
      google: DEFAULT_SEO.googleSiteVerification,
      other: {
        'msvalidate.01': DEFAULT_SEO.bingVerification,
      },
    },

    // Additional meta tags
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': DEFAULT_SEO.siteName,
      'application-name': DEFAULT_SEO.siteName,
      'msapplication-TileColor': '#2563eb',
      'theme-color': '#2563eb',
    },
  };

  return metadata;
}

/**
 * Generate course-specific metadata
 */
export function generateCourseMetadata({
  course,
  locale = 'vi'
}: {
  course: {
    title: string;
    description: string;
    short_description?: string;
    creator_name: string;
    category: string;
    level: string;
    thumbnail?: string;
    total_lessons: number;
    total_duration: number;
    stats: {
      average_rating: number;
      total_reviews: number;
      total_enrollments: number;
    };
    pricing: {
      is_free: boolean;
      price: number;
    };
  };
  locale?: Locale;
}): Metadata {
  const title = `${course.title} - ${course.creator_name}`;
  const description = course.short_description || course.description;
  const keywords = [
    course.category,
    course.level,
    'programming course',
    'online learning',
    'AI programming',
    course.creator_name
  ];

  // Course-specific structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: description,
    provider: {
      '@type': 'Organization',
      name: DEFAULT_SEO.siteName,
      url: DEFAULT_SEO.siteUrl
    },
    instructor: {
      '@type': 'Person',
      name: course.creator_name
    },
    courseCode: course.category,
    educationalLevel: course.level,
    numberOfCredits: course.total_lessons,
    timeRequired: `PT${Math.floor(course.total_duration / 60)}H${course.total_duration % 60}M`,
    inLanguage: locale === 'vi' ? 'vi-VN' : 'en-US',
    ...(course.pricing.is_free ? {} : {
      offers: {
        '@type': 'Offer',
        price: course.pricing.price,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock'
      }
    }),
    aggregateRating: course.stats.total_reviews > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: course.stats.average_rating,
      reviewCount: course.stats.total_reviews,
      bestRating: 5,
      worstRating: 1
    } : undefined,
    image: course.thumbnail || DEFAULT_SEO.defaultImage,
    url: `${DEFAULT_SEO.siteUrl}/courses/${course.title.toLowerCase().replace(/\s+/g, '-')}`
  };

  return generateMetadata({
    title,
    description,
    keywords,
    ogType: 'article',
    ogImage: course.thumbnail,
    locale,
    structuredData
  });
}

/**
 * Generate lesson-specific metadata
 */
export function generateLessonMetadata({
  lesson,
  course,
  locale = 'vi'
}: {
  lesson: {
    title: string;
    description?: string;
    order: number;
    video?: {
      duration: number;
      thumbnail?: string;
    };
  };
  course: {
    title: string;
    creator_name: string;
  };
  locale?: Locale;
}): Metadata {
  const title = `${lesson.title} - ${course.title}`;
  const description = lesson.description || 
    `Lesson ${lesson.order} in ${course.title} course by ${course.creator_name}`;

  const keywords = [
    'video lesson',
    'programming tutorial',
    'online learning',
    course.title,
    course.creator_name
  ];

  // Video-specific structured data
  const structuredData = lesson.video ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: lesson.title,
    description: description,
    thumbnailUrl: lesson.video.thumbnail || DEFAULT_SEO.defaultImage,
    duration: `PT${Math.floor(lesson.video.duration / 60)}M${lesson.video.duration % 60}S`,
    uploadDate: new Date().toISOString(),
    publisher: {
      '@type': 'Organization',
      name: DEFAULT_SEO.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${DEFAULT_SEO.siteUrl}/logo.png`
      }
    }
  } : undefined;

  return generateMetadata({
    title,
    description,
    keywords,
    ogType: 'video.other',
    ogImage: lesson.video?.thumbnail,
    locale,
    structuredData
  });
}

/**
 * Generate FAQ-specific metadata
 */
export function generateFAQMetadata({
  faqs,
  locale = 'vi'
}: {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  locale?: Locale;
}): Metadata {
  const title = locale === 'vi' ? 'Câu hỏi thường gặp' : 'Frequently Asked Questions';
  const description = locale === 'vi' 
    ? 'Tìm câu trả lời cho các câu hỏi thường gặp về nền tảng học lập trình AI của chúng tôi.'
    : 'Find answers to frequently asked questions about our AI programming learning platform.';

  const keywords = locale === 'vi' 
    ? ['câu hỏi thường gặp', 'hỗ trợ', 'học lập trình AI', 'hướng dẫn']
    : ['FAQ', 'support', 'AI programming', 'help', 'guide'];

  // FAQ structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return generateMetadata({
    title,
    description,
    keywords,
    locale,
    structuredData
  });
}

/**
 * Generate blog/article metadata
 */
export function generateArticleMetadata({
  title,
  description,
  content,
  author,
  publishedTime,
  modifiedTime,
  tags = [],
  featuredImage,
  locale = 'vi'
}: {
  title: string;
  description: string;
  content: string;
  author: string;
  publishedTime: string;
  modifiedTime?: string;
  tags?: string[];
  featuredImage?: string;
  locale?: Locale;
}): Metadata {
  const keywords = [
    ...tags,
    'AI programming',
    'machine learning',
    'tutorial',
    'guide'
  ];

  // Article structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: featuredImage || DEFAULT_SEO.defaultImage,
    author: {
      '@type': 'Person',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      name: DEFAULT_SEO.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${DEFAULT_SEO.siteUrl}/logo.png`
      }
    },
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${DEFAULT_SEO.siteUrl}/blog/${title.toLowerCase().replace(/\s+/g, '-')}`
    },
    wordCount: content.split(' ').length,
    keywords: keywords.join(', '),
    articleSection: 'AI Programming Education',
    inLanguage: locale === 'vi' ? 'vi-VN' : 'en-US'
  };

  return generateMetadata({
    title,
    description,
    keywords,
    ogType: 'article',
    ogImage: featuredImage,
    publishedTime,
    modifiedTime,
    author,
    section: 'AI Programming Education',
    locale,
    structuredData
  });
}