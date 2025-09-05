'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useApiMutation } from '@/hooks/useApiMutation'
import { forgotPassword } from '@/lib/api/auth'
import { ToastService } from '@/lib/toast/ToastService'
import { Container } from '@/components/ui/Container'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  // React Query mutation for forgot password - replaces manual API calls
  const { mutate: sendResetEmail, loading } = useApiMutation(
    (email: string) => forgotPassword(email),
    {
      operationName: 'forgot-password', // For toast deduplication
      onSuccess: (response) => {
        const message = response.message || 'Password reset email sent! Please check your inbox.';
        setSuccessMessage(message);
        setSuccess(true);
        // Toast handled automatically by useApiMutation
      },
      onError: (error: any) => {
        // Keep error handling logic only, toast is handled automatically
        console.error('Forgot password failed:', error);
      }
    }
  )
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // React Query mutation handles API call with automatic error handling
    sendResetEmail(email)
  }
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
      <Container variant="auth" className="space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-foreground">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for {email}, you will receive a password reset link.
            </p>
          </div>
          
          <div className="rounded-md bg-success/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-success">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              Back to login
            </Link>
          </div>
        </Container>
    </div>
  )
}
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Container variant="auth" className="space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>
          
          <div>
            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Send reset email
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <Link href="/login" className="text-sm text-primary hover:text-primary/80">
              Back to login
            </Link>
            <Link href="/register" className="text-sm text-primary hover:text-primary/80">
              Create new account
            </Link>
          </div>
        </form>
      </Container>
    </div>
  )
}