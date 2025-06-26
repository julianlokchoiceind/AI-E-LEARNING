'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Oops! Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We encountered an unexpected error. Please try again.
          </p>
          {error.digest && (
            <p className="mt-1 text-xs text-gray-500">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="mt-5 space-y-4">
          <Button
            onClick={() => reset()}
            className="w-full"
          >
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to Homepage
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  )
}