import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PageHeader({ title, background = 'var(--brand-dark)', color = '#fff', children }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const left = isMobile ? 0 : 250;
  const paddingLeft = isMobile ? 16 : 32;
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Dummy user
  const user = {
    name: 'Floyd Miles',
    avatar: '/favicon.png',
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/signin')
  }

  return (
    <div style={{
      position: 'fixed',
      left,
      top: 0,
      right: 0,
      height: 72,
      background,
      color,
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      paddingLeft,
      zIndex: 10,
      justifyContent: 'space-between',
      paddingRight: 32
    }}>
      <h1 style={{margin: 0, fontSize: 32, fontWeight: 800, color, letterSpacing: -0.5, lineHeight: 1.2}}>{title}</h1>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', borderRadius: 24, padding: '4px 12px', background: dropdownOpen ? '#23262B' : 'transparent' }} onClick={() => setDropdownOpen(v => !v)}>
          <img src={user.avatar} alt={user.name} style={{ width: 36, height: 36, borderRadius: '50%', marginRight: 10 }} />
          <span style={{ fontWeight: 600, fontSize: 16, color: '#fff' }}>{user.name}</span>
          <span style={{ fontSize: 18, color: '#fff', marginLeft: 6 }}>▼</span>
        </div>
        {dropdownOpen && (
          <div style={{ position: 'absolute', right: 0, top: 48, background: '#23262B', color: '#fff', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 180, padding: 8, zIndex: 100 }}>
            <div style={{ padding: '10px 16px', cursor: 'pointer', borderRadius: 8, fontWeight: 500 }} onClick={() => { setDropdownOpen(false); navigate('/settings') }}>⚙️ Asetukset</div>
            <div style={{ padding: '10px 16px', cursor: 'pointer', borderRadius: 8, fontWeight: 500 }} onClick={handleLogout}>🚪 Kirjaudu ulos</div>
          </div>
        )}
      </div>
      {children}
    </div>
  )
} 