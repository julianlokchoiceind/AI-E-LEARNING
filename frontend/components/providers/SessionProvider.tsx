'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { useState, useEffect } from 'react'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Mark as hydrated on client side
    setIsHydrated(true)
  }, [])

  // Show loading skeleton during hydration to prevent mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <NextAuthSessionProvider
      // Re-fetch session every 5 minutes
      refetchInterval={5 * 60}
      // Re-fetch session when window regains focus
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  )
}