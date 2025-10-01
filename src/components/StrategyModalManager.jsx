import React, { useState, useEffect } from 'react'
import { useStrategyStatus } from '../contexts/StrategyStatusContext'
import StrategyConfirmationModal from './StrategyConfirmationModal'

/**
 * Erillinen komponentti joka hallinnoi strategia-modalin näkyvyyttä.
 * Käyttää sekä context-statea ETTÄ window eventejä varmistaakseen toiminnan.
 */
export default function StrategyModalManager() {
  const context = useStrategyStatus()
  const [forceOpen, setForceOpen] = useState(false)

  console.log('StrategyModalManager render:', { 
    contextModal: context?.showStrategyModal, 
    forceOpen,
    loading: context?.loading 
  })

  // Kuuntele window eventejä modalin avaamiseen
  useEffect(() => {
    const handleOpen = (e) => {
      console.log('StrategyModalManager: Received open event:', e.detail)
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

  console.log('StrategyModalManager: Final isOpen =', isOpen)

  const handleClose = () => {
    setForceOpen(false)
    context?.closeModal?.()
  }

  if (!context) {
    console.warn('StrategyModalManager: No context available')
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

