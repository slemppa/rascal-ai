import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import { useTranslation } from 'react-i18next'

const StrategyConfirmationModal = ({ isOpen, onClose, onRequestUpdate, loading }) => {
  const { t } = useTranslation('common')

  console.log('StrategyConfirmationModal render:', { isOpen, loading })

  if (!isOpen) {
    console.log('StrategyConfirmationModal: isOpen is false, returning null')
    return null
  }

  console.log('StrategyConfirmationModal: Rendering modal!')

  return createPortal(
    <div 
      className="strategy-confirmation-overlay"
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
        className="strategy-confirmation-modal"
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
          onClick={onClose}
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
        <div style={{ paddingRight: '32px', textAlign: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '16px' 
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#f59e0b',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>⚠️</span>
            </div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: 'bold',
              color: '#111827'
            }}>
              Uusi strategia saatavilla!
            </h2>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ 
              margin: '0 0 12px 0', 
              fontSize: '16px', 
              color: '#374151',
              lineHeight: '1.5'
            }}>
              Ennen kuin voimme aloittaa sisällön generoinnin, meidän täytyy varmistaa että strategia on ajan tasalla ja sopii nykyiseen tilanteeseen.
            </p>
            
            <div style={{ 
              backgroundColor: '#fef3c7', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid #fbbf24',
              textAlign: 'left'
            }}>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#92400e',
                textAlign: 'center'
              }}>
                Miksi tämä on tärkeää?
              </h3>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '20px', 
                color: '#92400e',
                lineHeight: '1.6'
              }}>
                <li>Varmistamme että strategia vastaa nykyistä markkinatilannetta</li>
                <li>Varmistamme että tavoitteet ovat edelleen relevantteja</li>
                <li>Varmistamme että resurssit riittävät toteuttamiseen</li>
                <li>Varmistamme että ympäristö ei ole muuttunut merkittävästi</li>
              </ul>
            </div>

            <p style={{ 
              margin: 0,
              display: 'flex',
              justifyContent: 'center',
              fontSize: '14px', 
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              Tämä varmistaa että generoimamme strategia on mahdollisimman tehokas ja sopiva tilanteeseen.
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: '12px'
          }}>
            <Button
              variant="primary"
              onClick={onRequestUpdate}
              disabled={loading}
            >
              {loading ? 'Käsitellään...' : 'Tarkista strategia'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default StrategyConfirmationModal
