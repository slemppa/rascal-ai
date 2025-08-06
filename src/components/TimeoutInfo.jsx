import React from 'react'
import { useAutoLogout } from '../contexts/AutoLogoutContext'
import { useLocation } from 'react-router-dom'
import { getContextTimeout } from '../utils/inactivityUtils'

const TimeoutInfo = () => {
  const { currentTimeout, isActive } = useAutoLogout()
  const location = useLocation()
  const contextTimeout = getContextTimeout(location.pathname)

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      zIndex: 1000,
      fontFamily: 'monospace'
    }}>
      <div>Timeout: {currentTimeout}min</div>
      <div>Active: {isActive ? '✓' : '✗'}</div>
      <div>Context: {contextTimeout}min</div>
    </div>
  )
}

export default TimeoutInfo 