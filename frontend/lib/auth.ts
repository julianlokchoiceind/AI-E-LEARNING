import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import AzureADProvider from 'next-auth/providers/azure-ad'
import CredentialsProvider from 'next-auth/providers/credentials'
import { loginUser } from '@/lib/api/auth'
import { api } from '@/lib/api/api-client'
import { StandardResponse } from '@/lib/types/api'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Call backend API to authenticate user
          const authResponse = await loginUser({
            email: credentials.email,
            password: credentials.password
          })

          // Check if login was successful
          if (!authResponse.success || !authResponse.data) {
            throw new Error(authResponse.message || 'Login failed')
          }

          // Decode the JWT token to get user info
          const tokenPayload = JSON.parse(
            Buffer.from(authResponse.data.access_token.split('.')[1], 'base64').toString()
          )

          // Extract user information from JWT payload
          // Backend includes email, name, role in the JWT payload
          return {
            id: tokenPayload.sub, // User ID
            email: tokenPayload.email || credentials.email, // Use email from token or fallback to credentials
            name: tokenPayload.name || tokenPayload.email?.split('@')[0] || credentials.email.split('@')[0], // Use name from token or email prefix
            role: tokenPayload.role || 'student',
            premiumStatus: tokenPayload.premium_status || false,
            accessToken: authResponse.data.access_token,
            refreshToken: authResponse.data.refresh_token
          }
        } catch (error: any) {
          console.error('Login error:', error)
          
          // Preserve the original error message from backend
          if (error?.message && typeof error.message === 'string') {
            // Don't show technical errors to users
            if (error.message.includes('fetch') || error.message.includes('network')) {
              throw new Error('Something went wrong')
            }
            
            // Pass through the actual error message from backend
            throw new Error(error.message)
          }
          
          // Only use generic message as absolute fallback
          throw new Error('Something went wrong')
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Initial sign-in - save all tokens and calculate expiry
      if (user) {
        token.id = user.id
        token.email = user.email || ''
        token.name = user.name || ''
        token.role = user.role || 'student'
        token.premiumStatus = user.premiumStatus || false
        
        // Store backend tokens
        if ('accessToken' in user && user.accessToken) {
          token.accessToken = user.accessToken
        }
        if ('refreshToken' in user && user.refreshToken) {
          token.refreshToken = user.refreshToken
        }
        
        // Calculate token expiry (30 minutes from now)
        token.expiresAt = Math.floor(Date.now() / 1000) + (30 * 60)
      } else if (trigger === 'update') {
        // Handle session updates if needed
        // This is called when using update() from useSession
      }
      
      // Check if access token has expired
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        // Token is still valid
        return token
      }
      
      // Token has expired - attempt to refresh
      if (token.refreshToken) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://aitc.choiceind.com/api/v1'
          const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: token.refreshToken })
          })
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json() as StandardResponse<any>
            
            if (refreshData.success && refreshData.data) {
              // Update with new tokens
              token.accessToken = refreshData.data.access_token
              token.refreshToken = refreshData.data.refresh_token
              // Reset expiry for another 30 minutes
              token.expiresAt = Math.floor(Date.now() / 1000) + (30 * 60)
              
              // Optionally update user info from new token
              try {
                const tokenParts = refreshData.data.access_token.split('.')
                if (tokenParts.length === 3) {
                  const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
                  token.email = payload.email || token.email
                  token.name = payload.name || token.name
                  token.role = payload.role || token.role
                  token.premiumStatus = payload.premium_status || token.premiumStatus
                }
              } catch (e) {
                // Silent fail on token decode
              }
              
              return token
            }
          }
        } catch (error) {
          console.error('Token refresh failed:', error)
          // Mark token as having refresh error
          token.error = "RefreshTokenError" as any
        }
      }
      
      // If we get here, refresh failed or no refresh token
      // Mark the error so session callback can handle it
      if (!token.error) {
        token.error = "RefreshTokenError" as any
      }
      
      return token
    },
    async session({ session, token }) {
      // Quick return if no token or session.user
      if (!token || !session.user) return session
      
      // Check for refresh errors
      if (token.error === "RefreshTokenError") {
        // Token refresh failed, force re-authentication
        throw new Error("RefreshTokenError")
      }
      
      // Efficiently copy token data to session
      Object.assign(session.user, {
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role,
        premiumStatus: token.premiumStatus
      })
      
      // Include tokens for API calls
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      
      return session
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-ins
      if (account?.provider !== 'credentials') {
        try {
          // Send OAuth user data to backend directly
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://aitc.choiceind.com/api/v1'
          const oauthResponse = await fetch(`${baseUrl}/auth/oauth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name || user.email?.split('@')[0],
              provider: account?.provider || 'unknown',
              provider_id: account?.providerAccountId || '',
              picture: user.image
            })
          })
          
          if (!oauthResponse.ok) {
            console.error('OAuth backend sync failed')
            return false
          }
          
          const data = await oauthResponse.json() as StandardResponse<any>
          
          // Check if OAuth backend sync was successful
          if (!data.success) {
            console.error('OAuth backend sync failed:', data.message)
            return false
          }
            
            // Decode JWT to get user info
            if (data.data && data.data.access_token) {
              try {
                const tokenPayload = JSON.parse(
                  Buffer.from(data.data.access_token.split('.')[1], 'base64').toString()
                )
                
                // Update user object with decoded info
                user.id = tokenPayload.sub
                user.email = tokenPayload.email || user.email
                user.name = tokenPayload.name || user.name
                user.role = tokenPayload.role || 'student'
                user.premiumStatus = tokenPayload.premium_status || false
              } catch (e) {
                console.error('Failed to decode JWT:', e)
              }
            }
            
          // Store tokens in user object to pass to JWT callback
          user.accessToken = data.data.access_token
          user.refreshToken = data.data.refresh_token
          return true
        } catch (error: any) {
          console.error('OAuth sign-in error:', error)
          return false
        }
      }
      
      return true
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}