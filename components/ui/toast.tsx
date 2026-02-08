// components/ui/toast.tsx
'use client'

import * as React from 'react'
import { createContext, useContext, useState } from 'react'
import { Alert } from './alert'
import { Button } from './button'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  toast: (props: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...props, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-dismiss after duration
    setTimeout(() => {
      dismiss(id)
    }, props.duration || 5000)
  }

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const variantStyles = {
    default: 'border-purple-200 bg-purple-50',
    destructive: 'border-red-200 bg-red-50',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50'
  }

  const textStyles = {
    default: 'text-purple-800',
    destructive: 'text-red-800',
    success: 'text-green-800',
    warning: 'text-yellow-800'
  }

  return (
    <div
      className={`rounded-xl border p-4 shadow-lg animate-in slide-in-from-right-10 duration-300 ${variantStyles[toast.variant || 'default']}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className={`font-semibold ${textStyles[toast.variant || 'default']}`}>
            {toast.title}
          </h4>
          {toast.description && (
            <p className={`text-sm mt-1 ${textStyles[toast.variant || 'default']}`}>
              {toast.description}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className={`h-6 w-6 p-0 ${textStyles[toast.variant || 'default']} hover:bg-white/50`}
        >
          ×
        </Button>
      </div>
    </div>
  )
}

// These components need to be defined or imported for the exports to work
// For now, I'll create basic implementations or leave them as exports to be defined elsewhere

export function ToastViewport({ children }: { children?: React.ReactNode }) {
  return <div className="toast-viewport">{children}</div>
}

export function Toast({ children, ...props }: any) {
  return <div className="toast" {...props}>{children}</div>
}

export function ToastTitle({ children }: { children: React.ReactNode }) {
  return <div className="toast-title">{children}</div>
}

export function ToastDescription({ children }: { children: React.ReactNode }) {
  return <div className="toast-description">{children}</div>
}

export function ToastClose({ onClick }: { onClick?: () => void }) {
  return (
    <button className="toast-close" onClick={onClick}>
      ×
    </button>
  )
}

export function ToastAction({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button className="toast-action" onClick={onClick}>
      {children}
    </button>
  )
}

// Export types
export type ToastProps = any // Define proper type as needed
export type ToastActionElement = any // Define proper type as needed

// Export all components and hooks
export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  useToast, // This is now properly exported
  type ToastProps,
  type ToastActionElement,
}