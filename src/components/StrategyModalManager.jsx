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
  const { user, loading } = useAuth()
  const location = useLocation()
  const [forceOpen, setForceOpen] = useState(false)

  // HUOM: Blacklist-logiikka hoidetaan StrategyStatusContext:issa
  // Tämä komponentti tarkistaa vain että käyttäjä on kirjautunut

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

  // Tarkista onko modal minimoitu localStorageen
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    if (user?.id) {
      const skipped = localStorage.getItem(`strategy_modal_skipped_${user.id}`)
      setIsMinimized(skipped === 'true')
    }
  }, [user?.id])

  // Tarkista onko modal auki joko contextin tai force-flagin takia
  // Älä avaa jos modaali on minimoitu
  const isOpen = !isMinimized && (context?.showStrategyModal || forceOpen)

  const handleClose = () => {
    setForceOpen(false)
    context?.closeModal?.()
  }

  if (!context) {
    console.warn('StrategyModalManager: No context available')
    return null
  }

  // ⚠️ TÄRKEÄ: Älä renderöi modaalia jos:
  // 1. Käyttäjätiedot ladataan vielä (loading = true)
  // 2. Käyttäjä ei ole kirjautunut (user = null)
  // Blacklist-sivu logiikka hoidetaan StrategyStatusContext:issa
  if (loading) {
    return null // Odotetaan että käyttäjätiedot latautuvat
  }
  
  if (!user) {
    return null // Ei kirjautunut
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

