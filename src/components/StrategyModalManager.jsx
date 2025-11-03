import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useStrategyStatus } from '../contexts/StrategyStatusContext'
import { useAuth } from '../contexts/AuthContext'
import StrategyConfirmationModal from './StrategyConfirmationModal'

/**
 * Erillinen komponentti joka hallinnoi strategia-modalin näkyvyyttä.
 * Käyttää sekä context-statea ETTÄ window eventejä varmistaakseen toiminnan.
 * TÄRKEÄ: Näyttää modalin VAIN kirjautuneille käyttäjille suojatuilla sivuilla.
 */
export default function StrategyModalManager() {
  const context = useStrategyStatus()
  const { user } = useAuth()
  const location = useLocation()
  const [forceOpen, setForceOpen] = useState(false)

  // Julkiset sivut joilla modaalia EI SAA näyttää (käyttäjä ei ole kirjautunut)
  const PUBLIC_PAGES = [
    '/',
    '/signin',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/auth/callback'
  ]

  // Tarkista onko nykyinen sivu julkinen
  const isPublicPage = PUBLIC_PAGES.some(page => location.pathname === page || location.pathname.startsWith(page))

  // Kuuntele window eventejä modalin avaamiseen
  useEffect(() => {
    const handleOpen = (e) => {
      setForceOpen(true)
    }

    window.addEventListener('strategy-modal-should-open', handleOpen)
    window.addEventListener('force-strategy-modal-open', handleOpen)
    
    return () => {
      window.removeEventListener('strategy-modal-should-open', handleOpen)
      window.removeEventListener('force-strategy-modal-open', handleOpen)
    }
  }, [])

  // Tarkista onko modal auki joko contextin tai force-flagin takia
  const isOpen = context?.showStrategyModal || forceOpen

  const handleClose = () => {
    setForceOpen(false)
    context?.closeModal?.()
  }

  if (!context) {
    console.warn('StrategyModalManager: No context available')
    return null
  }

  // ⚠️ TÄRKEÄ: Älä renderöi modaalia jos käyttäjä ei ole kirjautunut TAI ollaan julkisella sivulla
  if (!user || isPublicPage) {
    return null
  }

  return (
    <StrategyConfirmationModal
      isOpen={isOpen}
      onClose={handleClose}
      onRequestUpdate={context.requestStrategyUpdate}
      loading={context.loading}
    />
  )
}

