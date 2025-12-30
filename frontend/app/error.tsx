'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { getLocalizedHref } from '@/lib/i18n/config'
import { useI18n } from '@/lib/i18n'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useI18n();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 text-primary">
      <Container variant="auth" className="space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            {t('errorPage.title')}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('errorPage.description')}
          </p>
          {error.digest && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t('errorPage.errorId')} {error.digest}
            </p>
          )}
        </div>
        <div className="mt-5 space-y-4">
          <Button
            onClick={() => reset()}
            className="w-full"
          >
            {t('errorPage.tryAgain')}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = getLocalizedHref('/')}
            className="w-full"
          >
            {t('errorPage.goToHomepage')}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t('errorPage.persistsContact')}
        </p>
      </Container>
    </div>
  )
}