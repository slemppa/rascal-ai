import React from 'react'
import { Trans } from '@lingui/macro'

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
      <div style={{
        background: 'var(--brand-dark)',
        color: '#fff',
        borderBottom: '1px solid #e2e8f0',
        paddingTop: 32,
        paddingBottom: 24
      }}>
        <h1 style={{margin: 0, fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -0.5, lineHeight: 1.2}}><Trans>Asetukset</Trans></h1>
      </div>
      <div style={{maxWidth: 800, padding: '0 8px'}}>
        <div style={{maxWidth: 500, margin: '2rem auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #e1e8ed', padding: 32}}>
          {user ? (
            <div style={{fontSize: 17, color: '#222'}}>
              <div style={{marginBottom: 12}}><b><Trans>Nimi:</Trans></b> {name || '-'}</div>
              <div style={{marginBottom: 12}}><b><Trans>Sähköposti:</Trans></b> {email || '-'}</div>
              <div style={{marginBottom: 12}}><b><Trans>Yrityksen nimi:</Trans></b> {companyName || '-'}</div>
              <div style={{marginBottom: 12}}><b><Trans>Yrityksen ID:</Trans></b> {companyId || '-'}</div>
              <div style={{marginBottom: 12}}><b><Trans>Assistant ID:</Trans></b> {assistantId || '-'}</div>
              <div style={{marginBottom: 12}}><b><Trans>Tokenin vanhentumisaika (exp):</Trans></b> {exp || '-'}</div>
            </div>
          ) : (
            <div style={{color: '#888'}}><Trans>Käyttäjätietoja ei löytynyt.</Trans></div>
          )}
        </div>
      </div>
    </>
  )
} 