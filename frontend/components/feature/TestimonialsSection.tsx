'use client'

import React from 'react'
import { getInitials } from '@/lib/utils/formatters'
import { useI18n } from '@/lib/i18n/context'
import { TranslationKey } from '@/lib/i18n/utils'

interface TestimonialConfig {
  id: number
  nameKey: TranslationKey
  roleKey: TranslationKey
  contentKey: TranslationKey
  company: string
  avatar?: string
  rating: number
}

const testimonialConfigs: TestimonialConfig[] = [
  {
    id: 1,
    nameKey: 'testimonials.testimonial1Name',
    roleKey: 'testimonials.testimonial1Role',
    contentKey: 'testimonials.testimonial1Content',
    company: '',
    rating: 5,
  },
  {
    id: 2,
    nameKey: 'testimonials.testimonial2Name',
    roleKey: 'testimonials.testimonial2Role',
    contentKey: 'testimonials.testimonial2Content',
    company: '',
    rating: 5,
  },
  {
    id: 3,
    nameKey: 'testimonials.testimonial3Name',
    roleKey: 'testimonials.testimonial3Role',
    contentKey: 'testimonials.testimonial3Content',
    company: '',
    rating: 5,
  },
  {
    id: 4,
    nameKey: 'testimonials.testimonial4Name',
    roleKey: 'testimonials.testimonial4Role',
    contentKey: 'testimonials.testimonial4Content',
    company: '',
    rating: 5,
  }
]

export function TestimonialsSection() {
  const { t } = useI18n()

  // Render star ratings
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${
          i < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ))
  }

  const renderAvatar = (name: string, avatar?: string) => {
    if (avatar) {
      return (
        <img
          src={avatar}
          alt={name}
          className="w-16 h-16 rounded-full object-cover"
        />
      )
    }

    // Generate background color based on name
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-cyan-500',
      'bg-pink-500',
      'bg-sky-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500'
    ]
    const colorIndex = name.charCodeAt(0) % colors.length

    return (
      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg ${colors[colorIndex]}`}>
        {getInitials(name)}
      </div>
    )
  }

  return (
    <div>
      {/* 4 Static Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {testimonialConfigs.map((config) => {
          const name = t(config.nameKey)
          const role = t(config.roleKey)
          const content = t(config.contentKey)

          return (
            <div
              key={config.id}
              className="glass-card rounded-xl p-6 text-center transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="flex justify-center mb-4">
                <div className="text-4xl text-primary">
                  "
                </div>
              </div>

              {/* Avatar */}
              <div className="flex justify-center mb-4">
                {renderAvatar(name, config.avatar)}
              </div>

              {/* Content */}
              <p className="text-sm mb-4 leading-relaxed text-foreground">
                {content}
              </p>

              {/* Stars */}
              <div className="flex justify-center mb-3">
                {renderStars(config.rating)}
              </div>

              {/* Name & Role */}
              <div>
                <p className="font-semibold text-sm text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
                {config.company && (
                  <p className="text-xs text-muted-foreground">{config.company}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
