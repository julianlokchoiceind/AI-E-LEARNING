'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
      <div className="min-h-screen flex items-center justify-center bg-muted">
      <Container variant="auth" className="space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-foreground">
              Password reset successful
            </h2>
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
                  Password reset successfully!
                </p>
                <p className="mt-2 text-sm text-success">
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
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Container variant="auth" className="space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>
        
        {/* Page-level messages */}
        {resetPasswordMessage.message && (
          <InlineMessage
            message={resetPasswordMessage.message.message}
            type={resetPasswordMessage.message.type}
            onDismiss={resetPasswordMessage.clear}
          />
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
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
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    errors.password ? 'border-red-500 bg-red-50' : 'border-border'
                  }`}
                  placeholder="Enter new password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
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
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-border'
                  }`}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Reset password
            </Button>
          </div>
          
          <div className="text-center">
            <Link href="/login" className="text-sm text-primary hover:text-primary/80">
              Back to login
            </Link>
          </div>
        </form>
      </Container>
    </div>
  )
}