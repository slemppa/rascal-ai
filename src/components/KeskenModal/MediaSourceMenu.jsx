import React from 'react'

const MediaSourceMenu = ({ 
  show, 
  onSelectKuvapankki, 
  onSelectKoneelta,
  style = {}
}) => {
  if (!show) return null

  return (
    <div 
      className="media-source-menu"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        marginBottom: '4px',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: '180px',
        ...style
      }}
    >
      <button
        type="button"
        onClick={onSelectKuvapankki}
        style={{
          width: '100%',
          padding: '10px 16px',
          textAlign: 'left',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#374151'
        }}
        onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
        onMouseLeave={(e) => e.target.style.background = 'none'}
      >
        Valitse kuvapankista
      </button>
      <button
        type="button"
        onClick={onSelectKoneelta}
        style={{
          width: '100%',
          padding: '10px 16px',
          textAlign: 'left',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#374151',
          borderTop: '1px solid #e5e7eb'
        }}
        onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
        onMouseLeave={(e) => e.target.style.background = 'none'}
      >
        Valitse koneelta
      </button>
    </div>
  )
}

export default MediaSourceMenu

