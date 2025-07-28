import React, { useState, useEffect } from 'react'
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
  { label: 'Admin', path: '/admin', feature: null, adminOnly: true },
]
const bottomItems = [
  { label: 'Asetukset', path: '/settings' },
  { label: 'Help Center', path: '/help' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const { user, signOut } = useAuth()
  const features = user?.features || []

  // Tarkista admin-oikeudet
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return
      
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, company_id')
          .eq('auth_user_id', user.id)
          .single()

        if (!error && userData) {
          setIsAdmin(userData.role === 'admin' || userData.company_id === 1)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
      }
    }

    checkAdminStatus()
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('signOut error:', error)
    }
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
          const adminOnly = item.adminOnly && !isAdmin
          
          // Piilota admin-välilehti jos ei ole admin-oikeuksia
          if (adminOnly) return null
          
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
      {/* Desktop sidebar - näytetään vain desktopilla */}
      <div className={styles.sidebar}>
        {menu}
      </div>
    </>
  )
} 