'use client'

import React from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: (e: React.FormEvent) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  id?: string
  name?: string
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search...",
  className = "",
  disabled = false,
  size = 'lg',
  id = 'search-bar',
  name = 'search'
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(e)
    }
  }

  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-2 pr-10',
    md: 'px-4 py-3 pr-11',
    lg: 'px-6 py-4 pr-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const buttonSizes = {
    sm: 'right-1 p-1.5',
    md: 'right-1.5 p-1.5',
    lg: 'right-2 p-2'
  }

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full ${sizeClasses[size]} rounded-lg text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary`}
          aria-label={placeholder}
        />
        <button
          type="submit"
          disabled={disabled}
          className={`absolute ${buttonSizes[size]} top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50`}
        >
          <Search className={iconSizes[size]} />
        </button>
      </div>
    </form>
  )
}