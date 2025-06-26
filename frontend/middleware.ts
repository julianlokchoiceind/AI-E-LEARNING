import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const userRole = token?.role as string
    const pathname = req.nextUrl.pathname
    
    // Define role-based route protection
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
    const isAdminRoute = pathname.startsWith('/admin')
    const isCreatorRoute = pathname.startsWith('/creator')
    
    // Redirect authenticated users away from auth pages
    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      return null
    }

    // Require authentication for protected routes
    if (!isAuth) {
      let from = pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    // Role-based access control
    if (isAdminRoute) {
      if (userRole !== 'admin') {
        // Non-admin users trying to access admin routes
        return NextResponse.redirect(new URL('/dashboard?error=access_denied', req.url))
      }
    }
    
    if (isCreatorRoute) {
      if (userRole !== 'creator' && userRole !== 'admin') {
        // Non-creator/admin users trying to access creator routes
        return NextResponse.redirect(new URL('/dashboard?error=access_denied', req.url))
      }
    }

    // Allow access for authorized users
    return null
  },
  {
    callbacks: {
      authorized: ({ token }) => true, // We handle authorization in the middleware function
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/learn/:path*',
    '/my-courses/:path*',
    '/profile/:path*',
    '/certificates/:path*',
    '/billing/:path*',
    '/creator/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
}