/**
 * Hook for automatic token refresh management
 */
import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface RefreshResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export function useTokenRefresh() {
  const { data: session, update } = useSession()
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const refreshTokenRef = useRef<string | null>(null)

  useEffect(() => {
    if (!session?.accessToken) return

    // Parse JWT to get expiry time
    try {
      const tokenParts = session.accessToken.split('.')
      const payload = JSON.parse(atob(tokenParts[1]))
      const expiryTime = payload.exp * 1000 // Convert to milliseconds
      const currentTime = Date.now()
      
      // Calculate when to refresh (5 minutes before expiry)
      const refreshTime = expiryTime - currentTime - (5 * 60 * 1000)
      
      if (refreshTime > 0) {
        // Clear any existing timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
        }
        
        // Set new timeout for refresh
        refreshTimeoutRef.current = setTimeout(async () => {
          await refreshAccessToken()
        }, refreshTime)
      } else {
        // Token is already close to expiry, refresh immediately
        refreshAccessToken()
      }
    } catch (error) {
      console.error('Error parsing token:', error)
    }

    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [session?.accessToken])

  const refreshAccessToken = async () => {
    try {
      // Use stored refresh token or get from session
      const refreshToken = refreshTokenRef.current || session?.refreshToken
      
      if (!refreshToken) {
        console.error('No refresh token available')
        return
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      })

      if (response.ok) {
        const data: RefreshResponse = await response.json()
        
        // Store new refresh token
        refreshTokenRef.current = data.refresh_token
        
        // Update session with new tokens
        await update({
          ...session,
          accessToken: data.access_token,
          refreshToken: data.refresh_token
        })
        
        console.log('Token refreshed successfully')
      } else {
        console.error('Failed to refresh token')
        // Token refresh failed, user needs to login again
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
    }
  }

  return {
    refreshAccessToken
  }
}

/**
 * Axios interceptor for automatic token refresh
 */
export function setupAxiosInterceptors(axios: any) {
  // Request interceptor to add token
  axios.interceptors.request.use(
    (config: any) => {
      const session = getSession() // You'll need to implement this
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`
      }
      return config
    },
    (error: any) => Promise.reject(error)
  )

  // Response interceptor to handle 401 and refresh token
  axios.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      const originalRequest = error.config

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const session = getSession()
          if (session?.refreshToken) {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                refresh_token: session.refreshToken
              })
            })

            if (response.ok) {
              const data = await response.json()
              // Update tokens and retry original request
              updateSession({
                accessToken: data.access_token,
                refreshToken: data.refresh_token
              })
              
              originalRequest.headers.Authorization = `Bearer ${data.access_token}`
              return axios(originalRequest)
            }
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          window.location.href = '/login'
        }
      }

      return Promise.reject(error)
    }
  )
}

// Helper functions (implement based on your session management)
function getSession(): any {
  // Implement based on your session storage method
  return null
}

function updateSession(data: any): void {
  // Implement based on your session update method
}