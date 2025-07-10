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
      // Disable all automatic refetch to prevent race conditions
      refetchInterval={0}
      // Disable window focus refetch to prevent conflicts
      refetchOnWindowFocus={false}
      // Skip refetch when offline
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  )
}