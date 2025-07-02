import React, { useState } from 'react'
import supabase from '../../utils/supabase'

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
      const { data, error: supaError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (supaError) {
        setError(supaError.message || 'Kirjautuminen epäonnistui')
      } else if (data && data.session && data.user) {
        // Haetaan käyttäjäprofiili users-taulusta
        const { data: userProfile, error: userProfileError } = await supabase
          .from('users')
          .select('id, company_name, assistant_id')
          .eq('auth_user_id', data.user.id)
          .single()
        let userObj = {
          email: data.user.email,
          id: data.user.id
        }
        if (userProfile && !userProfileError) {
          userObj.companyId = userProfile.id
          userObj.companyName = userProfile.company_name
          userObj.assistantId = userProfile.assistant_id
        }
        onLogin(data.session, userObj)
      } else {
        setError('Kirjautuminen epäonnistui')
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
        }}>Kirjaudu sisään</h1>
        <p style={{
          margin: '0 0 32px 0',
          fontSize: 16,
          color: '#64748b',
          textAlign: 'center',
          lineHeight: 1.5
        }}>Kirjaudu sisään Rascal AI Dashboardiin</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 600,
              color: '#374151'
            }}>Sähköposti</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 16,
                border: '1.5px solid #d1d5db',
                borderRadius: 12,
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              placeholder="sinun@email.com"
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 600,
              color: '#374151'
            }}>Salasana</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  paddingRight: '50px',
                  fontSize: 16,
                  border: '1.5px solid #d1d5db',
                  borderRadius: 12,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: '#666'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: 16,
              fontWeight: 700,
              color: '#fff',
              background: '#2563eb',
              border: 'none',
              borderRadius: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Kirjaudutaan...' : 'Kirjaudu'}
      </button>
          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#dc2626',
              fontSize: 14,
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
    </form>
      </div>
    </div>
  )
} 