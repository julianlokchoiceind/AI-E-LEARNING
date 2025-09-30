'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
      <div
        className="min-h-screen flex items-center justify-center py-4 sm:py-8 md:py-12"
        style={{
          background: `
            linear-gradient(135deg, #1e40af 0%, #2563eb 25%, #3b82f6 50%, #2563eb 75%, #1e40af 100%),
            radial-gradient(circle 450px at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 25%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.2) 70%, transparent 85%)
          `
        }}
      >
      <Container
        variant="auth"
        className="bg-white rounded-lg"
        style={{
          boxShadow: `
            0 0 40px rgba(255, 255, 255, 0.18),
            0 0 80px rgba(255, 255, 255, 0.12),
            0 20px 40px rgba(0, 0, 0, 0.15),
            0 10px 20px rgba(0, 0, 0, 0.1)
          `
        }}
      >
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mb-4">
              Check your email
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
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
    <div
      className="min-h-screen flex items-center justify-center py-4 sm:py-8 md:py-12"
      style={{
        background: `
          linear-gradient(135deg, #1e40af 0%, #2563eb 25%, #3b82f6 50%, #2563eb 75%, #1e40af 100%),
          radial-gradient(circle 450px at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 25%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.2) 70%, transparent 85%)
        `
      }}
    >
      <Container
        variant="auth"
        className="bg-white rounded-lg"
        style={{
          boxShadow: `
            0 0 40px rgba(255, 255, 255, 0.18),
            0 0 80px rgba(255, 255, 255, 0.12),
            0 20px 40px rgba(0, 0, 0, 0.15),
            0 10px 20px rgba(0, 0, 0, 0.1)
          `
        }}
      >
        <div className="flex justify-center mb-4 sm:mb-6">
          <Link href="/">
            <Image
              src="/images/logo/choice-logo-192x192.png"
              alt="CHOICE"
              width={80}
              height={80}
              className="w-20 h-20"
              priority
            />
          </Link>
        </div>

        <h2 className="text-center text-xl sm:text-2xl font-extrabold text-foreground">
          Forgot your password?
        </h2>
        <p className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {/* Page-level messages */}
        {forgotPasswordMessage.message && (
          <InlineMessage
            message={forgotPasswordMessage.message.message}
            type={forgotPasswordMessage.message.type}
            onDismiss={forgotPasswordMessage.clear}
          />
        )}

        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>

          <div>
            <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-foreground">
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
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary text-xs sm:text-sm ${
                  emailError ? 'border-red-500 bg-red-50' : 'border-border'
                }`}
                placeholder="Enter your email"
              />
              {emailError && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{emailError}</p>
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
            <Link href="/login" className="text-xs font-medium text-primary hover:text-primary/80">
              Back to login
            </Link>
            <Link href="/register" className="text-xs font-medium text-primary hover:text-primary/80">
              Create new account
            </Link>
          </div>
        </form>
      </Container>
    </div>
  )
}