'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useApiMutation } from '@/hooks/useApiMutation'
import { logoutUser } from '@/lib/api/auth'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // React Query mutation for logout
  const { mutate: logoutMutation } = useApiMutation(
    () => logoutUser(),
    {
      showToast: false, // We handle logout feedback ourselves
    }
  )

  const user = session?.user || null
  const loading = status === 'loading'
  const isAuthenticated = !!session

  const login = async (provider?: string) => {
    if (provider) {
      await signIn(provider, { callbackUrl: '/dashboard' })
    } else {
      router.push('/login')
    }
  }

  const logout = async () => {
    // Call backend logout endpoint to blacklist token
    if (session?.accessToken) {
      try {
        logoutMutation({}, {
          onError: (error) => {
            console.error('Backend logout error:', error)
          }
        })
      } catch (error) {
        console.error('Backend logout error:', error)
      }
    }
    
    // Then sign out from NextAuth
    await signOut({ callbackUrl: '/' })
  }

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    session,
  }
}