'use client'

import React from 'react'
import { GraduationCap, Bot, TrendingUp, LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { TranslationKey } from '@/lib/i18n/utils'

interface Feature {
  id: number
  icon: LucideIcon
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  iconBg: string
  iconColor: string
}

const features: Feature[] = [
  {
    id: 1,
    icon: GraduationCap,
    titleKey: 'homepage.featureQualityCourses',
    descriptionKey: 'homepage.featureQualityCoursesDesc',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    id: 2,
    icon: Bot,
    titleKey: 'homepage.featureAIBuddy',
    descriptionKey: 'homepage.featureAIBuddyDesc',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  {
    id: 3,
    icon: TrendingUp,
    titleKey: 'homepage.featureTrackProgress',
    descriptionKey: 'homepage.featureTrackProgressDesc',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600'
  }
]

export function FeaturesSection() {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {features.map((feature) => {
        const IconComponent = feature.icon

        return (
          <div
            key={feature.id}
            className="card-hover p-6 border rounded-lg bg-white group hover:border-primary"
          >
            {/* Icon Container */}
            <div className={`inline-flex p-3 rounded-lg ${feature.iconBg} mb-4 group-hover:scale-110 transition-transform duration-200`}>
              <IconComponent className={`w-6 h-6 ${feature.iconColor}`} />
            </div>

            {/* Content */}
            <h3 className="text-xl font-semibold mb-2">
              {t(feature.titleKey)}
            </h3>
            <p className="text-muted-foreground">
              {t(feature.descriptionKey)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
