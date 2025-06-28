import React, { useState } from 'react'
import axios from 'axios'
import { Trans, t } from '@lingui/macro'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await axios.post('/api/login', { email, password })
      const data = Array.isArray(res.data) ? res.data[0] : res.data
      if (data && data.token && data.user) {
        onLogin(data.token, data.user)
      } else {
        setError(data.message || 'Kirjautuminen epäonnistui')
      }
    } catch {
      setError('Virhe palvelinyhteydessä')
    } finally {
      setLoading(false)
    }
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
        <h1 style={{
          margin: '0 0 12px 0',
          fontSize: 26,
          fontWeight: 800,
          color: '#2563eb',
          textAlign: 'center',
          letterSpacing: -0.5
        }}><Trans>Kirjaudu sisään</Trans></h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <input type="email" placeholder={t`Sähköposti`} value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1.5px solid #e0e7ef', fontSize: 16, background: '#f9fafb', fontWeight: 600 }} />
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t`Salasana`}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: showPassword ? '12px 40px 12px 16px' : '12px 16px', borderRadius: 8, border: '1.5px solid #e0e7ef', fontSize: 16, background: '#f9fafb', fontWeight: 600 }}
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
          <button type="submit" disabled={loading} style={{ background: loading ? '#9ca3af' : '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '16px 0', fontSize: 18, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', marginTop: 8, boxShadow: '0 2px 8px rgba(37,99,235,0.10)' }}>
            {loading ? <Trans>Kirjaudutaan...</Trans> : <Trans>Kirjaudu</Trans>}
          </button>
          {error && <div style={{ background: '#fef2f2', border: '1.5px solid #dc2626', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 15, fontWeight: 600 }}>{error}</div>}
        </form>
      </div>
    </div>
  )
} 