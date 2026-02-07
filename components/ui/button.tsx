// components/ui/button.tsx
import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon'
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
          // Variants
          {
            'default': 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:from-purple-600 hover:to-blue-600 hover:shadow-xl focus-visible:ring-purple-500',
            'destructive': 'bg-gradient-to-r from-coral-500 to-red-500 text-white shadow-lg hover:from-coral-600 hover:to-red-600 hover:shadow-xl focus-visible:ring-coral-500',
            'outline': 'border-2 border-purple-300 bg-transparent text-purple-700 hover:bg-purple-50 hover:border-purple-400 focus-visible:ring-purple-500',
            'secondary': 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 shadow-sm hover:from-gray-200 hover:to-gray-300 hover:shadow focus-visible:ring-gray-500',
            'ghost': 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
            'link': 'text-purple-600 underline-offset-4 hover:underline',
          }[variant],
          // Sizes
          {
            'default': 'h-10 px-6 py-2 text-sm',
            'sm': 'h-8 px-4 text-xs',
            'lg': 'h-12 px-8 text-base',
            'xl': 'h-14 px-10 text-lg font-semibold',
            'icon': 'h-10 w-10',
          }[size],
          // Loading state
          isLoading && 'relative text-transparent hover:text-transparent',
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }