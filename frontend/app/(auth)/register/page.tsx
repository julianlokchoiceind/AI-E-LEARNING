'use client'
import { LoadingSpinner } from '@/components/ui/LoadingStates';
import { Button } from '@/components/ui/Button';

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useApiMutation } from '@/hooks/useApiMutation'
import { registerUser } from '@/lib/api/auth'
import { Container } from '@/components/ui/Container'
import { useInlineMessage } from '@/hooks/useInlineMessage'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { useI18n } from '@/lib/i18n/context'

export default function RegisterPage() {
  const router = useRouter()
  const { t } = useI18n()
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
        registerMessage.showSuccess(response.message || t('registerPage.registrationSuccess'));

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
        registerMessage.showError(error.message || t('registerPage.registrationFailed'));
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
      newErrors.name = t('registerPage.fullNameRequired')
      hasErrors = true
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('registerPage.fullNameMinLength')
      hasErrors = true
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t('registerPage.emailRequired')
      hasErrors = true
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('registerPage.emailInvalid')
      hasErrors = true
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('registerPage.passwordRequired')
      hasErrors = true
    } else if (formData.password.length < 8) {
      newErrors.password = t('registerPage.passwordMinLength')
      hasErrors = true
    } else if (!/^[A-Z]/.test(formData.password)) {
      newErrors.password = t('registerPage.passwordUppercase')
      hasErrors = true
    } else if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(formData.password)) {
      newErrors.password = t('registerPage.passwordSpecialChar')
      hasErrors = true
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('registerPage.confirmPasswordRequired')
      hasErrors = true
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('registerPage.passwordsMustMatch')
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
    <div
      className="min-h-screen flex items-center justify-center py-4 sm:py-6 md:py-8"
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
        <div className="flex justify-center mb-4">
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
          {t('registerPage.title')}
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-white/95 mb-4">
          {t('registerPage.or')}{' '}
          <Link href="/login" className="glass-text font-medium hover:text-white/80">
            {t('registerPage.signInExisting')}
          </Link>
        </p>

        {/* Page-level messages */}
        {registerMessage.message && (
          <InlineMessage
            message={registerMessage.message.message}
            type={registerMessage.message.type}
            onDismiss={registerMessage.clear}
            variant="glass"
          />
        )}

        <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-white/95">
                {t('registerPage.fullNameLabel')}
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
                className={`glass-input mt-1 appearance-none relative block w-full px-3 py-2 placeholder-white/85 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:z-10 text-xs sm:text-sm ${
                  errors.name ? '!border-red-500 !bg-red-500/20' : ''
                }`}
                placeholder={t('registerPage.fullNamePlaceholder')}
              />
              {errors.name && (
                <p className="mt-1 glass-error">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/95">
                {t('registerPage.emailLabel')}
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
                className={`glass-input mt-1 appearance-none relative block w-full px-3 py-2 placeholder-white/85 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:z-10 text-xs sm:text-sm ${
                  errors.email ? '!border-red-500 !bg-red-500/20' : ''
                }`}
                placeholder={t('registerPage.emailPlaceholder')}
              />
              {errors.email && (
                <p className="mt-1 glass-error">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/95">
                {t('registerPage.passwordLabel')}
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
                className={`glass-input mt-1 appearance-none relative block w-full px-3 py-2 placeholder-white/85 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:z-10 text-xs sm:text-sm ${
                  errors.password ? '!border-red-500 !bg-red-500/20' : ''
                }`}
                placeholder={t('registerPage.passwordPlaceholder')}
              />
              {errors.password && (
                <p className="mt-1 glass-error">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/95">
                {t('registerPage.confirmPasswordLabel')}
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
                className={`glass-input mt-1 appearance-none relative block w-full px-3 py-2 placeholder-white/85 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:z-10 text-xs sm:text-sm ${
                  errors.confirmPassword ? '!border-red-500 !bg-red-500/20' : ''
                }`}
                placeholder={t('registerPage.confirmPasswordPlaceholder')}
              />
              {errors.confirmPassword && (
                <p className="mt-1 glass-error">{errors.confirmPassword}</p>
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
            <label htmlFor="terms" className="ml-2 block text-[10px] sm:text-xs text-white/95 leading-tight">
              {t('registerPage.termsAgreement')}{' '}
              <Link href="/terms" className="glass-text hover:text-white/80">
                {t('registerPage.termsOfService')}
              </Link>{' '}
              {t('registerPage.and')}{' '}
              <Link href="/privacy" className="glass-text hover:text-white/80">
                {t('registerPage.privacyPolicy')}
              </Link>
            </label>
          </div>

          <div>
            <Button
              type="submit"
              loading={isLoading}
              className="glass-button w-full !bg-white/20 hover:!bg-white/30 !text-white !border-white/40"
              size="md"
            >
              {t('registerPage.createAccountButton')}
            </Button>
          </div>
        </form>
      </Container>
    </div>
  )
}