import { withAuth } from 'next-auth/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { 
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  Locale,
  isValidLocale,
  getLocaleFromPath,
  getPathnameWithoutLocale,
  getLocalizedPath
} from './lib/i18n/config'

/**
 * Get preferred locale from request headers and cookies
 */
function getPreferredLocale(request: NextRequest): Locale {
  // 1. Check cookie preference
  const cookieLocale = request.cookies.get('locale')?.value
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return cookieLocale as Locale
  }
  
  // 2. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const browserLocales = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].split('-')[0].trim())
      .filter(lang => isValidLocale(lang))
    
    if (browserLocales.length > 0) {
      return browserLocales[0] as Locale
    }
  }
  
  // 3. Fallback to default locale
  return DEFAULT_LOCALE
}

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname

    // Skip middleware for API routes, static files, and Next.js internals
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/static/') ||
      pathname.includes('.') // files with extensions
    ) {
      return NextResponse.next()
    }

    // Handle i18n routing
    const pathLocale = getLocaleFromPath(pathname)
    const pathnameWithoutLocale = getPathnameWithoutLocale(pathname)
    const preferredLocale = getPreferredLocale(req)

    // Determine if URL has explicit locale prefix
    const hasLocalePrefix = SUPPORTED_LOCALES.some(
      locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    // Current locale: from URL if prefixed, otherwise from preference
    const currentLocale = hasLocalePrefix ? pathLocale : preferredLocale

    // Check if this is a locale-prefixed URL that needs rewriting
    // Handle both /vi/path and /vi (homepage)
    const needsRewrite = currentLocale !== DEFAULT_LOCALE &&
      (pathname.startsWith(`/${currentLocale}/`) || pathname === `/${currentLocale}`)

    // If default locale in URL (e.g., /en/dashboard), redirect to clean URL (/dashboard)
    if (pathLocale === DEFAULT_LOCALE && pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
      return NextResponse.redirect(new URL(pathnameWithoutLocale, req.url))
    }

    // Check if this is admin/creator route (no i18n)
    const isInternalPortal = pathnameWithoutLocale.startsWith('/admin') ||
                             pathnameWithoutLocale.startsWith('/creator')

    // If user has non-default locale preference but URL doesn't have locale prefix,
    // redirect to locale-prefixed URL (e.g., /dashboard -> /vi/dashboard)
    // EXCEPT for admin/creator routes which don't support i18n
    if (!hasLocalePrefix && preferredLocale !== DEFAULT_LOCALE && !isInternalPortal) {
      const localizedPath = `/${preferredLocale}${pathname === '/' ? '' : pathname}`
      const url = new URL(localizedPath, req.url)
      url.search = req.nextUrl.search
      return NextResponse.redirect(url)
    }

    // Then handle authentication
    const token = req.nextauth.token
    const isAuth = !!token
    const userRole = token?.role as string
    
    // Define route types (check against clean pathname)
    const isAuthPage = pathnameWithoutLocale.startsWith('/login') || 
                      pathnameWithoutLocale.startsWith('/register') ||
                      pathnameWithoutLocale.startsWith('/forgot-password') ||
                      pathnameWithoutLocale.startsWith('/reset-password')
    
    const isPublicRoute = pathnameWithoutLocale === '/' ||
                         pathnameWithoutLocale.startsWith('/courses') ||
                         pathnameWithoutLocale.startsWith('/about') ||
                         pathnameWithoutLocale.startsWith('/contact') ||
                         pathnameWithoutLocale.startsWith('/faq') ||
                         pathnameWithoutLocale.startsWith('/pricing') ||
                         pathnameWithoutLocale.startsWith('/terms') ||
                         pathnameWithoutLocale.startsWith('/privacy') ||
                         pathnameWithoutLocale.startsWith('/verify') ||
                         pathnameWithoutLocale.startsWith('/preview')
    
    // Redirect /vi/admin and /vi/creator to /admin and /creator (no i18n for internal portals)
    if (isInternalPortal && hasLocalePrefix) {
      return NextResponse.redirect(new URL(pathnameWithoutLocale, req.url))
    }

    // Define protected routes that require authentication
    const isProtectedRoute = pathnameWithoutLocale.startsWith('/dashboard') ||
                           pathnameWithoutLocale.startsWith('/learn') ||
                           pathnameWithoutLocale.startsWith('/my-courses') ||
                           pathnameWithoutLocale.startsWith('/profile') ||
                           pathnameWithoutLocale.startsWith('/billing') ||
                           pathnameWithoutLocale.startsWith('/support') ||
                           pathnameWithoutLocale.startsWith('/certificates') ||
                           pathnameWithoutLocale.startsWith('/checkout') ||
                           pathnameWithoutLocale.startsWith('/payment') ||
                           pathnameWithoutLocale.startsWith('/settings')

    // Helper function to create response with locale (rewrite or next)
    const createLocaleResponse = () => {
      if (needsRewrite) {
        const url = new URL(pathnameWithoutLocale, req.url)
        url.search = req.nextUrl.search
        const response = NextResponse.rewrite(url)
        response.headers.set('x-locale', currentLocale)
        response.cookies.set('locale', currentLocale, {
          path: '/',
          maxAge: 31536000,
          sameSite: 'lax'
        })
        return response
      }
      const response = NextResponse.next()
      response.headers.set('x-locale', currentLocale)
      return response
    }

    // Redirect authenticated users away from auth pages
    if (isAuthPage) {
      if (isAuth) {
        const dashboardPath = getLocalizedPath('/dashboard', currentLocale)
        return NextResponse.redirect(new URL(dashboardPath, req.url))
      }
      return createLocaleResponse()
    }

    // Allow public routes without authentication
    if (isPublicRoute) {
      return createLocaleResponse()
    }

    // Only require authentication for explicitly protected routes
    if (!isAuth && (isProtectedRoute || isInternalPortal)) {
      let from = pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      const loginPath = getLocalizedPath('/login', currentLocale)
      return NextResponse.redirect(
        new URL(`${loginPath}?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    // Role-based access control (for authenticated users)
    const isAdminRoute = pathnameWithoutLocale.startsWith('/admin')
    const isCreatorRoute = pathnameWithoutLocale.startsWith('/creator')

    if (isAdminRoute && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/not-found', req.url))
    }

    if (isCreatorRoute && userRole !== 'creator' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/not-found', req.url))
    }

    // Allow access for authorized users and add locale header
    return createLocaleResponse()
  },
  {
    callbacks: {
      authorized: () => true, // We handle authorization in the middleware function
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - sitemap.xml, robots.txt (SEO files)
     * - images folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|sitemap.xml|robots.txt|images).*)',
  ],
}