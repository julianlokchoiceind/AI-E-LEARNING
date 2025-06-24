'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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