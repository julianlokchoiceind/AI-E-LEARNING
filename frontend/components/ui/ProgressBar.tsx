import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value?: number
  max?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  label?: string
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ 
    value = 0, 
    max = 100, 
    className, 
    size = 'md',
    variant = 'default',
    showLabel = false,
    label,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    }
    
    const variantClasses = {
      default: 'bg-primary',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500'
    }

    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        {(showLabel || label) && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">
              {label || `${Math.round(percentage)}%`}
            </span>
            {showLabel && !label && (
              <span className="text-sm text-gray-500">
                {value}/{max}
              </span>
            )}
          </div>
        )}
        <div className={cn(
          "w-full bg-gray-200 rounded-full overflow-hidden",
          sizeClasses[size]
        )}>
          <div
            className={cn(
              "h-full transition-all duration-300 ease-in-out rounded-full",
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)

ProgressBar.displayName = "ProgressBar"

export { ProgressBar }