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
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Nykyinen timeout:</strong> {currentTimeout}min
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Konteksti timeout:</strong> {contextTimeout}min
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Aktiivinen:</strong> {isActive ? '✓' : '✗'}
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <strong>Sijainti:</strong> {location.pathname}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          onClick={() => setTestTimeoutValue(1)}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Aseta 1min timeout
        </button>
        
        <button
          onClick={() => setTestTimeoutValue(20)}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Palauta 20min timeout
        </button>
        
        <button
          onClick={simulateInactivity}
          style={{
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Simuloi inaktiivisuus
        </button>
        
        <button
          onClick={resetActivity}
          style={{
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Nollaa aktiviteetti
        </button>
        
        <button
          onClick={toggleActivity}
          style={{
            background: isActive ? '#ef4444' : '#10b981',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          {isActive ? 'Pysäytä' : 'Käynnistä'} aktiviteetti
        </button>
        
        <button
          onClick={() => handleLogout('Test logout')}
          style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Testaa logout
        </button>
      </div>
      
      <div style={{ 
        marginTop: '12px', 
        padding: '8px', 
        background: 'rgba(255, 255, 255, 0.1)', 
        borderRadius: '4px',
        fontSize: '10px'
      }}>
        <strong>Ohjeet:</strong><br/>
        1. Aseta 1min timeout<br/>
        2. Simuloi inaktiivisuus<br/>
        3. Varoitusdialogin pitäisi näkyä<br/>
        4. Testaa "Jatka sessiota"<br/>
        5. Testaa "Kirjaudu ulos nyt"
      </div>
    </div>
  )
}

export default TestAutoLogout 