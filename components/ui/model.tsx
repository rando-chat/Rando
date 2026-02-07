'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  preventClose?: boolean
  className?: string
  overlayClassName?: string
  contentClassName?: string
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4'
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  preventClose = false,
  className,
  overlayClassName,
  contentClassName,
}: ModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null)

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !preventClose) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, preventClose])

  // Handle click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (preventClose) return
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop/Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
          overlayClassName
        )}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            ref={modalRef}
            className={cn(
              'relative w-full transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl transition-all',
              sizeClasses[size],
              isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-description' : undefined}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                {title && (
                  <div>
                    <h3
                      id="modal-title"
                      className="text-lg font-semibold text-gray-900 dark:text-white"
                    >
                      {title}
                    </h3>
                    {description && (
                      <p
                        id="modal-description"
                        className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                      >
                        {description}
                      </p>
                    )}
                  </div>
                )}
                
                {showCloseButton && !preventClose && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="ml-4 h-8 w-8 p-0"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className={cn('px-6 py-4', contentClassName)}>
              {children}
            </div>
            
            {/* Footer - optional, can be customized by children */}
          </div>
        </div>
      </div>
    </>
  )
}

// Modal Components
export function ModalHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4 border-b border-gray-200 dark:border-gray-800 pb-4', className)}>
      {children}
    </div>
  )
}

export function ModalBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('mb-6', className)}>{children}</div>
}

export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-end space-x-3 border-t border-gray-200 dark:border-gray-800 pt-4', className)}>
      {children}
    </div>
  )
}

// Confirmation Modal
interface ConfirmationModalProps extends Omit<ModalProps, 'children'> {
  onConfirm: () => void
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  isLoading?: boolean
  message?: string
}

export function ConfirmationModal({
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'default',
  isLoading = false,
  message,
  ...modalProps
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm()
    modalProps.onClose()
  }

  return (
    <Modal {...modalProps}>
      <ModalBody>
        {message || 'Are you sure you want to proceed?'}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={modalProps.onClose}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          variant={confirmVariant}
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  )
}