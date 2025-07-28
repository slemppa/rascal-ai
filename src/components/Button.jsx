import React from 'react'
import './Button.css'

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
      className={`button button-${variant}`}
      style={{
        ...variants[variant],
        ...style
      }}
      {...rest}
    >
      {children}
    </button>
  )
} 