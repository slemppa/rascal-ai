import React from 'react'
import VersionInfo from '../components/VersionInfo'
import PageHeader from '../components/PageHeader'

export default function SettingsPage() {
  let user = null
  let assistantId = null
  let companyId = null
  let companyName = null
  let email = null
  let name = null
  let exp = null
  try {
    // Jos user on objektin sisällä (esim. {token, user}), poimi user
    const raw = JSON.parse(localStorage.getItem('user') || 'null')
    if (raw && raw.user) {
      user = raw.user
    } else {
      user = raw
    }
  } catch (e) {}
  if (user) {
    assistantId = user.assistantId || null
    companyId = user.companyId || null
    companyName = user.companyName || null
    email = user.email || null
    name = user.name || null
    exp = user.exp || null
  }

  return (
    <>
      <PageHeader title="Asetukset" />
      <div style={{
        background: 'var(--brand-dark)',
        color: '#fff',
        borderBottom: '1px solid #e2e8f0',
        paddingTop: 32,
        paddingBottom: 24
      }}>
        <h1 style={{margin: 0, fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -0.5, lineHeight: 1.2}}>Asetukset</h1>
      </div>
      <div style={{padding: 32}}>
        <div style={{background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24}}>
          <h2 style={{margin: '0 0 16px 0', fontSize: 20, fontWeight: 600}}>Käyttäjätiedot</h2>
          <div style={{display: 'grid', gap: 16}}>
            <div>
              <label style={{display: 'block', marginBottom: 4, fontWeight: 500}}>Nimi</label>
              <input type="text" value={name || ''} readOnly style={{width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4}} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: 4, fontWeight: 500}}>Sähköposti</label>
              <input type="email" value={email || ''} readOnly style={{width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4}} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: 4, fontWeight: 500}}>Yritys</label>
              <input type="text" value={companyName || ''} readOnly style={{width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4}} />
            </div>
          </div>
        </div>
        
        <div style={{background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24}}>
          <h2 style={{margin: '0 0 16px 0', fontSize: 20, fontWeight: 600}}>Tekniset tiedot</h2>
          <div style={{display: 'grid', gap: 16}}>
            <div>
              <label style={{display: 'block', marginBottom: 4, fontWeight: 500}}>Company ID</label>
              <input type="text" value={companyId || ''} readOnly style={{width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4}} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: 4, fontWeight: 500}}>Assistant ID</label>
              <input type="text" value={assistantId || ''} readOnly style={{width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4}} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: 4, fontWeight: 500}}>Token vanhenee</label>
              <input type="text" value={exp ? new Date(exp * 1000).toLocaleString('fi-FI') : ''} readOnly style={{width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4}} />
            </div>
          </div>
        </div>

        <div style={{background: '#fff', borderRadius: 12, padding: 24}}>
          <h2 style={{margin: '0 0 16px 0', fontSize: 20, fontWeight: 600}}>Sovelluksen tiedot</h2>
          <VersionInfo style={{marginTop: 16}} />
        </div>
      </div>
    </>
  )
} 