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
    console.log('Auth layout - User:', user, 'Loading:', loading);
    // Redirect authenticated users to dashboard
    if (!loading && user) {
      console.log('Auth layout - Redirecting to dashboard');
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    )
  }

  // Don't render auth pages if user is already logged in
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" message="Redirecting to dashboard..." />
      </div>
    )
  }

  return <>{children}</>
}