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
  featured?: boolean
  accentGradient?: string
}

const features: Feature[] = [
  {
    id: 1,
    icon: GraduationCap,
    titleKey: 'homepage.featureQualityCourses',
    descriptionKey: 'homepage.featureQualityCoursesDesc',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    featured: true
  },
  {
    id: 2,
    icon: Bot,
    titleKey: 'homepage.featureAIBuddy',
    descriptionKey: 'homepage.featureAIBuddyDesc',
    iconBg: 'bg-purple-100 dark:bg-purple-500/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    accentGradient: 'from-purple-500/[0.04] to-transparent'
  },
  {
    id: 3,
    icon: TrendingUp,
    titleKey: 'homepage.featureTrackProgress',
    descriptionKey: 'homepage.featureTrackProgressDesc',
    iconBg: 'bg-green-100 dark:bg-green-500/20',
    iconColor: 'text-green-600 dark:text-green-400',
    accentGradient: 'from-green-500/[0.04] to-transparent'
  }
]

export function FeaturesSection() {
  const { t } = useI18n()
  const featured = features.find(f => f.featured)
  const others = features.filter(f => !f.featured)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Featured card - spans 2 rows on desktop */}
      {featured && (
        <div className="md:row-span-2 bento-featured rounded-xl p-8 flex flex-col justify-end text-white group border border-white/[0.06] hover:border-white/[0.12] transition-colors duration-300">
          <div className={`inline-flex p-3 rounded-lg ${featured.iconBg} mb-4 w-fit group-hover:scale-110 transition-transform duration-200`}>
            <featured.icon className={`w-6 h-6 ${featured.iconColor}`} />
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {t(featured.titleKey)}
          </h3>
          <p className="text-slate-300">
            {t(featured.descriptionKey)}
          </p>
        </div>
      )}

      {/* Smaller cards with accent gradient backgrounds */}
      {others.map((feature) => {
        const IconComponent = feature.icon
        return (
          <div
            key={feature.id}
            className={`card-modern p-6 group relative overflow-hidden ${feature.accentGradient ? `bg-gradient-to-br ${feature.accentGradient}` : ''}`}
          >
            <div className={`inline-flex p-3 rounded-lg ${feature.iconBg} mb-4 group-hover:scale-110 transition-transform duration-200`}>
              <IconComponent className={`w-6 h-6 ${feature.iconColor}`} />
            </div>
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
