import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function SignIn({ onSuccess, onClose, onForgotClick, onMagicLinkClick }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pendingSuccess, setPendingSuccess] = useState(false)
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (pendingSuccess && user && !authLoading) {
      navigate('/dashboard')
    }
  }, [pendingSuccess, user, authLoading, navigate])

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError(error.message)
      } else {
        setPendingSuccess(true)
      }
    } catch (error) {
      setError('Kirjautuminen epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#23262B', color: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', padding: 32, position: 'relative', maxWidth: 400, width: '100%' }}>
      {onClose && (
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 28, color: '#cbd5e1', cursor: 'pointer', transition: 'color 0.2s' }}
          aria-label="Sulje"
          onMouseOver={e => e.currentTarget.style.color = '#4ADE80'}
          onMouseOut={e => e.currentTarget.style.color = '#cbd5e1'}
        >
          ×
        </button>
      )}
      <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 24, textAlign: 'center', color: '#fff' }}>Kirjaudu sisään</h2>
      <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#cbd5e1' }}>
            Sähköposti
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #374151',
              borderRadius: 8,
              background: '#181B20',
              color: '#fff',
              fontSize: 15,
              outline: 'none',
              marginBottom: 2
            }}
            placeholder="sähköposti@esimerkki.fi"
          />
        </div>
        <div style={{ position: 'relative' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#cbd5e1' }}>
            Salasana
          </label>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 44px 12px 14px',
              border: '1px solid #374151',
              borderRadius: 8,
              background: '#181B20',
              color: '#fff',
              fontSize: 15,
              outline: 'none',
              marginBottom: 2
            }}
            placeholder="Salasanasi"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Piilota salasana' : 'Näytä salasana'}
            style={{
              position: 'absolute',
              top: 36,
              right: 12,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: '#cbd5e1',
              fontSize: 22,
              display: 'flex',
              alignItems: 'center',
              height: 28,
              width: 28,
              transition: 'color 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.color = '#4ADE80'}
            onMouseOut={e => e.currentTarget.style.color = '#cbd5e1'}
          >
            {showPassword ? (
              // Auki silmä (eye open)
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width={24} height={24}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2} />
              </svg>
            ) : (
              // Suljettu silmä (eye closed)
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width={24} height={24}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.34-2.591A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            )}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 0',
            border: 'none',
            borderRadius: 8,
            background: loading ? '#4ADE80cc' : '#4ADE80',
            color: '#181B20',
            fontWeight: 700,
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            marginTop: 4
          }}
        >
          {loading ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
        </button>
        {error && (
          <div style={{
            padding: 10,
            background: '#3b1d1d',
            border: '1px solid #dc2626',
            borderRadius: 8,
            color: '#f87171',
            fontSize: 14,
            marginTop: 2
          }}>
            {error}
          </div>
        )}
      </form>
      <div style={{ marginTop: 18, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontSize: 15, color: '#cbd5e1' }}>
          {onForgotClick ? (
            <a href="#" style={{ color: '#60a5fa', textDecoration: 'underline' }} onClick={e => { e.preventDefault(); onForgotClick(); }}>
              Unohditko salasanan?
            </a>
          ) : (
            <Link to="/forgot-password" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
              Unohditko salasanan?
            </Link>
          )}
        </p>
        <p style={{ fontSize: 15, color: '#cbd5e1' }}>
          {onMagicLinkClick ? (
            <a href="#" style={{ color: '#a78bfa', textDecoration: 'underline' }} onClick={e => { e.preventDefault(); onMagicLinkClick(); }}>
              Kirjaudu taikalinkillä
            </a>
          ) : (
            <Link to="/magic-link" style={{ color: '#a78bfa', textDecoration: 'underline' }}>
              Kirjaudu taikalinkillä
            </Link>
          )}
        </p>
      </div>
    </div>
  )
}