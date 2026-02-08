// components/ui/input.tsx
import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-2 text-sm transition-all duration-200',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-gray-400',
          'focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // States
          error && 'border-coral-500 focus:border-coral-500 focus:ring-coral-500/20',
          success && 'border-green-500 focus:border-green-500 focus:ring-green-500/20',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }