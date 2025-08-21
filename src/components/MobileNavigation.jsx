import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './MobileNavigation.css'

const menuItems = [
  { label: 'Etusivu', path: '/dashboard', feature: null },
  { label: 'Some', path: '/posts', feature: 'Social Media' },
  { label: 'Blog & Newsletter', path: '/blog-newsletter', feature: 'Social Media' },
  { label: 'Sisältöstrategia', path: '/strategy', feature: 'Social Media' },
  { label: 'Puhelut', path: '/calls', feature: 'Phone Calls' },
  { label: 'Assistentti', path: '/ai-chat', feature: 'Marketing assistant' },
  { label: 'Dev', path: '/dev', feature: null, adminOnly: true },
  { label: 'Admin', path: '/admin', feature: null, adminOnly: true },
]

const bottomItems = [
  { label: 'Asetukset', path: '/settings' },
  { label: 'Help Center', path: '/help' },
]

export default function MobileNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
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
      setIsOpen(false)
    } catch (error) {
      console.error('signOut error:', error)
    }
  }

  const handleNavigation = (path) => {
    navigate(path)
    setIsOpen(false)
  }

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  // Estä vieritys kun valikko on auki
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Hamburger-nappi */}
      <button 
        className={`mobile-hamburger ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Avaa valikko"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobiili-valikko overlay */}
      {isOpen && (
        <div className="mobile-nav-overlay" onClick={() => setIsOpen(false)}>
          <div className="mobile-nav-menu" onClick={(e) => e.stopPropagation()}>
            {/* Sulje-nappi */}
            <button 
              className="mobile-nav-close"
              onClick={() => setIsOpen(false)}
              aria-label="Sulje valikko"
            >
              ×
            </button>

            {/* Profiili-osio */}
            <div className="mobile-profile-section">
              <img 
                src={user?.avatar || '/favicon.png'} 
                alt={user?.name || ''} 
                className="mobile-profile-avatar" 
              />
              <span className="mobile-profile-name">{user?.name || ''}</span>
            </div>

            {/* Navigaatiovalikko */}
            <nav className="mobile-nav-list">
              {menuItems.map(item => {
                const disabled = item.feature && !features.includes(item.feature)
                const adminOnly = item.adminOnly && !isAdmin
                
                if (adminOnly) return null
                
                return (
                  <button
                    key={item.path}
                    className={`mobile-nav-item ${
                      location.pathname.startsWith(item.path) ? 'active' : ''
                    } ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && handleNavigation(item.path)}
                    disabled={disabled}
                  >
                    {item.label}
                  </button>
                )
              })}
            </nav>

            {/* Asetukset ja uloskirjautuminen */}
            <div className="mobile-bottom-section">
              {bottomItems.map(item => (
                <button
                  key={item.path}
                  className="mobile-nav-item"
                  onClick={() => handleNavigation(item.path)}
                >
                  {item.label}
                </button>
              ))}
              <button 
                className="mobile-logout-btn"
                onClick={handleLogout}
              >
                Kirjaudu ulos
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 