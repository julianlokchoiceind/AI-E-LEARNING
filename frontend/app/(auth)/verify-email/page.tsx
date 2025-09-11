'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { verifyEmail } from '@/lib/api/auth'
import { Container } from '@/components/ui/Container'
import { useInlineMessage } from '@/hooks/useInlineMessage'
import { InlineMessage } from '@/components/ui/InlineMessage'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const { message, showSuccess, showError, clear } = useInlineMessage('email-verification')
  
  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      showError('Invalid verification link. No token provided.')
      return
    }
    
    // Verify email with backend
    verifyEmail(token)
      .then((response) => {
        setStatus('success')
        showSuccess(response.message || 'Email verified successfully!')
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?verified=true')
        }, 3000)
      })
      .catch((error) => {
        setStatus('error')
        showError(error.message || 'Email verification failed. Please try again.')
        // If the link was already used, show login button
        if (error.message?.includes('already been used')) {
          setTimeout(() => {
            router.push('/login?message=already_verified')
          }, 5000)
        }
      })
  }, [searchParams, router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Container variant="auth" className="space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            Email Verification
          </h2>
        </div>
        
        <div className="mt-8">
          {status === 'loading' && (
            <div className="text-center">
              <div className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-muted-foreground">Verifying your email...</span>
              </div>
            </div>
          )}
          
          {message && status !== 'loading' && (
            <InlineMessage
              message={message.message + (status === 'success' ? ' Redirecting to login page...' : '')}
              type={message.type}
              onDismiss={clear}
            />
          )}
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