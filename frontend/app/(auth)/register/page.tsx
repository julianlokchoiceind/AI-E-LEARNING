'use client'
import { LoadingSpinner } from '@/components/ui/LoadingStates';

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useApiMutation } from '@/hooks/useApiMutation'
import { registerUser } from '@/lib/api/auth'
import { Container } from '@/components/ui/Container'
import { useInlineMessage } from '@/hooks/useInlineMessage'
import { InlineMessage } from '@/components/ui/InlineMessage'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  // Field validation errors
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  // Inline messages
  const registerMessage = useInlineMessage('register-form')
  
  // React Query mutation for registration - replaces manual API calls and error handling
  const { mutate: register, loading: isLoading } = useApiMutation(
    (data: any) => registerUser({
      name: data.name,
      email: data.email,
      password: data.password
    }),
    {
      operationName: 'register-user', // For toast deduplication
      showToast: false, // Disable automatic toast - use inline message instead
      onSuccess: (response) => {
        // Show success message
        registerMessage.showSuccess(response.message || 'Registration successful! Redirecting to login...');
        
        // Clear form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 2000);
      },
      onError: (error: any) => {
        // Show error in inline message instead of toast for auth pages
        registerMessage.showError(error.message || 'Registration failed. Please try again.');
        console.error('Registration failed:', error);
      }
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors and messages
    setErrors({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    registerMessage.clear()
    
    // Field validation
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
    
    let hasErrors = false
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
      hasErrors = true
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters'
      hasErrors = true
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required'
      hasErrors = true
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
      hasErrors = true
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
      hasErrors = true
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
      hasErrors = true
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
      hasErrors = true
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
      hasErrors = true
    }
    
    // Set errors if any
    if (hasErrors) {
      setErrors(newErrors)
      return
    }
    
    // React Query mutation handles API call with automatic error handling
    register(formData)
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Container variant="auth" className="space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Or{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              sign in to existing account
            </Link>
          </p>
        </div>
        
        {/* Page-level messages */}
        {registerMessage.message && (
          <InlineMessage
            message={registerMessage.message.message}
            type={registerMessage.message.type}
            onDismiss={registerMessage.clear}
          />
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  // Clear error when user starts typing
                  if (errors.name) {
                    setErrors({ ...errors, name: '' })
                  }
                }}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm ${
                  errors.name ? 'border-red-500 bg-red-50' : 'border-border'
                }`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  // Clear error when user starts typing
                  if (errors.email) {
                    setErrors({ ...errors, email: '' })
                  }
                }}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-border'
                }`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value })
                  // Clear error when user starts typing
                  if (errors.password) {
                    setErrors({ ...errors, password: '' })
                  }
                }}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm ${
                  errors.password ? 'border-red-500 bg-red-50' : 'border-border'
                }`}
                placeholder="At least 8 characters"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value })
                  // Clear error when user starts typing
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: '' })
                  }
                }}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm ${
                  errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-border'
                }`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-foreground">
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:text-primary/80">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:text-primary/80">
                Privacy Policy
              </Link>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Create account'}
            </button>
          </div>
        </form>
      </Container>
    </div>
  )
}