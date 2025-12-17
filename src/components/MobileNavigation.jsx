import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../utils/userApi'
import { useAuth } from '../contexts/AuthContext'
import { useFeatures } from '../hooks/useFeatures'
import './MobileNavigation.css'

const menuItems = [
  { label: 'Etusivu', path: '/dashboard', feature: null },
  { label: 'Kampanjat', path: '/campaigns', feature: 'Campaigns' },
  { label: 'Segmentit', path: '/segments', feature: 'Segments' },
  { label: 'Some', path: '/posts', feature: 'Social Media' },
  { label: 'Blog & Newsletter', path: '/blog-newsletter', feature: 'Social Media' },
  { label: 'Sisältöstrategia', path: '/strategy', feature: 'Social Media' },
  { label: 'Puhelut', path: '/calls', feature: 'Phone Calls' },
  { label: 'Assistentti', path: '/ai-chat', feature: 'Marketing assistant' },
  { label: 'Dev', path: '/dev', feature: null, adminOnly: true },
  { label: 'Ylläpito', path: '/admin', feature: null, adminOnly: true },
  { label: 'Admin', path: '/admin-blog', feature: null, moderatorOnly: true },
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
  const [isModerator, setIsModerator] = useState(false)
  const { user, signOut } = useAuth()
  const { has: hasFeature } = useFeatures()

  // Tarkista admin-oikeudet
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return
      
      try {
        // Hae käyttäjätiedot API:n kautta
        const userData = await getCurrentUser()
        const error = null

        if (!error && userData) {
          const admin = userData.role === 'admin'
          const moderator = userData.role === 'moderator' || userData.role === 'admin'
          setIsAdmin(admin)
          setIsModerator(moderator)
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
                // Oikeuksien tarkistus
                if (item.adminOnly && !isAdmin) return null
                if (item.moderatorOnly && !isModerator) return null

                // Feature-gating mobiilissa
                if (item.feature && !hasFeature(item.feature)) return null
                if (item.path === '/dev' && !hasFeature('Dev')) return null

                const active = location.pathname.startsWith(item.path)

                return (
                  <button
                    key={item.path}
                    className={`mobile-nav-item ${active ? 'active' : ''}`}
                    onClick={() => handleNavigation(item.path)}
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