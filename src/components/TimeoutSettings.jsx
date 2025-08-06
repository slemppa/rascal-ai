import React, { useState, useEffect } from 'react'
import { useAutoLogout } from '../contexts/AutoLogoutContext'
import { 
  TIMEOUT_OPTIONS, 
  saveTimeoutPreference, 
  getTimeoutPreference,
  getContextTimeout 
} from '../utils/inactivityUtils'
import { useLocation } from 'react-router-dom'
import './TimeoutSettings.css'

const TimeoutSettings = () => {
  const [selectedTimeout, setSelectedTimeout] = useState(20)
  const [isCustom, setIsCustom] = useState(false)
  const [customTimeout, setCustomTimeout] = useState(20)
  const [showSaved, setShowSaved] = useState(false)
  
  const location = useLocation()
  const { currentTimeout } = useAutoLogout()

  // Lataa tallennetut asetukset
  useEffect(() => {
    const savedTimeout = getTimeoutPreference()
    const contextTimeout = getContextTimeout(location.pathname)
    
    if (savedTimeout) {
      setSelectedTimeout(savedTimeout)
      setCustomTimeout(savedTimeout)
      setIsCustom(!TIMEOUT_OPTIONS.find(option => option.value === savedTimeout))
    } else {
      setSelectedTimeout(contextTimeout)
      setCustomTimeout(contextTimeout)
    }
  }, [location.pathname])

  // Tallenna asetukset
  const handleSave = () => {
    const timeoutToSave = isCustom ? customTimeout : selectedTimeout
    saveTimeoutPreference(timeoutToSave)
    setShowSaved(true)
    
    setTimeout(() => {
      setShowSaved(false)
    }, 2000)
  }

  // Palauta oletusasetukset
  const handleReset = () => {
    const contextTimeout = getContextTimeout(location.pathname)
    setSelectedTimeout(contextTimeout)
    setCustomTimeout(contextTimeout)
    setIsCustom(false)
    localStorage.removeItem('rascal_auto_logout_timeout')
    setShowSaved(true)
    
    setTimeout(() => {
      setShowSaved(false)
    }, 2000)
  }

  return (
    <div className="timeout-settings">
      <div className="timeout-settings-header">
        <h3 className="timeout-settings-title">Sessio-asetukset</h3>
        <p className="timeout-settings-description">
          Määritä kuinka kauan sessio pysyy aktiivisena inaktiivisuuden jälkeen.
        </p>
      </div>

      <div className="timeout-settings-content">
        <div className="timeout-option-group">
          <label className="timeout-option-label">Valitse timeout:</label>
          
          <div className="timeout-options">
            {TIMEOUT_OPTIONS.map((option) => (
              <label key={option.value} className="timeout-option">
                <input
                  type="radio"
                  name="timeout"
                  value={option.value}
                  checked={!isCustom && selectedTimeout === option.value}
                  onChange={(e) => {
                    setSelectedTimeout(parseInt(e.target.value))
                    setIsCustom(false)
                  }}
                />
                <span className="timeout-option-text">{option.label}</span>
              </label>
            ))}
            
            <label className="timeout-option">
              <input
                type="radio"
                name="timeout"
                checked={isCustom}
                onChange={() => setIsCustom(true)}
              />
              <span className="timeout-option-text">Mukautettu</span>
            </label>
          </div>
        </div>

        {isCustom && (
          <div className="timeout-custom-group">
            <label className="timeout-custom-label">
              Mukautettu timeout (minuutteina):
              <input
                type="number"
                min="5"
                max="120"
                value={customTimeout}
                onChange={(e) => setCustomTimeout(parseInt(e.target.value) || 20)}
                className="timeout-custom-input"
              />
            </label>
            <p className="timeout-custom-note">
              Sallittu arvo: 5-120 minuuttia
            </p>
          </div>
        )}

        <div className="timeout-current-info">
          <div className="timeout-current-label">Nykyinen asetus:</div>
          <div className="timeout-current-value">
            {isCustom ? customTimeout : selectedTimeout} minuuttia
          </div>
          {currentTimeout !== (isCustom ? customTimeout : selectedTimeout) && (
            <div className="timeout-current-note">
              (Sivun oletusarvo: {currentTimeout} minuuttia)
            </div>
          )}
        </div>

        <div className="timeout-settings-actions">
          <button 
            className="timeout-btn timeout-btn-primary"
            onClick={handleSave}
          >
            Tallenna asetukset
          </button>
          
          <button 
            className="timeout-btn timeout-btn-secondary"
            onClick={handleReset}
          >
            Palauta oletukset
          </button>
        </div>

        {showSaved && (
          <div className="timeout-saved-message">
            ✓ Asetukset tallennettu
          </div>
        )}
      </div>

      <div className="timeout-settings-footer">
        <div className="timeout-info-box">
          <h4 className="timeout-info-title">Tietoa sessio-asetuksista</h4>
          <ul className="timeout-info-list">
            <li>Varoitus näkyy 5 minuuttia ennen sessio päättymistä</li>
            <li>Kaikki aktiviteetit (hiiri, näppäimistö, kosketus) nollaa ajastimen</li>
            <li>Asetukset tallentuvat selaimen localStorageen</li>
            <li>Jos et aseta omaa timeoutia, käytetään sivun oletusarvoa</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TimeoutSettings 