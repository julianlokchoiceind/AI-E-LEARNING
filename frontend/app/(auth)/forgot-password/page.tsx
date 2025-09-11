'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useApiMutation } from '@/hooks/useApiMutation'
import { forgotPassword } from '@/lib/api/auth'
import { Container } from '@/components/ui/Container'
import { useInlineMessage } from '@/hooks/useInlineMessage'
import { InlineMessage } from '@/components/ui/InlineMessage'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')
  const forgotPasswordMessage = useInlineMessage('forgot-password-form')
  
  // React Query mutation for forgot password - replaces manual API calls
  const { mutate: sendResetEmail, loading } = useApiMutation(
    (email: string) => forgotPassword(email),
    {
      operationName: 'forgot-password', // For toast deduplication
      showToast: false, // Disable automatic toast - use inline message instead
      onSuccess: (response) => {
        const message = response.message || 'Password reset email sent! Please check your inbox.';
        forgotPasswordMessage.showSuccess(message);
        setSuccess(true);
      },
      onError: (error: any) => {
        forgotPasswordMessage.showError(error.message || 'Failed to send reset email. Please try again.');
        console.error('Forgot password failed:', error);
      }
    }
  )
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setEmailError('')
    forgotPasswordMessage.clear()
    
    // Validate email
    if (!email) {
      setEmailError('Email is required')
      return
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    
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
          
          {forgotPasswordMessage.message && (
            <InlineMessage
              message={forgotPasswordMessage.message.message}
              type={forgotPasswordMessage.message.type}
              onDismiss={forgotPasswordMessage.clear}
            />
          )}
          
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
        
        {/* Page-level messages */}
        {forgotPasswordMessage.message && (
          <InlineMessage
            message={forgotPasswordMessage.message.message}
            type={forgotPasswordMessage.message.type}
            onDismiss={forgotPasswordMessage.clear}
          />
        )}

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
                onChange={(e) => {
                  setEmail(e.target.value)
                  // Clear error when user starts typing
                  if (emailError) {
                    setEmailError('')
                  }
                }}
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                  emailError ? 'border-red-500 bg-red-50' : 'border-border'
                }`}
                placeholder="Enter your email"
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
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