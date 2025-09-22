import React from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import { useNotifications } from '../contexts/NotificationContext'

const VersionNotification = () => {
  const { showVersionNotification, markVersionAsSeen } = useNotifications()

  if (!showVersionNotification) return null

  const currentVersion = process.env.REACT_APP_VERSION || '1.67.0'

  return createPortal(
    <div 
      className="version-notification-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div 
        className="version-notification-modal"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative'
        }}
      >
        {/* Sulje-nappi */}
        <button
          onClick={markVersionAsSeen}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '4px'
          }}
        >
          ✕
        </button>

        {/* Sisältö */}
        <div style={{ paddingRight: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '16px' 
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>R</span>
            </div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: 'bold',
              color: '#111827'
            }}>
              Hei! Rascal AI on saanut päivityksen!
            </h2>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ 
              margin: '0 0 12px 0', 
              fontSize: '16px', 
              color: '#374151',
              lineHeight: '1.5'
            }}>
              Tervetuloa takaisin! Olemme tehneet Rascal AI:sta vielä paremman versioon <strong>v{currentVersion}</strong>
            </p>
            
            <div style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#111827'
              }}>
                Tässä mitä paransimme:
              </h3>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '20px', 
                color: '#374151',
                lineHeight: '1.6'
              }}>
                <li>AI‑chat: voit lisätä myös kuvat ja äänet. Tiedoston nimi lähtee aina mukaan.</li>
                <li>Dashboard: Vastausprosentti lasketaan vain vastatuista, onnistuneista puheluista.</li>
                <li>Kampanjat: kortit käyttävät kaikkia puhelulokeja (yli 1000) ja samaa onnistumislogiikkaa.</li>
                <li>Pieniä parannuksia käyttökokemukseen.</li>
              </ul>
            </div>

            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              Kiitos että olet mukana kehittämässä Rascal AI:ta kanssamme!
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <Button
              variant="secondary"
              onClick={markVersionAsSeen}
            >
              Selvä, jatketaan!
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                window.location.reload()
                markVersionAsSeen()
              }}
            >
              Päivitä sivu
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default VersionNotification
