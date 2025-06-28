import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function MagicLinkHandler() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleMagicLink = () => {
      console.log('MagicLinkHandler: Aloitetaan käsittely')
      console.log('URL search params:', searchParams.toString())
      
      try {
        // 1. Lue magic-token URL-parametrista
        const magicToken = searchParams.get('magic-token')
        console.log('Magic token:', magicToken)
        
        if (!magicToken) {
          console.log('Magic token puuttuu')
          setStatus('error')
          setErrorMessage('Magic link -token puuttuu')
          return
        }

        // 2. Dekoodaa base64-muodosta
        let decodedToken
        try {
          decodedToken = atob(magicToken)
          console.log('Dekoodattu token:', decodedToken)
        } catch (error) {
          console.log('Base64 dekoodaus epäonnistui:', error)
          setStatus('error')
          setErrorMessage('Virheellinen token-muoto')
          return
        }

        // 3. Jaa email ja timestamp
        let email, timestamp, companyId, assistantId
        
        try {
          // Kokeile ensin JSON-muotoa
          const tokenData = JSON.parse(decodedToken)
          email = tokenData.email
          timestamp = tokenData.exp
          companyId = tokenData.companyId
          assistantId = tokenData.assistantId
          console.log('JSON token käsitelty:', { email, timestamp, companyId, assistantId })
        } catch (jsonError) {
          // Jos JSON ei onnistu, kokeile vanhaa muotoa (email|timestamp)
          const parts = decodedToken.split('|')
          console.log('Token osat:', parts)
          
          if (parts.length !== 2) {
            console.log('Virheellinen token-rakenne, osia:', parts.length)
            setStatus('error')
            setErrorMessage('Virheellinen token-rakenne')
            return
          }
          
          email = parts[0]
          timestamp = parseInt(parts[1], 10)
          console.log('Vanha muoto käsitelty:', { email, timestamp })
        }

        // Tarkista että email on olemassa
        if (!email) {
          console.log('Email puuttuu tokenista')
          setStatus('error')
          setErrorMessage('Email puuttuu tokenista')
          return
        }

        // Tarkista että timestamp on numero
        if (isNaN(timestamp)) {
          console.log('Virheellinen aikaleima:', timestamp)
          setStatus('error')
          setErrorMessage('Virheellinen aikaleima')
          return
        }

        // 4. Tarkista että timestamp ei ole yli 1 tuntia vanha
        const now = Date.now()
        const oneHourInMs = 60 * 60 * 1000 // 1 tunti millisekunteina
        const timeDiff = now - timestamp
        console.log('Aikaero:', timeDiff, 'ms, vanhentunut:', timeDiff > oneHourInMs)
        
        if (timeDiff > oneHourInMs) {
          setStatus('error')
          setErrorMessage('Magic link on vanhentunut (yli 1 tunti vanha)')
          return
        }

        // 5. Jos validi, tallenna tiedot localStorageen
        console.log('Token validi, tallennetaan localStorageen')
        localStorage.setItem('auth-token', magicToken)
        localStorage.setItem('user-email', email)
        
        // Tallennetaan myös companyId ja assistantId jos ne ovat saatavilla
        if (companyId) {
          localStorage.setItem('company-id', companyId)
        }
        if (assistantId) {
          localStorage.setItem('assistant-id', assistantId)
        }
        
        // Aseta status success ja ohjaa salasanan asettamissivulle
        setStatus('success')
        
        // Pieni viive ennen ohjaamista, jotta käyttäjä näkee onnistumisviestin
        setTimeout(() => {
          console.log('Ohjataan salasanan asettamissivulle')
          navigate('/set-password')
        }, 1500)

      } catch (error) {
        console.error('Odottamaton virhe:', error)
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
          }}>Sinut ohjataan salasanan asettamissivulle...</p>
        </div>
      </div>
    )
  }

  return null
} 