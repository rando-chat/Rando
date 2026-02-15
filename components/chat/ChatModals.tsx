'use client'

import { useState } from 'react'

interface ChatModalsProps {
  showReport: boolean
  onCloseReport: () => void
  onSubmitReport: (reason: string) => void
  selectedImage: string | null
  onCloseImage: () => void
  editImage: string | null
  onCloseEdit: () => void
  onSendEdit: (file: File) => void
}

export function ChatModals({
  showReport,
  onCloseReport,
  onSubmitReport,
  selectedImage,
  onCloseImage,
  editImage,
  onCloseEdit,
  onSendEdit
}: ChatModalsProps) {
  const [reportReason, setReportReason] = useState('')

  // Report Modal
  if (showReport) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }} onClick={onCloseReport}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          maxWidth: '400px',
          width: '100%'
        }} onClick={e => e.stopPropagation()}>
          <h3 style={{ marginBottom: '16px' }}>Report User</h3>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Why are you reporting this user?"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              marginBottom: '16px',
              minHeight: '100px'
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={onCloseReport} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button 
              onClick={() => {
                onSubmitReport(reportReason)
                setReportReason('')
              }} 
              style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Send Report
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Image Viewer Modal
  if (selectedImage) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        cursor: 'pointer'
      }} onClick={onCloseImage}>
        <img src={selectedImage} alt="Full size" style={{ maxWidth: '90%', maxHeight: '90%' }} />
      </div>
    )
  }

  // Image Editor Modal
  if (editImage) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }} onClick={onCloseEdit}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          maxWidth: '90%',
          maxHeight: '90%',
          overflow: 'auto'
        }} onClick={e => e.stopPropagation()}>
          <h3 style={{ marginBottom: '16px' }}>Edit Image</h3>
          <img src={editImage} alt="Edit" style={{ maxWidth: '100%', maxHeight: '300px', marginBottom: '16px' }} />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={onCloseEdit} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={() => onSendEdit(new File([], ''))} style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Send
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}