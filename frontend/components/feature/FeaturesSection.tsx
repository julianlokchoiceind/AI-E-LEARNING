'use client'

import React from 'react'
import { GraduationCap, Bot, TrendingUp, LucideIcon } from 'lucide-react'

interface Feature {
  id: number
  icon: LucideIcon
  title: string
  description: string
  iconBg: string
  iconColor: string
}

const features: Feature[] = [
  {
    id: 1,
    icon: GraduationCap,
    title: 'Quality Courses',
    description: 'Learn from expert creators with structured video content',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    id: 2,
    icon: Bot,
    title: 'AI Study Buddy',
    description: 'Get instant help from our intelligent AI assistant 24/7',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  {
    id: 3,
    icon: TrendingUp,
    title: 'Track Progress',
    description: 'Monitor your learning journey and earn certificates',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600'
  }
]

export function FeaturesSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {features.map((feature) => {
        const IconComponent = feature.icon

        return (
          <div
            key={feature.id}
            className="card-hover p-6 border rounded-lg bg-white group transition-all duration-200 hover:-translate-y-1 hover:border-primary"
          >
            {/* Icon Container */}
            <div className={`inline-flex p-3 rounded-lg ${feature.iconBg} mb-4 group-hover:scale-110 transition-transform duration-200`}>
              <IconComponent className={`w-6 h-6 ${feature.iconColor}`} />
            </div>

            {/* Content */}
            <h3 className="text-xl font-semibold mb-2">
              {feature.title}
            </h3>
            <p className="text-muted-foreground">
              {feature.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}