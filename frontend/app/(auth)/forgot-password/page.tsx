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
import { useI18n } from '@/lib/i18n/context'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { t } = useI18n()
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
        const message = response.message || t('forgotPasswordPage.successMessage');
        forgotPasswordMessage.showSuccess(message);
        setSuccess(true);
      },
      onError: (error: any) => {
        forgotPasswordMessage.showError(error.message || t('forgotPasswordPage.sendFailed'));
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
      setEmailError(t('forgotPasswordPage.emailRequired'))
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t('forgotPasswordPage.emailInvalid'))
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
        className="glass-container rounded-2xl"
      >
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-lg mb-4">
              {t('forgotPasswordPage.checkEmailTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-white/95">
              {t('forgotPasswordPage.checkEmailMessage').replace('{email}', email)}
            </p>
          </div>

          {forgotPasswordMessage.message && (
            <InlineMessage
              message={forgotPasswordMessage.message.message}
              type={forgotPasswordMessage.message.type}
              onDismiss={forgotPasswordMessage.clear}
              variant="glass"
            />
          )}

          <div className="text-center">
            <Link href="/login" className="glass-text font-medium hover:text-white/80">
              {t('forgotPasswordPage.backToLogin')}
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
          {t('forgotPasswordPage.title')}
        </h2>
        <p className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-white/95 mb-4 sm:mb-6">
          {t('forgotPasswordPage.subtitle')}
        </p>

        {/* Page-level messages */}
        {forgotPasswordMessage.message && (
          <InlineMessage
            message={forgotPasswordMessage.message.message}
            type={forgotPasswordMessage.message.type}
            onDismiss={forgotPasswordMessage.clear}
            variant="glass"
          />
        )}

        <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>

          <div>
            <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-white/95">
              {t('forgotPasswordPage.emailLabel')}
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
                className={`glass-input appearance-none block w-full px-3 py-2 rounded-md placeholder-white/85 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-xs sm:text-sm ${
                  emailError ? '!border-red-500 !bg-red-500/20' : ''
                }`}
                placeholder={t('forgotPasswordPage.emailPlaceholder')}
              />
              {emailError && (
                <p className="mt-1 glass-error">{emailError}</p>
              )}
            </div>
          </div>
          
          <div>
            <Button
              type="submit"
              loading={loading}
              className="glass-button w-full !bg-white/20 hover:!bg-white/30 !text-white !border-white/40"
            >
              {t('forgotPasswordPage.sendResetButton')}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <Link href="/login" className="glass-text text-xs font-medium hover:text-white/80">
              {t('forgotPasswordPage.backToLogin')}
            </Link>
            <Link href="/register" className="glass-text text-xs font-medium hover:text-white/80">
              {t('forgotPasswordPage.createNewAccount')}
            </Link>
          </div>
        </form>
      </Container>
    </div>
  )
}