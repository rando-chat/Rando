// components/ui/badge.tsx
import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white border-transparent',
    secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300',
    outline: 'border-2 border-purple-300 text-purple-700 bg-transparent',
    destructive: 'bg-gradient-to-r from-coral-500 to-red-500 text-white border-transparent'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }