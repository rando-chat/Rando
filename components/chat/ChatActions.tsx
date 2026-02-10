'use client'
import { useState } from 'react'
import { LogOut, Flag, Ban } from 'lucide-react'
import { ReportModal } from '../moderation/ReportModal'

interface ChatActionsProps {
  sessionId: string
  onClose: () => void
  onEndChat: () => Promise<void>
}

export function ChatActions({ sessionId, onClose, onEndChat }: ChatActionsProps) {
  const [showReport, setShowReport] = useState(false)

  return (
    <div className="absolute right-4 top-14 bg-white shadow-lg rounded-lg border p-2 z-10 min-w-[200px]">
      <button
        onClick={async () => { await onEndChat(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg text-left"
      >
        <LogOut className="w-4 h-4" />
        <span>End Chat</span>
      </button>
      <button
        onClick={() => setShowReport(true)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 rounded-lg text-left"
      >
        <Flag className="w-4 h-4" />
        <span>Report User</span>
      </button>

      {showReport && (
        <ReportModal
          sessionId={sessionId}
          onClose={() => { setShowReport(false); onClose(); }}
        />
      )}
    </div>
  )
}
