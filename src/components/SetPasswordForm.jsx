import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import PasswordStrengthChecker from './PasswordStrengthChecker'

export default function SetPasswordForm() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Hae käyttäjän email localStorageesta
    const email = localStorage.getItem('user-email')
    if (!email) {
      // Jos emailia ei löydy, ohjaa etusivulle
      navigate('/')
      return
    }
    setUserEmail(email)
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validoi salasanat
    if (password.length < 8) {
      setError('Salasanan tulee olla vähintään 8 merkkiä pitkä')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Salasanat eivät täsmää')
      setLoading(false)
      return
    }

    try {
      // Lähetä salasanan asetus N8N:ään
      const response = await axios.post('/api/set-password', {
        email: userEmail,
        password: password
      })

      if (response.data.success) {
        setSuccess(true)
        // Poista magic link -token localStorageesta
        localStorage.removeItem('auth-token')
        
        // Pieni viive ennen uloskirjautumista
        setTimeout(() => {
          // Tyhjennä kaikki kirjautumistiedot
          localStorage.removeItem('user-email')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          
          // Ohjaa kirjautumissivulle
          navigate('/login')
        }, 2000)
      } else {
        setError(response.data.message || 'Salasanan asetus epäonnistui')
      }
    } catch (err) {
      setError('Virhe palvelinyhteydessä')
      console.error('Set password error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
          }}>Salasana asetettu!</h2>
          <p style={{
            margin: '0 0 24px 0',
            fontSize: 17,
            color: '#16a34a',
            lineHeight: 1.5
          }}>Sinut kirjataan ulos ja ohjataan kirjautumissivulle</p>
          <div style={{
            width: 48,
            height: 48,
            border: '4px solid #e0e7ef',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}></div>
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
        maxWidth: 400,
        width: '90%'
      }}>
        <img src="/favicon.png" alt="Rascal AI" style={{ width: 48, height: 48, borderRadius: 12, background: '#f8fafc', boxShadow: '0 2px 8px rgba(37,99,235,0.10)', margin: '0 auto 24px', display: 'block' }} />
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: 26,
          fontWeight: 800,
          color: '#2563eb',
          textAlign: 'center',
          letterSpacing: -0.5
        }}>Aseta salasanasi</h2>
        
        <p style={{
          margin: '0 0 32px 0',
          fontSize: 17,
          color: '#2563eb',
          lineHeight: 1.5,
          textAlign: 'center'
        }}>
          Kirjauduit sisään magic link -avulla. Aseta nyt salasanasi jatkaaksesi.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{
              display: 'block',
              fontWeight: 700,
              marginBottom: 8,
              color: '#1e293b',
              fontSize: 15
            }}>
              Sähköposti
            </label>
            <input
              type="email"
              value={userEmail}
              disabled
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1.5px solid #e0e7ef',
                fontSize: 16,
                background: '#f9fafb',
                color: '#6b7280',
                boxSizing: 'border-box',
                fontWeight: 600
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontWeight: 700,
              marginBottom: 8,
              color: '#1e293b',
              fontSize: 15
            }}>
              Uusi salasana
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Vähintään 8 merkkiä"
                required
                style={{
                  width: '100%',
                  padding: showPassword ? '12px 40px 12px 16px' : '12px 16px',
                  borderRadius: 8,
                  border: '1.5px solid #2563eb',
                  fontSize: 16,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  fontWeight: 600
                }}
                onFocus={(e) => e.target.style.borderColor = '#1e293b'}
                onBlur={(e) => e.target.style.borderColor = '#2563eb'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
                tabIndex={-1}
                aria-label={showPassword ? 'Piilota salasana' : 'Näytä salasana'}
              >
                {showPassword ? (
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#2563eb" strokeWidth="2" d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="3" stroke="#2563eb" strokeWidth="2"/></svg>
                ) : (
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#2563eb" strokeWidth="2" d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="3" stroke="#2563eb" strokeWidth="2"/><line x1="4" y1="20" x2="20" y2="4" stroke="#2563eb" strokeWidth="2"/></svg>
                )}
              </button>
            </div>
            <PasswordStrengthChecker password={password} />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontWeight: 700,
              marginBottom: 8,
              color: '#1e293b',
              fontSize: 15
            }}>
              Vahvista salasana
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Kirjoita salasana uudelleen"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1.5px solid #2563eb',
                fontSize: 16,
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                fontWeight: 600
              }}
              onFocus={(e) => e.target.style.borderColor = '#1e293b'}
              onBlur={(e) => e.target.style.borderColor = '#2563eb'}
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1.5px solid #dc2626',
              borderRadius: 8,
              padding: '12px 16px',
              color: '#dc2626',
              fontSize: 15,
              fontWeight: 600
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '16px 0',
              fontSize: 18,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginTop: 8,
              boxShadow: '0 2px 8px rgba(37,99,235,0.10)'
            }}
            onMouseOver={e => {
              if (!loading) e.target.style.background = '#1e293b'
            }}
            onMouseOut={e => {
              if (!loading) e.target.style.background = '#2563eb'
            }}
          >
            {loading ? 'Asetetaan...' : 'Aseta salasana'}
          </button>
        </form>
      </div>
    </div>
  )
} 