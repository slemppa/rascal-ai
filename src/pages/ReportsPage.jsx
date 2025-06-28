import React from 'react'
import { Trans } from '@lingui/macro'

export default function ReportsPage() {
  return (
    <>
      <div style={{
        background: 'var(--brand-dark)',
        color: '#fff',
        borderBottom: '1px solid #e2e8f0',
        paddingTop: 32,
        paddingBottom: 24
      }}>
        <h1 style={{margin: 0, fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -0.5, lineHeight: 1.2}}><Trans>Raportit</Trans></h1>
      </div>
      <div style={{maxWidth: 900, padding: '0 8px'}}>
        <p><Trans>Tämä on raporttisivu. Lisää raporttien toiminnallisuus myöhemmin.</Trans></p>
      </div>
    </>
  )
} 