import { NextResponse } from 'next/server';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://aitc.choiceind.com').replace(/\/$/, '');
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://aitc-api.choiceind.com/api/v1').replace(/\/$/, '');

const staticPages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/courses', changefreq: 'daily', priority: 0.9 },
  { url: '/about', changefreq: 'monthly', priority: 0.6 },
  { url: '/contact', changefreq: 'monthly', priority: 0.5 },
  { url: '/faq', changefreq: 'weekly', priority: 0.7 },
  { url: '/pricing', changefreq: 'weekly', priority: 0.8 },
];

interface CourseItem {
  id: string;
  slug?: string;
  updated_at?: string;
}

async function fetchPublicCourses(): Promise<CourseItem[]> {
  try {
    const res = await fetch(`${API_URL}/courses?limit=1000`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.courses || data?.data || [];
  } catch {
    return [];
  }
}

function generateSitemapXML(
  staticEntries: typeof staticPages,
  courseEntries: CourseItem[]
) {
  const now = new Date().toISOString();

  const staticUrls = staticEntries
    .map(
      (page) => `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n');

  const courseUrls = courseEntries
    .map((course) => {
      const path = `/courses/${course.id}`;
      const lastmod = course.updated_at ? new Date(course.updated_at).toISOString() : now;
      return `  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${courseUrls}
</urlset>`;
}

export async function GET() {
  try {
    const courses = await fetchPublicCourses();
    const sitemap = generateSitemapXML(staticPages, courses);

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
