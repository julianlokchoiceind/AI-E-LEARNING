'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md' 
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div
          ref={modalRef}
          className={`relative bg-white rounded-lg sm:rounded-xl shadow-xl transform transition-all w-full ${sizeClasses[size]} mx-2 sm:mx-0 my-4 sm:my-8 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col`}
        >
          {/* Header */}
          {title && (
            <div className="border-b px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 pr-8">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="absolute right-3 sm:right-4 top-3 sm:top-4 text-gray-400 hover:text-gray-500 touch-manipulation p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}