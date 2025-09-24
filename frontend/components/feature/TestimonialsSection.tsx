'use client'

import React from 'react'
import { getInitials } from '@/lib/utils/formatters'

interface Testimonial {
  id: number
  name: string
  role: string
  company: string
  avatar?: string
  rating: number
  content: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Trần Thị Bình",
    role: "Data Scientist",
    company: "",
    rating: 5,
    content: "Finally, a comprehensive AI learning platform designed for Vietnamese developers! The preview looks incredibly promising with structured learning paths and practical projects. Can't wait for the official launch!"
  },
  {
    id: 2,
    name: "Lê Minh Cường",
    role: "AI Engineer",
    company: "",
    rating: 5,
    content: "The 24/7 AI assistant feature sounds revolutionary! Having immediate help when stuck on complex machine learning concepts will be a game-changer for developers like me. Eagerly awaiting access!"
  },
  {
    id: 3,
    name: "Phạm Thu Hà",
    role: "Software Engineer",
    company: "",
    rating: 5,
    content: "This platform addresses exactly what's missing in the Vietnamese tech education space. The focus on cutting-edge AI technologies with hands-on implementation is exactly what I need to advance my career."
  },
  {
    id: 4,
    name: "Nguyễn Văn An",
    role: "Full Stack Developer",
    company: "",
    rating: 5,
    content: "The website interface is clean and intuitive. The promise of expert-led courses combined with AI-powered learning assistance makes this the most exciting educational platform I've seen. Looking forward to enrollment!"
  }
]

export function TestimonialsSection() {
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

  const renderAvatar = (testimonial: Testimonial) => {
    if (testimonial.avatar) {
      return (
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="w-16 h-16 rounded-full object-cover"
        />
      )
    }

    // Generate background color based on name
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500'
    ]
    const colorIndex = testimonial.name.charCodeAt(0) % colors.length

    return (
      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg ${colors[colorIndex]}`}>
        {getInitials(testimonial.name)}
      </div>
    )
  }

  return (
    <div>
      {/* 4 Static Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="bg-white rounded-lg shadow-sm border p-6 text-center hover:shadow-md transition-shadow"
          >
            {/* Quote Icon */}
            <div className="flex justify-center mb-4">
              <div className="text-4xl text-primary">
                "
              </div>
            </div>

            {/* Avatar */}
            <div className="flex justify-center mb-4">
              {renderAvatar(testimonial)}
            </div>

            {/* Content */}
            <p className="text-sm mb-4 leading-relaxed text-gray-900">
              {testimonial.content}
            </p>

            {/* Stars */}
            <div className="flex justify-center mb-3">
              {renderStars(testimonial.rating)}
            </div>

            {/* Name & Role */}
            <div className="text-gray-900">
              <p className="font-semibold text-sm">{testimonial.name}</p>
              <p className="text-xs text-muted-foreground">{testimonial.role}</p>
              {testimonial.company && (
                <p className="text-xs text-muted-foreground">{testimonial.company}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}