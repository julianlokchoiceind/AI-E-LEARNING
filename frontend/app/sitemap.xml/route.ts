import { NextResponse } from 'next/server';

// This would typically fetch from your database
const staticPages = [
  {
    url: '/',
    lastmod: new Date().toISOString(),
    changefreq: 'daily',
    priority: 1.0
  },
  {
    url: '/courses',
    lastmod: new Date().toISOString(),
    changefreq: 'daily',
    priority: 0.9
  },
  {
    url: '/about',
    lastmod: new Date().toISOString(),
    changefreq: 'monthly',
    priority: 0.6
  },
  {
    url: '/contact',
    lastmod: new Date().toISOString(),
    changefreq: 'monthly',
    priority: 0.5
  },
  {
    url: '/faq',
    lastmod: new Date().toISOString(),
    changefreq: 'weekly',
    priority: 0.7
  },
  {
    url: '/pricing',
    lastmod: new Date().toISOString(),
    changefreq: 'weekly',
    priority: 0.8
  },
  {
    url: '/login',
    lastmod: new Date().toISOString(),
    changefreq: 'yearly',
    priority: 0.3
  },
  {
    url: '/register',
    lastmod: new Date().toISOString(),
    changefreq: 'yearly',
    priority: 0.3
  }
];

function generateSitemapXML(pages: Array<{
  url: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}>) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-elearning.com';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="vi" href="${baseUrl}/vi${page.url}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en${page.url}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${page.url}"/>
  </url>`).join('\n')}
</urlset>`;
}

export async function GET() {
  try {
    // In a real application, you would fetch dynamic content from your database
    // const courses = await fetchCourses();
    // const dynamicPages = courses.map(course => ({
    //   url: `/courses/${course.id}`,
    //   lastmod: course.updated_at,
    //   changefreq: 'weekly',
    //   priority: 0.8
    // }));

    // For now, using static pages only
    const allPages = [...staticPages];
    
    const sitemap = generateSitemapXML(allPages);

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}