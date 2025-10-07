import React from 'react'
import './OnboardingModal.css'

const OnboardingModal = () => {
  console.log('🟢🟢🟢 OnboardingModal: RENDERÖI NYTJOO!')
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(255, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ color: 'black', fontSize: '32px' }}>ONBOARDING MODAL TOIMII! 🎉</h1>
        <p style={{ color: 'black', fontSize: '18px' }}>Jos näet tämän, komponentti renderöityy.</p>
      </div>
    </div>
  )
}

export default OnboardingModal
