import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      premiumStatus: boolean
      hasPassword?: boolean
    } & DefaultSession['user']
    accessToken: string
    refreshToken: string
  }

  interface User extends DefaultUser {
    role?: string
    premiumStatus?: boolean
    hasPassword?: boolean
    accessToken?: string
    refreshToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    email: string
    name: string
    role: string
    premiumStatus: boolean
    accessToken: string
    refreshToken: string
  }
}