'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useApiMutation } from '@/hooks/useApiMutation'
import { logoutUser, verifyEmail } from '@/lib/api/auth'

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
        // Wait for backend to blacklist token before signing out
        await new Promise<void>((resolve) => {
          logoutMutation({}, {
            onSuccess: () => resolve(),
            onError: (error) => {
              console.error('Backend logout error:', error)
              resolve() // Continue logout even if backend fails
            }
          })
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

// Email verification hook
export function useVerifyEmail() {
  return useApiMutation(
    (token: string) => verifyEmail(token),
    {
      operationName: 'verify-email',
      showToast: false, // We handle feedback in the component
    }
  )
}