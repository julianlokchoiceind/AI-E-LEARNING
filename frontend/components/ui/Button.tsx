import React from 'react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from './LoadingStates'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none touch-manipulation select-none active:scale-95'
    
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary/90 active:bg-primary/95 focus-visible:ring-primary',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/85 focus-visible:ring-secondary',
      outline: 'border border-input bg-background hover:bg-primary/10 hover:text-primary active:bg-primary/20 focus-visible:ring-primary',
      ghost: 'hover:bg-primary/10 hover:text-primary active:bg-primary/20 focus-visible:ring-primary',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 focus-visible:ring-destructive',
    }
    
    const sizes = {
      sm: 'h-8 px-3 text-xs sm:text-sm min-h-[32px]', // Ensure minimum touch target
      md: 'h-9 sm:h-10 px-3 sm:px-4 py-2 text-sm sm:text-base min-h-[36px] sm:min-h-[40px]',   // Standard touch target
      lg: 'h-10 sm:h-11 lg:h-12 px-4 sm:px-5 lg:px-6 text-base sm:text-lg min-h-[40px] sm:min-h-[44px] lg:min-h-[48px]', // Large touch target for primary actions
    }
    
    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <LoadingSpinner size="sm" /> : children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }