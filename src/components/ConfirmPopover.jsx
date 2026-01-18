import React, { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

const ConfirmPopover = ({ 
  show, 
  message, 
  confirmText = 'Poista',
  cancelText = 'Peruuta',
  onConfirm, 
  onCancel,
  anchorElement,
  variant = 'danger',
  loading = false,
  t
}) => {
  const popoverRef = useRef(null)

  useEffect(() => {
    if (show && anchorElement && popoverRef.current) {
      const anchorRect = anchorElement.getBoundingClientRect()
      const popover = popoverRef.current
      const popoverRect = popover.getBoundingClientRect()
      
      // Laske optimaalinen sijainti napin vieressä
      let top = anchorRect.bottom + 8
      let left = anchorRect.left
      
      // Varmista että popover ei mene näytön ulkopuolelle
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Jos popover menee oikealta ulos, siirrä vasemmalle
      if (left + popoverRect.width > viewportWidth - 16) {
        left = viewportWidth - popoverRect.width - 16
      }
      
      // Jos popover menee alhaalta ulos, näytä napin yläpuolella
      if (top + popoverRect.height > viewportHeight - 16) {
        top = anchorRect.top - popoverRect.height - 8
      }
      
      // Varmista että popover ei mene vasemmalta ulos
      if (left < 16) {
        left = 16
      }
      
      // Varmista että popover ei mene ylhäältä ulos
      if (top < 16) {
        top = anchorRect.bottom + 8
      }
      
      popover.style.position = 'fixed'
      popover.style.top = `${top}px`
      popover.style.left = `${left}px`
    }
  }, [show, anchorElement])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (show && popoverRef.current && !popoverRef.current.contains(e.target) && 
          anchorElement && !anchorElement.contains(e.target)) {
        onCancel()
      }
    }

    if (show) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [show, onCancel, anchorElement])

  if (!show) return null

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '10px 12px',
        width: '240px',
        zIndex: 10000,
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <p style={{ 
        margin: '0 0 10px 0', 
        fontSize: '13px', 
        color: '#374151',
        lineHeight: '1.4'
      }}>
        {message}
      </p>
      <div style={{ 
        display: 'flex', 
        gap: '6px', 
        justifyContent: 'flex-end' 
      }}>
        <Button
          type="button"
          variant="secondary"
          size="small"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          variant={variant}
          size="small"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? (t?.('ui.buttons.saving') || 'Käsitellään...') : confirmText}
        </Button>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmPopover
