import React from 'react'

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
    <div style={{maxWidth: 500, margin: '2rem auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #e1e8ed', padding: 32}}>
      <h1 style={{marginBottom: 24}}>Asetukset</h1>
      {user ? (
        <div style={{fontSize: 17, color: '#222'}}>
          <div style={{marginBottom: 12}}><b>Nimi:</b> {name || '-'}</div>
          <div style={{marginBottom: 12}}><b>Sähköposti:</b> {email || '-'}</div>
          <div style={{marginBottom: 12}}><b>Yrityksen nimi:</b> {companyName || '-'}</div>
          <div style={{marginBottom: 12}}><b>Yrityksen ID:</b> {companyId || '-'}</div>
          <div style={{marginBottom: 12}}><b>Assistant ID:</b> {assistantId || '-'}</div>
          <div style={{marginBottom: 12}}><b>Tokenin vanhentumisaika (exp):</b> {exp || '-'}</div>
        </div>
      ) : (
        <div style={{color: '#888'}}>Käyttäjätietoja ei löytynyt.</div>
      )}
    </div>
  )
} 