import { useState, useEffect } from 'react'
import './UpdateNotification.css'

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [registration, setRegistration] = useState(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        setRegistration(reg)
        
        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowUpdate(true)
            }
          })
        })
      })
    }
  }, [])

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  if (!showUpdate) return null

  return (
    <div className="update-notification">
      <div className="update-content">
        <span className="update-icon">🔄</span>
        <span className="update-text">Uusi versio on saatavilla!</span>
        <button onClick={handleUpdate} className="update-btn">
          Päivitä
        </button>
        <button onClick={() => setShowUpdate(false)} className="close-btn">
          ×
        </button>
      </div>
    </div>
  )
}
