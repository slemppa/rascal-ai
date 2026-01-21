import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import TicketModal from './TicketModal'
import './Button.css'

const TicketButton = () => {
  const { t } = useTranslation('common')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Näytä nappi vain jos käyttäjä on kirjautunut sisään
    setIsVisible(!!user)
  }, [user])

  if (!isVisible) return null

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="button button-primary ticket-button"
        title={t('ticket.buttonTitle')}
        style={{
          position: 'fixed',
          top: '50%',
          right: '10px',
          transform: 'translateY(-50%)',
          zIndex: 9999,
          borderRadius: '50px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          minWidth: 'auto'
        }}
      >
        <span>{t('ticket.buttonLabel')}</span>
      </button>

      {isModalOpen && createPortal(
        <TicketModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />,
        document.body
      )}
    </>
  )
}

export default TicketButton
