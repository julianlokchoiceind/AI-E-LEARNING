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

// Combined middleware for both i18n and authentication
function createMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next()
  }

  // Handle i18n routing first
  const currentLocale = getLocaleFromPath(pathname)
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname)
  
  // Check if the current locale is valid
  if (!isValidLocale(currentLocale)) {
    // Get preferred locale from headers, cookies, or default
    const preferredLocale = getPreferredLocale(req)
    const localizedPath = getLocalizedPath(pathnameWithoutLocale, preferredLocale)
    
    return NextResponse.redirect(new URL(localizedPath, req.url))
  }
  
  // If default locale in URL, redirect to clean URL (optional)
  if (currentLocale === DEFAULT_LOCALE && pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    return NextResponse.redirect(new URL(pathnameWithoutLocale, req.url))
  }
  
  // Add locale to headers for pages to access
  const response = NextResponse.next()
  response.headers.set('x-locale', currentLocale)
  
  return response
}

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
    // First handle i18n routing
    const i18nResponse = createMiddleware(req)
    if (i18nResponse?.status !== 200) {
      return i18nResponse // Redirect or other response
    }
    
    // Then handle authentication
    const token = req.nextauth.token
    const isAuth = !!token
    const userRole = token?.role as string
    const pathname = req.nextUrl.pathname
    
    // Get pathname without locale for route matching
    const pathnameWithoutLocale = getPathnameWithoutLocale(pathname)
    
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
                         pathnameWithoutLocale.startsWith('/verify')
    
    const isAdminRoute = pathnameWithoutLocale.startsWith('/admin')
    const isCreatorRoute = pathnameWithoutLocale.startsWith('/creator')
    
    // Redirect authenticated users away from auth pages
    if (isAuthPage) {
      if (isAuth) {
        const currentLocale = getLocaleFromPath(pathname)
        const dashboardPath = getLocalizedPath('/dashboard', currentLocale)
        return NextResponse.redirect(new URL(dashboardPath, req.url))
      }
      return null
    }

    // Allow public routes without authentication
    if (isPublicRoute) {
      const response = NextResponse.next()
      response.headers.set('x-locale', getLocaleFromPath(pathname))
      return response
    }

    // Require authentication for protected routes
    if (!isAuth) {
      let from = pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }
      
      const currentLocale = getLocaleFromPath(pathname)
      const loginPath = getLocalizedPath('/login', currentLocale)
      return NextResponse.redirect(
        new URL(`${loginPath}?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    // Role-based access control
    if (isAdminRoute) {
      if (userRole !== 'admin') {
        // Redirect to 404 page for unauthorized admin access
        return NextResponse.redirect(new URL('/not-found', req.url))
      }
    }
    
    if (isCreatorRoute) {
      if (userRole !== 'creator' && userRole !== 'admin') {
        const currentLocale = getLocaleFromPath(pathname)
        const dashboardPath = getLocalizedPath('/dashboard', currentLocale)
        return NextResponse.redirect(new URL(`${dashboardPath}?error=access_denied`, req.url))
      }
    }

    // Allow access for authorized users and add locale header
    const response = NextResponse.next()
    response.headers.set('x-locale', getLocaleFromPath(pathname))
    return response
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}