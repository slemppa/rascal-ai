import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './Sidebar.module.css'
import { useAuth } from '../contexts/AuthContext'

const menuItems = [
  { label: 'Etusivu', path: '/dashboard', feature: null },
  { label: 'Julkaisut', path: '/posts', feature: 'Social Media' },
  { label: 'Sisältöstrategia', path: '/strategy', feature: 'Social Media' },
  { label: 'Puhelut', path: '/calls', feature: 'Phone Calls' },
  { label: 'Assistentti', path: '/ai-chat', feature: 'Marketing assistant' },
]
const bottomItems = [
  { label: 'Asetukset', path: '/settings' },
  { label: 'Help Center', path: '/help' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
  const { user } = useAuth()
  const features = user?.features || []

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/signin')
  }

  const menu = (
    <>
      <div className={styles['profile-section']}>
        <img src={user?.avatar || '/favicon.png'} alt={user?.name || ''} className={styles['profile-avatar']} />
        <span className={styles['profile-name']}>{user?.name || ''}</span>
      </div>
      <ul className={styles['nav-menu']}>
        {menuItems.map(item => {
          const disabled = item.feature && !features.includes(item.feature)
          return (
            <li className={styles['nav-item']} key={item.path}>
              <button
                className={
                  `${styles['nav-link']} ${location.pathname.startsWith(item.path) ? styles['active'] : ''}`
                }
                disabled={disabled}
                style={{
                  opacity: disabled ? 0.5 : 1,
                  pointerEvents: disabled ? 'none' : 'auto',
                  background: location.pathname.startsWith(item.path) ? '#22c55e' : 'transparent',
                  color: location.pathname.startsWith(item.path) ? '#fff' : '#cbd5e1',
                  fontWeight: location.pathname.startsWith(item.path) ? 700 : 500,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
                onClick={e => {
                  e.preventDefault()
                  setMobileMenuOpen(false)
                  if (!disabled) navigate(item.path)
                }}
              >
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
      <div className={styles['settings-section']}>
        {bottomItems.map(item => (
          <a
            key={item.path}
            className={styles['nav-link']}
            href={item.path}
            onClick={e => {
              e.preventDefault()
              setMobileMenuOpen(false)
              navigate(item.path)
            }}
          >
            {item.label}
          </a>
        ))}
        <button onClick={handleLogout} className={styles['logout-btn']}>
          Kirjaudu ulos
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      {!isMobile && (
        <div className={styles.sidebar}>
          {menu}
        </div>
      )}
      {/* Hamburger for mobile */}
      {isMobile && (
        <button className={styles['mobile-menu-btn']} onClick={() => setMobileMenuOpen(true)}>
          <span style={{ fontSize: 28 }}>☰</span>
        </button>
      )}
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className={styles['mobile-menu-overlay']}>
          <div className={styles['mobile-menu']}>
            <button className={styles['mobile-menu-close']} onClick={() => setMobileMenuOpen(false)}>×</button>
            {menu}
          </div>
        </div>
      )}
    </>
  )
} 