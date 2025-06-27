import React, { useState } from 'react'
import axios from 'axios'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await axios.post('/api/login', { email, password })
      if (res.data.success) {
        onLogin(res.data.token, res.data.user)
      } else {
        setError(res.data.message || 'Kirjautuminen epäonnistui')
      }
    } catch {
      setError('Virhe palvelinyhteydessä')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{maxWidth: 400, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 32}}>
      <h1>Kirjaudu sisään</h1>
      <input type="email" placeholder="Sähköposti" value={email} onChange={e => setEmail(e.target.value)} required style={{width: '100%', marginBottom: 16}} />
      <input type="password" placeholder="Salasana" value={password} onChange={e => setPassword(e.target.value)} required style={{width: '100%', marginBottom: 16}} />
      <button type="submit" disabled={loading} style={{width: '100%', background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', borderRadius: 6, padding: '12px 0', fontWeight: 600, fontSize: 18, cursor: 'pointer'}}>
        {loading ? 'Kirjaudutaan...' : 'Kirjaudu'}
      </button>
      {error && <div style={{color: 'red', marginTop: 16}}>{error}</div>}
    </form>
  )
} 