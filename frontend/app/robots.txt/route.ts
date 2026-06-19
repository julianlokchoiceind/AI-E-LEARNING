import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aitc.choiceind.com';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /courses
Allow: /about
Allow: /contact
Allow: /faq
Allow: /pricing

Disallow: /dashboard
Disallow: /admin
Disallow: /creator
Disallow: /my-courses
Disallow: /profile
Disallow: /billing
Disallow: /certificates
Disallow: /api/
Disallow: /login
Disallow: /register
Disallow: /reset-password

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

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

Sitemap: ${BASE_URL}/sitemap.xml`;

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
