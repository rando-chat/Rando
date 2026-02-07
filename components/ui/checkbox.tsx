// components/ui/checkbox.tsx
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="flex items-start space-x-3">
        <div className="flex h-5 items-center">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            className={cn(
              'h-5 w-5 rounded-xl border-2 border-gray-300 text-purple-600',
              'focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-200',
              className
            )}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="grid gap-1.5 leading-none">
            {label && (
              <label
                htmlFor={checkboxId}
                className="text-sm font-medium text-gray-800 cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }