'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { useApiMutation } from '@/hooks/useApiMutation'
import { resetPassword } from '@/lib/api/auth'
import { Container } from '@/components/ui/Container'
import { useInlineMessage } from '@/hooks/useInlineMessage'
import { InlineMessage } from '@/components/ui/InlineMessage'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Field validation errors
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: ''
  })
  
  // Inline messages
  const resetPasswordMessage = useInlineMessage('reset-password-form')
  
  // React Query mutation for password reset - replaces manual API calls and error handling
  const { mutate: resetPasswordMutation, loading } = useApiMutation(
    (data: { token: string; password: string; confirmPassword: string }) => 
      resetPassword(data.token, data.password, data.confirmPassword),
    {
      operationName: 'reset-password', // For toast deduplication
      showToast: false, // Disable automatic toast - use inline message instead
      onSuccess: (response) => {
        resetPasswordMessage.showSuccess(response.message || 'Password reset successful! Redirecting to login...');
        setSuccess(true);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?reset=true');
        }, 3000);
      },
      onError: (error: any) => {
        resetPasswordMessage.showError(error.message || 'Failed to reset password. Please try again.');
        console.error('Password reset failed:', error);
      }
    }
  )
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors and messages
    setErrors({
      password: '',
      confirmPassword: ''
    })
    resetPasswordMessage.clear()
    
    // Check if token exists
    if (!token) {
      resetPasswordMessage.showError('Invalid reset token. Please request a new password reset.')
      return
    }
    
    // Field validation
    const newErrors = {
      password: '',
      confirmPassword: ''
    }
    
    let hasErrors = false
    
    // Password validation
    if (!password) {
      newErrors.password = 'New password is required'
      hasErrors = true
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
      hasErrors = true
    } else if (!/^[A-Z]/.test(password)) {
      newErrors.password = 'Password must start with an uppercase letter'
      hasErrors = true
    } else if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      newErrors.password = 'Password must contain at least one special character'
      hasErrors = true
    }
    
    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
      hasErrors = true
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
      hasErrors = true
    }
    
    // Set errors if any
    if (hasErrors) {
      setErrors(newErrors)
      return
    }
    
    // React Query mutation handles API call with automatic error handling
    resetPasswordMutation({
      token: token || '',
      password,
      confirmPassword
    })
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
        className="glass-container rounded-2xl"
      >
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-lg mb-4">
              Password reset successful
            </h2>
          </div>

          <div className="rounded-md bg-green-500/20 backdrop-blur-md border border-white/30 border-l-4 border-l-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  Password reset successfully!
                </p>
                <p className="mt-2 text-sm text-white/90">
                  Redirecting to login page...
                </p>
              </div>
            </div>
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
        className="glass-container rounded-2xl"
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

        <h2 className="text-center text-xl sm:text-2xl font-extrabold text-white drop-shadow-lg">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-white/95 mb-4 sm:mb-6">
          Enter your new password below
        </p>

        {/* Page-level messages */}
        {resetPasswordMessage.message && (
          <InlineMessage
            message={resetPasswordMessage.message.message}
            type={resetPasswordMessage.message.type}
            onDismiss={resetPasswordMessage.clear}
            variant="glass"
          />
        )}
        
        <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-white/95">
                New password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    // Clear error when user starts typing
                    if (errors.password) {
                      setErrors({ ...errors, password: '' })
                    }
                  }}
                  className={`glass-input appearance-none block w-full px-3 py-2 rounded-md placeholder-white/85 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-xs sm:text-sm ${
                    errors.password ? '!border-red-500 !bg-red-500/20' : ''
                  }`}
                  placeholder="Start with uppercase + 8 chars + special char"
                />
                {errors.password && (
                  <p className="mt-1 glass-error">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/95">
                Confirm new password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    // Clear error when user starts typing
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: '' })
                    }
                  }}
                  className={`glass-input appearance-none block w-full px-3 py-2 rounded-md placeholder-white/85 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-xs sm:text-sm ${
                    errors.confirmPassword ? '!border-red-500 !bg-red-500/20' : ''
                  }`}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 glass-error">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <Button
              type="submit"
              loading={loading}
              className="glass-button w-full !bg-white/20 hover:!bg-white/30 !text-white !border-white/40"
              size="md"
            >
              Reset password
            </Button>
          </div>

          <div className="text-center">
            <Link href="/login" className="glass-text text-xs font-medium hover:text-white/80">
              Back to login
            </Link>
          </div>
        </form>
      </Container>
    </div>
  )
}