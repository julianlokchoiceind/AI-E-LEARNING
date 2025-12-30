'use client'

import { signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { LocaleLink } from '@/components/ui/LocaleLink'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { useInlineMessage } from '@/hooks/useInlineMessage'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { useI18n } from '@/lib/i18n/context'
import { getLocalizedHref } from '@/lib/i18n/config'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  })
  const { message, showSuccess, showError, clear } = useInlineMessage('login-form')

  useEffect(() => {
    // Check for error messages in URL params
    const error = searchParams.get('error')
    if (error === 'AccessDenied') {
      showError(t('loginPage.accountDeactivated'))
    } else if (error) {
      showError(t('loginPage.loginFailed'))
    }

    // Check for success messages in URL params
    if (searchParams.get('registered') === 'true') {
      showSuccess(t('loginPage.registrationSuccess'))
    }
    if (searchParams.get('verified') === 'true') {
      showSuccess(t('loginPage.emailVerified'))
    }
    if (searchParams.get('reset') === 'true') {
      showSuccess(t('loginPage.passwordResetSuccess'))
    }
    if (searchParams.get('message') === 'already_verified') {
      showSuccess(t('loginPage.emailAlreadyVerified'))
    }
  }, [searchParams, showSuccess, showError, t])

  // Field validation function
  const validateForm = (): boolean => {
    const newErrors = {
      email: '',
      password: ''
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = t('loginPage.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = t('loginPage.emailInvalid')
    }

    // Validate password
    if (!password.trim()) {
      newErrors.password = t('loginPage.passwordRequired')
    } else if (password.length < 8) {
      newErrors.password = t('loginPage.passwordMinLength')
    }

    setErrors(newErrors)
    return !newErrors.email && !newErrors.password
  }

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') setEmail(value)
    if (field === 'password') setPassword(value)

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear existing messages
    clear()
    setErrors({ email: '', password: '' })

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      
      if (result?.error) {
        // Use the actual error message from NextAuth or fallback
        showError(result.error || 'Something went wrong')
      } else if (result?.ok) {
        // Wait a moment for session to establish, then redirect
        setTimeout(() => {
          router.push(getLocalizedHref('/dashboard'))
        }, 100)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      showError(error.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true)
    signIn(provider, { callbackUrl: getLocalizedHref('/dashboard') })
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
          <LocaleLink href="/">
            <Image
              src="/images/logo/choice-logo-192x192.png"
              alt="CHOICE"
              width={80}
              height={80}
              className="w-20 h-20"
              priority
            />
          </LocaleLink>
        </div>
        
        <h2 className="text-center text-xl sm:text-2xl font-extrabold text-white drop-shadow-lg">
          {t('loginPage.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-white/95 mb-4 sm:mb-6">
          {t('loginPage.or')}{' '}
          <LocaleLink href="/register" className="glass-text font-medium hover:text-white/80">
            {t('loginPage.createAccount')}
          </LocaleLink>
        </p>

        <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
          {message && (
            <InlineMessage
              message={message.message}
              type={message.type}
              onDismiss={clear}
              variant="glass"
            />
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                {t('loginPage.emailPlaceholder')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`glass-input appearance-none rounded-none relative block w-full px-3 py-2 placeholder-white/85 text-white rounded-t-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:z-10 text-sm ${
                  errors.email ? '!border-red-500 !bg-red-500/20' : ''
                }`}
                placeholder={t('loginPage.emailPlaceholder')}
              />
              {errors.email && (
                <p className="mt-1 glass-error">{errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t('loginPage.passwordPlaceholder')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`glass-input appearance-none rounded-none relative block w-full px-3 py-2 placeholder-white/85 text-white rounded-b-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:z-10 text-sm ${
                  errors.password ? '!border-red-500 !bg-red-500/20' : ''
                }`}
                placeholder={t('loginPage.passwordPlaceholder')}
              />
              {errors.password && (
                <p className="mt-1 glass-error">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Forgot password */}
          <div className="text-left">
            <LocaleLink href="/forgot-password" className="glass-text text-xs font-medium hover:text-white/80">
              {t('loginPage.forgotPassword')}
            </LocaleLink>
          </div>

          <div>
            <Button
              type="submit"
              loading={isLoading}
              className="glass-button w-full !bg-white/20 hover:!bg-white/30 !text-white !border-white/40"
              size="md"
            >
              {t('loginPage.signInButton')}
            </Button>
          </div>

          <div className="mt-8">
            <div className="text-center text-sm text-white/90">
              {t('loginPage.orContinueWith')}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                aria-label="Sign in with Google"
                className="glass-button w-full flex justify-center items-center py-2 px-2 sm:px-3 md:px-4 rounded-md disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                disabled={isLoading}
                aria-label="Sign in with GitHub"
                className="glass-button w-full flex justify-center items-center py-2 px-2 sm:px-3 md:px-4 rounded-md disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#181717">
                  <path d="M12 0.297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('azure-ad')}
                disabled={isLoading}
                aria-label="Sign in with Microsoft"
                className="glass-button w-full flex justify-center items-center py-2 px-2 sm:px-3 md:px-4 rounded-md disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M0 0h11.377v11.372H0V0z" fill="#F25022"/>
                  <path d="M12.623 0H24v11.372H12.623V0z" fill="#7FBA00"/>
                  <path d="M0 12.628h11.377V24H0V12.628z" fill="#00A4EF"/>
                  <path d="M12.623 12.628H24V24H12.623V12.628z" fill="#FFB900"/>
                </svg>
              </button>
            </div>
          </div>
        </form>
      </Container>
    </div>
  )
}