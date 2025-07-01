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
      <div style={{padding: 32}}>
        <div style={{background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 32, marginBottom: 24}}>
          <h2 style={{margin: '0 0 24px 0', fontSize: 20, fontWeight: 700, color: '#1f2937'}}>Käyttäjätiedot</h2>
          <div style={{display: 'grid', gap: 20}}>
            <div>
              <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14}}>Nimi</label>
              <input type="text" value={name || ''} readOnly style={{
                width: '100%', 
                padding: '12px 16px', 
                border: '1px solid #d1d5db', 
                borderRadius: 8, 
                fontSize: 14,
                background: '#f9fafb',
                color: '#6b7280'
              }} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14}}>Sähköposti</label>
              <input type="email" value={email || ''} readOnly style={{
                width: '100%', 
                padding: '12px 16px', 
                border: '1px solid #d1d5db', 
                borderRadius: 8, 
                fontSize: 14,
                background: '#f9fafb',
                color: '#6b7280'
              }} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14}}>Yritys</label>
              <input type="text" value={companyName || ''} readOnly style={{
                width: '100%', 
                padding: '12px 16px', 
                border: '1px solid #d1d5db', 
                borderRadius: 8, 
                fontSize: 14,
                background: '#f9fafb',
                color: '#6b7280'
              }} />
            </div>
          </div>
        </div>
        
        <div style={{background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 32, marginBottom: 24}}>
          <h2 style={{margin: '0 0 24px 0', fontSize: 20, fontWeight: 700, color: '#1f2937'}}>Tekniset tiedot</h2>
          <div style={{display: 'grid', gap: 20}}>
            <div>
              <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14}}>Company ID</label>
              <input type="text" value={companyId || ''} readOnly style={{
                width: '100%', 
                padding: '12px 16px', 
                border: '1px solid #d1d5db', 
                borderRadius: 8, 
                fontSize: 14,
                background: '#f9fafb',
                color: '#6b7280',
                fontFamily: 'monospace'
              }} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14}}>Assistant ID</label>
              <input type="text" value={assistantId || ''} readOnly style={{
                width: '100%', 
                padding: '12px 16px', 
                border: '1px solid #d1d5db', 
                borderRadius: 8, 
                fontSize: 14,
                background: '#f9fafb',
                color: '#6b7280',
                fontFamily: 'monospace'
              }} />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14}}>Token vanhenee</label>
              <input type="text" value={exp ? new Date(exp * 1000).toLocaleString('fi-FI') : ''} readOnly style={{
                width: '100%', 
                padding: '12px 16px', 
                border: '1px solid #d1d5db', 
                borderRadius: 8, 
                fontSize: 14,
                background: '#f9fafb',
                color: '#6b7280'
              }} />
            </div>
          </div>
        </div>

        <div style={{background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 32}}>
          <h2 style={{margin: '0 0 24px 0', fontSize: 20, fontWeight: 700, color: '#1f2937'}}>Sovelluksen tiedot</h2>
          <VersionInfo style={{marginTop: 0}} />
        </div>
      </div>
    </>
  )
} 