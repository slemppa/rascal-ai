import React from 'react'

export default function PageHeader({ title, background = 'var(--brand-dark)', color = '#fff', children }) {
  return (
    <div style={{
      background,
      color,
      borderBottom: '1px solid #e2e8f0',
      paddingTop: 32,
      paddingBottom: 24
    }}>
      <h1 style={{margin: 0, fontSize: 32, fontWeight: 800, color, letterSpacing: -0.5, lineHeight: 1.2}}>{title}</h1>
      {children}
    </div>
  )
} 