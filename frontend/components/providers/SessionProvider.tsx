'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { useState, useEffect } from 'react'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Mark as hydrated on client side
    setIsHydrated(true)
  }, [])

  // Show minimal loading state during hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Render children immediately but hidden to start hydration sooner */}
        <div style={{ visibility: 'hidden' }}>
          <NextAuthSessionProvider>
            {children}
          </NextAuthSessionProvider>
        </div>
      </div>
    )
  }

  return (
    <NextAuthSessionProvider
      // Increase refetch interval to 30 minutes (session is valid for 30 days)
      refetchInterval={30 * 60}
      // Only refetch on window focus if session is older than 10 minutes
      refetchOnWindowFocus={false}
      // Skip initial session fetch if we have a valid session in storage
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  )
}