'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { LocaleLink } from '@/components/ui/LocaleLink'
import { verifyEmail } from '@/lib/api/auth'
import { Container } from '@/components/ui/Container'
import { useInlineMessage } from '@/hooks/useInlineMessage'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { useI18n } from '@/lib/i18n/context'
import { getLocalizedHref } from '@/lib/i18n/config'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useI18n()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const { message, showSuccess, showError, clear } = useInlineMessage('email-verification')
  
  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      showError(t('verifyEmailPage.invalidToken'))
      return
    }

    // Verify email with backend
    verifyEmail(token)
      .then((response) => {
        setStatus('success')
        showSuccess(response.message || t('verifyEmailPage.successMessage'))
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push(getLocalizedHref('/login?verified=true'))
        }, 3000)
      })
      .catch((error) => {
        setStatus('error')
        showError(error.message || t('verifyEmailPage.verificationFailed'))
        // If the link was already used, show login button
        if (error.message?.includes('already been used')) {
          setTimeout(() => {
            router.push(getLocalizedHref('/login?message=already_verified'))
          }, 5000)
        }
      })
  }, [searchParams, router])
  
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
      <Container variant="auth" className="glass-container rounded-2xl space-y-6">
        <div className="text-center">
          <h2 className="mt-6 text-xl sm:text-2xl font-extrabold text-white drop-shadow-lg">
            {t('verifyEmailPage.title')}
          </h2>
        </div>

        <div className="mt-8">
          {status === 'loading' && (
            <div className="text-center">
              <div className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-white/95">{t('verifyEmailPage.verifying')}</span>
              </div>
            </div>
          )}

          {message && status !== 'loading' && (
            <InlineMessage
              message={message.message + (status === 'success' ? ` ${t('verifyEmailPage.redirecting')}` : '')}
              type={message.type}
              onDismiss={clear}
              variant="glass"
            />
          )}
        </div>

        <div className="text-center">
          <LocaleLink href="/login" className="glass-text font-medium hover:text-white/80">
            {t('verifyEmailPage.backToLogin')}
          </LocaleLink>
        </div>
      </Container>
    </div>
  )
}