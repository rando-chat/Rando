'use client'
import { AlertTriangle, X } from 'lucide-react'

export function SafetyWarning({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-600" />
        <span className="text-yellow-800 text-sm">{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-yellow-600 hover:text-yellow-800">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
