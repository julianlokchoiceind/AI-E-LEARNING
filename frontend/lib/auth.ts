import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import AzureADProvider from 'next-auth/providers/azure-ad'
import CredentialsProvider from 'next-auth/providers/credentials'
import { loginUser } from '@/lib/api/auth'

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

          // Decode the JWT token to get user info
          const tokenPayload = JSON.parse(
            Buffer.from(authResponse.access_token.split('.')[1], 'base64').toString()
          )

          // Extract user information from JWT payload
          // Backend includes email, name, role in the JWT payload
          return {
            id: tokenPayload.sub, // User ID
            email: tokenPayload.email || credentials.email, // Use email from token or fallback to credentials
            name: tokenPayload.name || tokenPayload.email?.split('@')[0] || credentials.email.split('@')[0], // Use name from token or email prefix
            role: tokenPayload.role || 'student',
            premiumStatus: tokenPayload.premium_status || false,
            accessToken: authResponse.access_token,
            refreshToken: authResponse.refresh_token
          }
        } catch (error: any) {
          console.error('Login error:', error)
          
          // Preserve the original error message from backend
          if (error?.message && typeof error.message === 'string') {
            // Don't show technical errors to users
            if (error.message.includes('fetch') || error.message.includes('network')) {
              throw new Error('Unable to connect to server. Please try again.')
            }
            
            // Pass through the actual error message from backend
            throw new Error(error.message)
          }
          
          // Only use generic message as absolute fallback
          throw new Error('Authentication failed. Please try again.')
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
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
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.premiumStatus = token.premiumStatus as boolean
        // Include tokens in session for API calls
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-ins
      if (account?.provider !== 'credentials') {
        try {
          // Send OAuth user data to backend
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth`, {
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
          
          if (response.ok) {
            const data = await response.json()
            
            // Decode JWT to get user info
            if (data.access_token) {
              try {
                const tokenPayload = JSON.parse(
                  Buffer.from(data.access_token.split('.')[1], 'base64').toString()
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
            user.accessToken = data.access_token
            user.refreshToken = data.refresh_token
            return true
          }
          
          console.error('OAuth backend sync failed')
          return false
        } catch (error) {
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}