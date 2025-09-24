'use client'

import { useState } from 'react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { useInlineMessage } from '@/hooks/useInlineMessage'
import { useApiMutation } from '@/hooks/useApiMutation'
import { waitlistAPI } from '@/lib/api/waitlist'

interface WaitlistSectionProps {
  className?: string
  containerClassName?: string
}


export function WaitlistSection({
  className = "flex-1 bg-white",
  containerClassName = "py-8 md:py-12 lg:py-24"
}: WaitlistSectionProps) {
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
      waitlistMessage.showError('Please enter your email address')
      return
    }

    if (!email.includes('@')) {
      waitlistMessage.showError('Please enter a valid email address')
      return
    }

    joinWaitlist({ email })
  }

  return (
    <div className="relative bg-gradient-to-r from-primary to-primary/80 text-white">
      <Container variant="public" className={containerClassName}>
        <div className="text-center max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
              Get notified when we're launching
            </h2>
            <p className="text-lg md:text-xl lg:text-xl mb-6 md:mb-8 text-white/90">
              Be Part of the Excitement: Receive Exclusive Launch Updates and Notifications
            </p>
          </div>

          {/* Email Form */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto items-center">
              <input
                type="email"
                placeholder="Email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinWaitlist()}
                className="w-full sm:flex-1 px-4 py-3 bg-transparent border border-white/30 text-white placeholder-white/70 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 outline-none"
                disabled={loading}
              />
              <Button
                size="md"
                className="w-full sm:w-auto sm:min-w-[120px] h-12 bg-white text-primary hover:bg-white/90 border-0"
                onClick={handleJoinWaitlist}
                loading={loading}
              >
                Join now
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