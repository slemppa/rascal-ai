import React from 'react'

export default function PageHeader({ title, background = 'var(--brand-dark)', color = '#fff', children }) {
  // Responsiivinen asettelu
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const left = isMobile ? 0 : 250;
  const paddingLeft = isMobile ? 16 : 32;

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
      zIndex: 10
    }}>
      <h1 style={{margin: 0, fontSize: 32, fontWeight: 800, color, letterSpacing: -0.5, lineHeight: 1.2}}>{title}</h1>
      {children}
    </div>
  )
} 