'use client'

import { useState } from 'react'

interface ChatModalsProps {
  showReport: boolean
  onCloseReport: () => void
  onSubmitReport: (reason: string, category: string) => void
  selectedImage: string | null
  onCloseImage: () => void
  editImage: string | null
  onCloseEdit: () => void
  onSendEdit: (file: File) => void
}

const REPORT_CATEGORIES = [
  'harassment',
  'hate_speech',
  'spam',
  'inappropriate_content',
  'underage',
  'sharing_personal_info',
  'threats',
  'other'
]

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
  const [reportCategory, setReportCategory] = useState('other')

  if (showReport) {
    return (
      <div style={modalOverlayStyle} onClick={onCloseReport}>
        <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
          <h3 style={modalTitleStyle}>Report User</h3>
          
          <select
            value={reportCategory}
            onChange={(e) => setReportCategory(e.target.value)}
            style={selectStyle}
          >
            {REPORT_CATEGORIES.map(cat => (
              <option key={cat} value={cat} style={{ background: '#0a0a0f' }}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Why are you reporting this user?"
            style={textareaStyle}
          />
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={onCloseReport} style={modalCancelButtonStyle}>
              Cancel
            </button>
            <button
              onClick={() => {
                onSubmitReport(reportReason, reportCategory)
                setReportReason('')
                setReportCategory('other')
              }}
              style={modalSubmitButtonStyle}
            >
              Send Report
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (selectedImage) {
    return (
      <div style={modalOverlayStyle} onClick={onCloseImage}>
        <img
          src={selectedImage}
          alt="Full size"
          style={{
            maxWidth: '90%',
            maxHeight: '90%',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    )
  }

  if (editImage) {
    return (
      <div style={modalOverlayStyle} onClick={onCloseEdit}>
        <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
          <h3 style={modalTitleStyle}>Edit Image</h3>
          <img
            src={editImage}
            alt="Edit"
            style={{
              maxWidth: '100%',
              maxHeight: '300px',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={onCloseEdit} style={modalCancelButtonStyle}>
              Cancel
            </button>
            <button
              onClick={() => {
                fetch(editImage)
                  .then(res => res.blob())
                  .then(blob => {
                    const file = new File([blob], 'image.jpg', { type: 'image/jpeg' })
                    onSendEdit(file)
                  })
              }}
              style={modalSubmitButtonStyle}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

const modalOverlayStyle = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(10,10,15,0.95)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px',
}

const modalContentStyle = {
  background: '#0a0a0f',
  border: '1px solid rgba(124,58,237,0.3)',
  borderRadius: 'clamp(12px, 3vw, 16px)',
  padding: 'clamp(20px, 5vw, 24px)',
  maxWidth: '400px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto' as const,
  boxShadow: '0 20px 60px rgba(124,58,237,0.2)',
}

const modalTitleStyle = {
  fontSize: 'clamp(18px, 4.5vw, 20px)',
  fontWeight: 600,
  color: '#f0f0f0',
  marginBottom: '20px',
  fontFamily: "'Georgia', serif",
}

const selectStyle = {
  width: '100%',
  padding: '12px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(124,58,237,0.2)',
  borderRadius: '8px',
  color: '#f0f0f0',
  marginBottom: '16px',
  fontSize: 'clamp(14px, 3.5vw, 15px)',
}

const textareaStyle = {
  width: '100%',
  padding: '12px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(124,58,237,0.2)',
  borderRadius: '8px',
  color: '#f0f0f0',
  marginBottom: '16px',
  minHeight: '100px',
  fontSize: 'clamp(14px, 3.5vw, 15px)',
  resize: 'vertical' as const,
}

const modalCancelButtonStyle = {
  padding: '10px 20px',
  background: 'transparent',
  border: '1px solid rgba(124,58,237,0.2)',
  borderRadius: '8px',
  color: '#a0a0b0',
  cursor: 'pointer',
  fontSize: 'clamp(13px, 3.2vw, 14px)',
}

const modalSubmitButtonStyle = {
  padding: '10px 20px',
  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
  border: 'none',
  borderRadius: '8px',
  color: 'white',
  cursor: 'pointer',
  fontSize: 'clamp(13px, 3.2vw, 14px)',
}