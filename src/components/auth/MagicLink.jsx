import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'

export default function MagicLink({ onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        }
      })
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Tarkista sähköpostisi taikalinkkiä varten!')
      }
    } catch (error) {
      setMessage('Odottamaton virhe tapahtui')
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
      <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 18, textAlign: 'center', color: '#fff' }}>Taikalinkki</h2>
      <p style={{ color: '#cbd5e1', textAlign: 'center', marginBottom: 18, fontSize: 15 }}>
        Syötä sähköpostiosoitteesi, niin lähetämme sinulle taikalinkin kirjautumista varten.
      </p>
      <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
            autoComplete="email"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 0',
            border: 'none',
            borderRadius: 8,
            background: loading ? '#a78bfa99' : '#a78bfa',
            color: '#181B20',
            fontWeight: 700,
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            marginTop: 4
          }}
        >
          {loading ? 'Lähetetään taikalinkkiä...' : 'Lähetä taikalinkki'}
        </button>
        {message && (
          <div style={{
            padding: 10,
            background: message.toLowerCase().includes('virhe') || message.toLowerCase().includes('error') ? '#3b1d1d' : '#1e3a1e',
            border: message.toLowerCase().includes('virhe') || message.toLowerCase().includes('error') ? '1px solid #dc2626' : '1px solid #22c55e',
            borderRadius: 8,
            color: message.toLowerCase().includes('virhe') || message.toLowerCase().includes('error') ? '#f87171' : '#22c55e',
            fontSize: 14,
            marginTop: 2
          }}>
            {message}
          </div>
        )}
      </form>
      <div style={{ marginTop: 18, textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: '#cbd5e1' }}>
          Haluatko käyttää salasanaa?{' '}
          <a href="#" style={{ color: '#4ADE80', textDecoration: 'underline' }} onClick={onClose}>
            Kirjaudu salasanalla
          </a>
        </p>
      </div>
    </div>
  )
}