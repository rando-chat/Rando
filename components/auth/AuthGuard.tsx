// components/auth/AuthGuard.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireGuest?: boolean
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireGuest = false,
  redirectTo = '/' 
}: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, isGuest, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo)
    }

    if (requireGuest && !isGuest) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isGuest, isLoading, requireAuth, requireGuest, redirectTo, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 w-full max-w-md">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mx-auto" />
            <div className="pt-8">
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null // Will redirect in useEffect
  }

  if (requireGuest && !isGuest) {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}