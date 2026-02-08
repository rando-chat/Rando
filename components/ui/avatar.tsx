'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: React.ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  status?: 'online' | 'offline' | 'away' | 'busy'
  showStatus?: boolean
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-20 w-20 text-2xl'
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500'
}

export function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  status,
  showStatus = false,
  className,
  children,
  ...props
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false)
  
  const getInitials = (name?: string): string => {
    if (!name) return '?'
    
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getFallbackContent = (): React.ReactNode => {
    if (fallback !== undefined) return fallback
    if (alt) return getInitials(alt)
    return '?'
  }

  const avatarContent = imgError || !src ? (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold">
      {getFallbackContent()}
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => setImgError(true)}
    />
  )

  return (
    <div className={cn('relative inline-block', className)} {...props}>
      <div
        className={cn(
          'relative flex overflow-hidden rounded-full',
          sizeClasses[size]
        )}
      >
        {avatarContent}
        {children}
      </div>
      
      {showStatus && status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
            statusColors[status],
            size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'
          )}
        />
      )}
    </div>
  )
}

// Avatar Group Component
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number
  children: React.ReactNode
}

export function AvatarGroup({ max = 3, children, className, ...props }: AvatarGroupProps) {
  const childrenArray = React.Children.toArray(children)
  const totalChildren = childrenArray.length
  const visibleChildren = childrenArray.slice(0, max)
  const hiddenCount = totalChildren - max

  return (
    <div className={cn('flex -space-x-2', className)} {...props}>
      {visibleChildren.map((child, index) => (
        <div key={index} className="ring-2 ring-white dark:ring-gray-800 rounded-full">
          {child}
        </div>
      ))}
      
      {hiddenCount > 0 && (
        <div className="ring-2 ring-white dark:ring-gray-800 rounded-full">
          <Avatar
            size="sm"
            className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            fallback={`+${hiddenCount}`}
          />
        </div>
      )}
    </div>
  )
}

export default Avatar