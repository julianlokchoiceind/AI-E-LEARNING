import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-elearning.com';
  
  const robotsTxt = `User-agent: *
Allow: /

# Allow search engines to crawl all public content
Allow: /courses
Allow: /about
Allow: /contact
Allow: /faq
Allow: /pricing
Allow: /blog

# Disallow private/auth pages
Disallow: /dashboard
Disallow: /admin
Disallow: /creator
Disallow: /my-courses
Disallow: /profile
Disallow: /billing
Disallow: /certificates
Disallow: /api/

# Disallow authentication pages (no SEO value)
Disallow: /login
Disallow: /register
Disallow: /reset-password

# Allow specific API endpoints that provide public data
Allow: /api/courses/public
Allow: /api/sitemap

# Crawl delay to be respectful
Crawl-delay: 1

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Special rules for common bots
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

# Block known bad bots
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /`;

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    }
  });
}