'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { ReportReasons } from './ReportReasons'
import { useReports } from '@/hooks/useReports'

interface ReportModalProps {
  sessionId: string
  onClose: () => void
}

export function ReportModal({ sessionId, onClose }: ReportModalProps) {
  const [category, setCategory] = useState('')
  const [reason, setReason] = useState('')
  const { submitReport, isSubmitting } = useReports()

  const handleSubmit = async () => {
    if (!category || !reason) return
    await submitReport({ sessionId, category, reason })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Report User</h2>
          <button onClick={onClose}><X /></button>
        </div>
        
        <ReportReasons selected={category} onSelect={setCategory} />
        
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe what happened (10-1000 characters)..."
          className="w-full border rounded-lg p-3 mt-4"
          rows={4}
          minLength={10}
          maxLength={1000}
        />
        
        <button
          onClick={handleSubmit}
          disabled={!category || !reason || isSubmitting}
          className="w-full mt-4 bg-red-600 text-white py-3 rounded-lg disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>
    </div>
  )
}
