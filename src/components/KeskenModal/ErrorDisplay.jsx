import React from 'react'

const ErrorDisplay = ({ error }) => {
  if (!error) return null

  return (
    <div className="error-message" style={{ 
      color: '#ef4444', 
      marginBottom: '16px',
      padding: '12px 16px',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>⚠️</span>
        <span>{error}</span>
      </div>
    </div>
  )
}

export default ErrorDisplay

