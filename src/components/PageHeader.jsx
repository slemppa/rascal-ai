import React from 'react'

export default function PageHeader({ title, background = 'var(--brand-dark)', color = '#fff', children }) {
  return (
    <div style={{
      position: 'fixed',
      left: 250,
      top: 0,
      right: 0,
      height: 72,
      background,
      color,
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 32,
      zIndex: 10
    }}>
      <h1 style={{margin: 0, fontSize: 32, fontWeight: 800, color, letterSpacing: -0.5, lineHeight: 1.2}}>{title}</h1>
      {children}
    </div>
  )
} 