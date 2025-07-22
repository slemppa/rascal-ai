import React from 'react'

/**
 * Yhtenäinen nappikomponentti Rascal AI -sovellukseen.
 * Props:
 *  - children: napin sisältö
 *  - onClick: klikattava funktio
 *  - type: button/submit/reset
 *  - disabled: disabloitu vai ei
 *  - variant: 'primary' | 'secondary' | 'danger' (väriteema)
 *  - style: mahdollisuus ylikirjoittaa tyyliä
 */
export default function Button({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  style = {},
  ...rest
}) {
  // Väriteemat
  const variants = {
    primary: {
      background: disabled ? '#9ca3af' : 'var(--brand-color, #2563eb)',
      color: '#fff',
      border: 'none',
    },
    secondary: {
      background: '#fff',
      color: '#2563eb',
      border: '1.5px solid #2563eb',
    },
    danger: {
      background: disabled ? '#fca5a5' : '#dc2626',
      color: '#fff',
      border: 'none',
    }
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '14px 32px',
        borderRadius: 10,
        fontSize: 16,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 2px 8px rgba(37,99,235,0.10)',
        transition: 'background 0.15s, color 0.15s, border 0.15s',
        outline: 'none',
        ...variants[variant],
        ...style
      }}
      {...rest}
    >
      {children}
    </button>
  )
} 