'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface UnsavedChangesWarningProps {
  hasUnsavedChanges: boolean
  onConfirmLeave?: () => void
  onCancelLeave?: () => void
  message?: string
}

export function UnsavedChangesWarning({
  hasUnsavedChanges,
  onConfirmLeave,
  onCancelLeave,
  message = 'You have unsaved changes. Are you sure you want to leave?'
}: UnsavedChangesWarningProps) {
  const [showModal, setShowModal] = useState(false)
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Browser beforeunload event
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    // Next.js route change detection
    const handleRouteChange = (url: string) => {
      if (hasUnsavedChanges && url !== window.location.pathname) {
        setNextUrl(url)
        setShowModal(true)
        // Prevent navigation
        throw 'Route change aborted due to unsaved changes'
      }
    }

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload)
      
      // For Next.js App Router, we need to intercept navigation differently
      // This is a simplified approach - in production you might need more sophisticated handling
      const originalPush = router.push
      router.push = (href: string, options?: any) => {
        try {
          handleRouteChange(href)
          return originalPush(href, options)
        } catch (error) {
          return Promise.reject(error)
        }
      }
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges, router])

  const handleConfirmLeave = () => {
    if (onConfirmLeave) {
      onConfirmLeave()
    }
    setShowModal(false)
    if (nextUrl) {
      // Force navigation after confirmation
      window.location.href = nextUrl
    }
  }

  const handleCancelLeave = () => {
    if (onCancelLeave) {
      onCancelLeave()
    }
    setShowModal(false)
    setNextUrl(null)
  }

  if (!showModal) {
    return null
  }

  return (
    <Modal
      isOpen={showModal}
      onClose={handleCancelLeave}
      title="Unsaved Changes"
    >
      <div className="space-y-4">
        <p className="text-gray-600">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleCancelLeave}
          >
            Stay on Page
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmLeave}
          >
            Leave Without Saving
          </Button>
        </div>
      </div>
    </Modal>
  )
}