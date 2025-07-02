'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { API_BASE_URL } from '@/lib/constants/api-endpoints'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

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
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`
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