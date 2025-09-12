'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingStates'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 text-primary">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Don't render auth pages if user is already logged in
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 text-primary">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return <>{children}</>
}