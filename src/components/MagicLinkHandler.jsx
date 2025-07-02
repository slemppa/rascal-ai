import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import supabase from '../../utils/supabase'

export default function MagicLinkHandler() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleMagicLink = async () => {
      try {
        // Supabasen virallinen OTP-exchange
        const { data, error } = await supabase.auth.exchangeCodeForSession()

        if (error) {
          console.error('Supabase exchange error:', error)
          setStatus('error')
          setErrorMessage(error.message)
          return
        }

        if (!data || !data.session || !data.user) {
          setStatus('error')
          setErrorMessage('Session-tietoja ei saatu magic linkistä')
          return
        }

        // Tallennetaan käyttäjän tiedot localStorageen
        localStorage.setItem('token', data.session.access_token)
        localStorage.setItem('user', JSON.stringify({
          email: data.user.email,
          id: data.user.id
        }))

        // Ilmoita sovellukselle, että login onnistui
        window.dispatchEvent(new CustomEvent('supabase-login'))

        setStatus('success')

        // App.jsx huolehtii ohjauksesta onAuthStateChange-kuuntelijalla
      } catch (err) {
        console.error('Exchange-käsittelyssä virhe:', err)
        setStatus('error')
        setErrorMessage('Odottamaton virhe magic link -käsittelyssä')
      }
    }

    handleMagicLink()
  }, [searchParams, navigate])

  // Loading-tila
  if (status === 'loading') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 48,
          boxShadow: '0 4px 32px rgba(37,99,235,0.10)',
          border: '1.5px solid #2563eb',
          textAlign: 'center',
          maxWidth: 400,
          width: '90%'
        }}>
          <img src="/favicon.png" alt="Rascal AI" style={{ width: 48, height: 48, borderRadius: 12, background: '#f8fafc', boxShadow: '0 2px 8px rgba(37,99,235,0.10)', margin: '0 auto 24px', display: 'block' }} />
          <h2 style={{
            margin: '0 0 12px 0',
            fontSize: 26,
            fontWeight: 800,
            color: '#2563eb',
            letterSpacing: -0.5
          }}>Käsitellään kirjautumista...</h2>
          <p style={{
            margin: 0,
            fontSize: 17,
            color: '#2563eb',
            lineHeight: 1.5
          }}>Odota hetki, kunnes magic link tarkistetaan</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Virhetila
  if (status === 'error') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 48,
          boxShadow: '0 4px 32px rgba(220,38,38,0.10)',
          border: '1.5px solid #2563eb',
          textAlign: 'center',
          maxWidth: 400,
          width: '90%'
        }}>
          <img src="/favicon.png" alt="Rascal AI" style={{ width: 48, height: 48, borderRadius: 12, background: '#f8fafc', boxShadow: '0 2px 8px rgba(37,99,235,0.10)', margin: '0 auto 24px', display: 'block' }} />
          <h2 style={{
            margin: '0 0 12px 0',
            fontSize: 26,
            fontWeight: 800,
            color: '#2563eb',
            letterSpacing: -0.5
          }}>Kirjautuminen epäonnistui</h2>
          <p style={{
            margin: '0 0 24px 0',
            fontSize: 17,
            color: '#dc2626',
            lineHeight: 1.5
          }}>{errorMessage}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '14px 32px',
              fontSize: 17,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              marginTop: 8,
              boxShadow: '0 2px 8px rgba(37,99,235,0.10)'
            }}
            onMouseOver={e => e.target.style.background = '#1e293b'}
            onMouseOut={e => e.target.style.background = '#2563eb'}
          >
            Siirry etusivulle
          </button>
        </div>
      </div>
    )
  }

  // Onnistumistila
  if (status === 'success') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 48,
          boxShadow: '0 4px 32px rgba(22,163,74,0.10)',
          border: '1.5px solid #2563eb',
          textAlign: 'center',
          maxWidth: 400,
          width: '90%'
        }}>
          <img src="/favicon.png" alt="Rascal AI" style={{ width: 48, height: 48, borderRadius: 12, background: '#f8fafc', boxShadow: '0 2px 8px rgba(37,99,235,0.10)', margin: '0 auto 24px', display: 'block' }} />
          <h2 style={{
            margin: '0 0 12px 0',
            fontSize: 26,
            fontWeight: 800,
            color: '#2563eb',
            letterSpacing: -0.5
          }}>Kirjautuminen onnistui!</h2>
          <p style={{
            margin: 0,
            fontSize: 17,
            color: '#16a34a',
            lineHeight: 1.5
          }}>Sinut ohjataan dashboard-sivulle...</p>
        </div>
      </div>
    )
  }

  return null
} 