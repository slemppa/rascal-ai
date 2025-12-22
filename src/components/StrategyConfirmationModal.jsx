import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import './ModalComponents.css'
import './StrategyConfirmationModal.css'

const StrategyConfirmationModal = ({ isOpen, onClose, onRequestUpdate, loading }) => {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const [isMinimized, setIsMinimized] = useState(false)

  // Tarkista localStorage kun komponentti mountataan
  useEffect(() => {
    if (user?.id) {
      const skipped = localStorage.getItem(`strategy_modal_skipped_${user.id}`)
      if (skipped === 'true') {
        setIsMinimized(true)
      }
    }
  }, [user?.id])

  // Tarkista localStorage kun modaali avataan
  useEffect(() => {
    if (isOpen && user?.id) {
      const skipped = localStorage.getItem(`strategy_modal_skipped_${user.id}`)
      if (skipped === 'true') {
        setIsMinimized(true)
      } else {
        setIsMinimized(false)
      }
    }
  }, [isOpen, user?.id])

  const handleSkip = () => {
    // Minimoi modaali ja tallenna localStorageen
    if (user?.id) {
      localStorage.setItem(`strategy_modal_skipped_${user.id}`, 'true')
    }
    setIsMinimized(true)
    onClose()
  }

  const handleRestore = () => {
    // Palauta modaali normaalikokoon
    setIsMinimized(false)
    if (user?.id) {
      localStorage.removeItem(`strategy_modal_skipped_${user.id}`)
    }
  }

  // Jos minimoitu, näytä vain pieni nappi
  if (isMinimized && user?.id) {
    return (
      <div className="strategy-modal-minimized" onClick={handleRestore}>
        <div className="strategy-modal-minimized-content">
          <span>Strategia vahvistusta odottaa</span>
          <button 
            className="btn-restore" 
            onClick={(e) => { 
              e.stopPropagation()
              handleRestore()
            }}
          >
            Palauta
          </button>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div 
      className="modal-overlay modal-overlay--light"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-container modal-container--create">
        <div className="modal-header">
          <h2 className="modal-title">Uusi strategia saatavilla!</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          <div style={{ textAlign: 'center' }}>

            <p style={{ 
              margin: '0 0 20px 0', 
              fontSize: '16px', 
              color: '#374151',
              lineHeight: '1.6'
            }}>
              Ennen kuin voimme aloittaa sisällön generoinnin, meidän täytyy varmistaa että strategia on ajan tasalla ja sopii nykyiseen tilanteeseen.
            </p>
            
            <div style={{ 
              backgroundColor: '#fef3c7', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #fbbf24',
              textAlign: 'left'
            }}>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#92400e',
                textAlign: 'center'
              }}>
                Miksi tämä on tärkeää?
              </h3>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '20px', 
                color: '#92400e',
                lineHeight: '1.8',
                fontSize: '14px'
              }}>
                <li>Varmistamme että strategia vastaa nykyistä markkinatilannetta</li>
                <li>Varmistamme että tavoitteet ovat edelleen relevantteja</li>
                <li>Varmistamme että resurssit riittävät toteuttamiseen</li>
                <li>Varmistamme että ympäristö ei ole muuttunut merkittävästi</li>
              </ul>
            </div>

            <p style={{ 
              margin: '0 0 24px 0',
              fontSize: '14px', 
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              Tämä varmistaa että generoimamme strategia on mahdollisimman tehokas ja sopiva tilanteeseen.
            </p>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              gap: '12px'
            }}>
              <Button
                variant="primary"
                onClick={onRequestUpdate}
                disabled={loading}
              >
                {loading ? 'Käsitellään...' : 'Tarkista strategia'}
              </Button>
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ justifyContent: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          <button 
            className="btn-text"
            onClick={handleSkip}
            style={{
              background: 'transparent',
              color: '#6b7280',
              border: 'none',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
          >
            Piilota toistaiseksi
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default StrategyConfirmationModal
