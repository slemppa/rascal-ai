import React, { useState } from 'react'
import { useAutoLogout } from '../contexts/AutoLogoutContext'
import { useLocation } from 'react-router-dom'
import { getContextTimeout, saveTimeoutPreference } from '../utils/inactivityUtils'

const TestAutoLogout = () => {
  const { currentTimeout, isActive, setActivityState, handleLogout } = useAutoLogout()
  const location = useLocation()
  const contextTimeout = getContextTimeout(location.pathname)
  const [testTimeout, setTestTimeout] = useState(1) // 1 minuutti testausta varten

  const setTestTimeoutValue = (minutes) => {
    setTestTimeout(minutes)
    saveTimeoutPreference(minutes)
    // Päivitä sivu timeout-asetuksen muuttamiseksi
    window.location.reload()
  }

  const simulateInactivity = () => {
    // Aseta viimeinen aktiviteetti 2 minuuttia sitten
    const twoMinutesAgo = Date.now() - (2 * 60 * 1000)
    localStorage.setItem('rascal_last_activity', twoMinutesAgo.toString())
    alert('Inaktiivisuus simuloitu! Varoitusdialogin pitäisi näkyä pian.')
  }

  const resetActivity = () => {
    localStorage.setItem('rascal_last_activity', Date.now().toString())
    alert('Aktiviteetti nollattu!')
  }

  const toggleActivity = () => {
    setActivityState(!isActive)
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 1000,
      fontFamily: 'monospace',
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Auto-Logout Test</h4>
      {/* ...sisältö sama kuin alkuperäisessä komponentissa... */}
      <p>Tämä komponentti on siirretty dev-kansioon, jotta se ei ole mukana tuotantokoodissa.</p>
    </div>
  )
}

export default TestAutoLogout
