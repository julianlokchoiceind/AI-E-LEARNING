'use client'

import { useState } from 'react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { useInlineMessage } from '@/hooks/useInlineMessage'
import { useApiMutation } from '@/hooks/useApiMutation'
import { waitlistAPI } from '@/lib/api/waitlist'
import { useI18n } from '@/lib/i18n/context'

interface WaitlistSectionProps {
  className?: string
  containerClassName?: string
}


export function WaitlistSection({
  className = "flex-1 bg-white",
  containerClassName = "py-8 md:py-12 lg:py-24"
}: WaitlistSectionProps) {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const waitlistMessage = useInlineMessage('waitlist-form')

  const { mutate: joinWaitlist, loading } = useApiMutation(
    (data: { email: string }) => waitlistAPI.joinWaitlist(data),
    {
      operationName: 'join-waitlist',
      showToast: false, // Use inline message instead
      onSuccess: (response) => {
        waitlistMessage.showSuccess(response.message || 'Something went wrong')
        setEmail('')
      },
      onError: (error: any) => {
        waitlistMessage.showError(error.message || 'Something went wrong')
      }
    }
  )

  const handleJoinWaitlist = async () => {
    waitlistMessage.clear()

    if (!email.trim()) {
      waitlistMessage.showError(t('homepage.waitlistEmailRequired'))
      return
    }

    if (!email.includes('@')) {
      waitlistMessage.showError(t('homepage.waitlistEmailInvalid'))
      return
    }

    joinWaitlist({ email })
  }

  return (
    <div
      className="relative text-white"
      style={{
        background: `radial-gradient(ellipse 100% 80% at center 50%, hsl(221 83% 50%) 0%, hsl(221 83% 40%) 40%, hsl(221 83% 25%) 70%, hsl(221 83% 15%) 90%, hsl(221 83% 10%) 100%)`
      }}
    >
      <Container variant="public" className={containerClassName}>
        <div className="text-center max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">{t('homepage.waitlistTitle')}</span> {t('homepage.waitlistTitleHighlight')}
            </h2>
            <p className="text-lg md:text-xl lg:text-xl mb-6 md:mb-8 text-white/90">
              {t('homepage.waitlistSubtitle')}
            </p>
          </div>

          {/* Email Form */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto items-stretch">
              <input
                type="email"
                placeholder={t('homepage.waitlistPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinWaitlist()}
                className="w-full sm:flex-1 h-10 sm:h-11 lg:h-12 px-4 bg-white/10 border border-white/40 text-white placeholder-white/80 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/70 outline-none box-border backdrop-blur-sm"
                disabled={loading}
              />
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto sm:min-w-[120px] bg-white text-primary border-white hover:bg-white/95"
                onClick={handleJoinWaitlist}
                loading={loading}
              >
                {t('homepage.waitlistButton')}
              </Button>
            </div>

            {/* Inline Message Display - Right below the form */}
            {waitlistMessage.message && (
              <div className="mt-4 max-w-lg mx-auto">
                <InlineMessage {...waitlistMessage.message} onDismiss={waitlistMessage.clear} />
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}
