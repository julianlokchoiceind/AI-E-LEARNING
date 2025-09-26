'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export function AICursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
      setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div
      className={`ai-cursor ${isVisible ? 'visible' : ''}`}
      style={{
        left: position.x + 15,
        top: position.y + 15
      }}
    >
      <Image
        src="/images/icons/ai-cursor.svg"
        alt="AI"
        width={20}
        height={20}
        priority
        className="pointer-events-none"
      />
    </div>
  )
}