'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  delay?: number
  maxWidth?: number
  className?: string
  contentClassName?: string
  disabled?: boolean
}

export function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  delay = 300,
  maxWidth = 200,
  className,
  contentClassName,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const showTooltip = () => {
    if (disabled) return
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
  }

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const scrollY = window.scrollY
    const scrollX = window.scrollX

    let x = 0
    let y = 0

    switch (side) {
      case 'top':
        y = triggerRect.top + scrollY - tooltipRect.height - 8
        break
      case 'bottom':
        y = triggerRect.bottom + scrollY + 8
        break
      case 'left':
        x = triggerRect.left + scrollX - tooltipRect.width - 8
        break
      case 'right':
        x = triggerRect.right + scrollX + 8
        break
    }

    switch (align) {
      case 'start':
        if (side === 'top' || side === 'bottom') {
          x = triggerRect.left + scrollX
        } else {
          y = triggerRect.top + scrollY
        }
        break
      case 'center':
        if (side === 'top' || side === 'bottom') {
          x = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2
        } else {
          y = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2
        }
        break
      case 'end':
        if (side === 'top' || side === 'bottom') {
          x = triggerRect.right + scrollX - tooltipRect.width
        } else {
          y = triggerRect.bottom + scrollY - tooltipRect.height
        }
        break
    }

    // Constrain to viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (x + tooltipRect.width > viewportWidth + scrollX) {
      x = viewportWidth + scrollX - tooltipRect.width - 8
    }
    if (x < scrollX) {
      x = scrollX + 8
    }
    if (y + tooltipRect.height > viewportHeight + scrollY) {
      y = viewportHeight + scrollY - tooltipRect.height - 8
    }
    if (y < scrollY) {
      y = scrollY + 8
    }

    setPosition({ x, y })
  }

  React.useEffect(() => {
    if (isVisible) {
      updatePosition()
      window.addEventListener('scroll', updatePosition)
      window.addEventListener('resize', updatePosition)
    }
    return () => {
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isVisible])

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      ref={triggerRef}
      className={cn('relative inline-block', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && content && (
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-50 animate-in fade-in-0 zoom-in-95',
            'rounded-md bg-gray-900 dark:bg-gray-800 px-3 py-1.5 text-sm text-white shadow-lg',
            'border border-gray-800 dark:border-gray-700',
            contentClassName
          )}
          style={{
            left: position.x,
            top: position.y,
            maxWidth,
          }}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              'absolute h-2 w-2 rotate-45 bg-gray-900 dark:bg-gray-800 border border-gray-800 dark:border-gray-700',
              side === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-0 border-l-0',
              side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-0 border-r-0',
              side === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-0 border-b-0',
              side === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-0 border-t-0'
            )}
          />
        </div>
      )}
    </div>
  )
}

// Simplified Tooltip for common use cases
interface SimpleTooltipProps extends Omit<TooltipProps, 'content'> {
  text: string
}

export function SimpleTooltip({ text, children, ...props }: SimpleTooltipProps) {
  return (
    <Tooltip content={text} {...props}>
      {children}
    </Tooltip>
  )
}