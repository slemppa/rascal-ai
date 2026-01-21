import React from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

const ConfirmationToast = ({
  show,
  message,
  onSave,
  onDiscard,
  saveLabel = 'Tallenna',
  discardLabel = 'Hylkää'
}) => {
  if (!show) return null

  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10001,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      background: '#1f2937',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: 10,
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      animation: 'slideUp 0.2s ease-out'
    }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{message}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          onClick={onDiscard}
          variant="secondary"
          style={{
            padding: '6px 14px',
            fontSize: 13,
            background: '#374151',
            border: '1px solid #4b5563',
            color: '#fff'
          }}
        >
          {discardLabel}
        </Button>
        <Button
          onClick={onSave}
          style={{
            padding: '6px 14px',
            fontSize: 13,
            background: '#3b82f6',
            border: 'none',
            color: '#fff'
          }}
        >
          {saveLabel}
        </Button>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmationToast
