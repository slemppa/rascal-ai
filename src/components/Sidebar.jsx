import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import styles from './Sidebar.module.css'
import { useAuth } from '../contexts/AuthContext'
import { useFeatures } from '../hooks/useFeatures'
import NotificationBell from './NotificationBell'

const menuItems = [
  { 
    label: 'Etusivu', 
    path: '/dashboard', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    label: 'Some', 
    path: '/posts', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 2H7C5.89543 2 5 2.89543 5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V4C19 2.89543 18.1046 2 17 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 18H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 6H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 14H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    label: 'Blogit ja uutiskirjeet', 
    path: '/blog-newsletter', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V2.5C4 1.11929 5.11929 0 6.5 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 13H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 17H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    label: 'Sisältöstrategia', 
    path: '/strategy', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
        <path d="M48,64a8,8,0,0,1,8-8H72V40a8,8,0,0,1,16,0V56h16a8,8,0,0,1,0,16H88V88a8,8,0,0,1-16,0V72H56A8,8,0,0,1,48,64ZM184,192h-8v-8a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0v-8h8a8,8,0,0,0,0-16Zm56-48H224V128a8,8,0,0,0-16,0v16H192a8,8,0,0,0,0,16h16v16a8,8,0,0,0,16,0V160h16a8,8,0,0,0,0-16ZM219.31,80,80,219.31a16,16,0,0,1-22.62,0L36.68,198.63a16,16,0,0,1,0-22.63L176,36.69a16,16,0,0,1,22.63,0l20.68,20.68A16,16,0,0,1,219.31,80Zm-54.63,32L144,91.31l-96,96L68.68,208ZM208,68.69,187.31,48l-32,32L176,100.69Z"></path>
      </svg>
    )
  },
  { 
    label: 'Kampanjat', 
    path: '/campaigns', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3h18v4H3V3zM3 10h18v11H3V10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 14h6M7 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    label: 'Segmentit', 
    path: '/segments', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="2"/>
        <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    label: 'Puhelut', 
    path: '/calls', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
        <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16Zm-52-56H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm-28,16v24H120V152ZM80,164a12,12,0,0,1,12-12h12v24H92A12,12,0,0,1,80,164Zm84,12H152V152h12a12,12,0,0,1,0,24ZM72,108a12,12,0,1,1,12,12A12,12,0,0,1,72,108Zm88,0a12,12,0,1,1,12,12A12,12,0,0,1,160,108Z"></path>
      </svg>
    )
  },
  { 
    label: 'Assistentti', 
    path: '/ai-chat', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
        <path d="M216,40H136V24a8,8,0,0,0-16,0V40H40A16,16,0,0,0,24,56V176a16,16,0,0,0,16,16H79.36L57.75,219a8,8,0,0,0,12.5,10l29.59-37h56.32l29.59,37a8,8,0,1,0,12.5-10l-21.61-27H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,136H40V56H216V176ZM104,120v24a8,8,0,0,1-16,0V120a8,8,0,0,1,16,0Zm32-16v40a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm32-16v56a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0Z"></path>
      </svg>
    )
  },
  { 
    label: 'Kehitys', 
    path: '/dev', 
    moderatorOnly: true,
    feature: 'Dev',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 6L2 12l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    label: 'Ylläpito', 
    path: '/admin', 
    adminOnly: true, 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.257 9.77251 19.9887C9.5799 19.7204 9.31074 19.5206 9 19.41C8.69838 19.2994 8.36381 19.2818 8.03941 19.3594C7.71502 19.437 7.41471 19.6066 7.18 19.85L7.12 19.91C6.936 20.0937 6.71547 20.2401 6.47275 20.3398C6.23004 20.4395 5.97033 20.4903 5.708 20.49C5.44567 20.49 5.18596 20.4395 4.94325 20.3398C4.70053 20.2401 4.47997 20.0937 4.296 19.91C4.11233 19.7263 3.96588 19.5058 3.86619 19.2631C3.7665 19.0204 3.71567 18.7607 3.71567 18.498C3.71567 18.2353 3.7665 17.9756 3.86619 17.7329C3.96588 17.4902 4.11233 17.2697 4.296 17.086L4.356 17.026C4.5995 16.792 4.75437 16.4907 4.81243 16.1663C4.87049 15.8419 4.82912 15.5073 4.694 15.2C4.57403 14.9248 4.38131 14.6902 4.13438 14.5198C3.88745 14.3494 3.59556 14.2499 3.29 14.23H3C2.46957 14.23 1.96086 14.0193 1.58579 13.6442C1.21071 13.2691 1 12.7604 1 12.23C1 11.6996 1.21071 11.1909 1.58579 10.8158C1.96086 10.4407 2.46957 10.23 3 10.23H3.29C3.59556 10.2101 3.88745 10.1106 4.13438 9.94019C4.38131 9.76978 4.57403 9.53519 4.694 9.26C4.82912 8.95266 4.87049 8.61805 4.81243 8.29364C4.75437 7.96923 4.5995 7.66797 4.356 7.434L4.296 7.374C4.11233 7.19033 3.96588 6.9698 3.86619 6.7271C3.7665 6.48439 3.71567 6.22468 3.71567 5.962C3.71567 5.69932 3.7665 5.43961 3.86619 5.1969C3.96588 4.95419 4.11233 4.73366 4.296 4.55L4.356 4.49C4.5995 4.2565 4.75437 3.95523 4.81243 3.63082C4.87049 3.30641 4.82912 2.9718 4.694 2.664C4.57403 2.38878 4.38131 2.15418 4.13438 1.98378C3.88745 1.81337 3.59556 1.71387 3.29 1.694H3C2.46957 1.694 1.96086 1.48329 1.58579 1.10822C1.21071 0.733141 1 0.224428 1 0C1 0.530428 1.21071 1.03914 1.58579 1.41421C1.96086 1.78929 2.46957 2 3 2H3.29C3.59556 2.01987 3.88745 2.11937 4.13438 2.28978C4.38131 2.46018 4.57403 2.69478 4.694 2.97C4.82912 3.27734 4.87049 3.61195 4.81243 3.93636C4.75437 4.26077 4.5995 4.56203 4.356 4.796L4.296 4.856C4.11233 5.03967 3.96588 5.2602 3.86619 5.5029C3.7665 5.74561 3.71567 6.00532 3.71567 6.268C3.71567 6.53068 3.7665 6.79039 3.86619 7.0331C3.96588 7.2758 4.11233 7.49633 4.296 7.68L4.356 7.74C4.5995 7.9735 4.75437 8.27477 4.81243 8.59918C4.87049 8.92359 4.82912 9.2582 4.694 9.566C4.57403 9.84122 4.38131 10.0758 4.13438 10.2462C3.88745 10.4166 3.59556 10.5161 3.29 10.536H3C2.46957 10.536 1.96086 10.3253 1.58579 9.95021C1.21071 9.57514 1 9.06643 1 8.536C1 8.00557 1.21071 7.49686 1.58579 7.12179C1.96086 6.74671 2.46957 6.536 3 6.536H3.29C3.59556 6.55687 3.88745 6.65637 4.13438 6.82678C4.38131 6.99718 4.57403 7.23178 4.694 7.507C4.82912 7.81434 4.87049 8.14895 4.81243 8.47336C4.75437 8.79777 4.5995 9.09903 4.356 9.333L4.296 9.393C4.11233 9.57667 3.96588 9.7972 3.86619 10.0399C3.7665 10.2826 3.71567 10.5423 3.71567 10.805C3.71567 11.0677 3.7665 11.3274 3.86619 11.5701C3.96588 11.8128 4.11233 12.0333 4.296 12.217L4.356 12.277C4.5995 12.5105 4.75437 12.8118 4.81243 13.1362C4.87049 13.4606 4.82912 13.7952 4.694 14.103C4.57403 14.3782 4.38131 14.6128 4.13438 14.7832C3.88745 14.9536 3.59556 15.0531 3.29 15.073H3C2.46957 15.073 1.96086 14.8623 1.58579 14.4872C1.21071 14.1121 1 13.6034 1 13.073C1 12.5426 1.21071 12.0339 1.58579 11.6588C1.96086 11.2837 2.46957 11.073 3 11.073H3.29C3.59556 11.0939 3.88745 11.1934 4.13438 11.3638C4.38131 11.5342 4.57403 11.7688 4.694 12.044C4.82912 12.3513 4.87049 12.6859 4.81243 13.0103C4.75437 13.3347 4.5995 13.636 4.356 13.87L4.356 13.87Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    label: 'Admin', 
    path: '/admin-blog', 
    moderatorOnly: true, 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V2.5C4 1.11929 5.11929 0 6.5 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 13H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 17H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
]


export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation('common')

  const [isAdmin, setIsAdmin] = useState(false)
  const [isModerator, setIsModerator] = useState(false)
  const { user, signOut } = useAuth()
  const { has: hasFeature } = useFeatures()
  const [openSections, setOpenSections] = useState({
    markkinointi: true,
    myynti: true,
    tyokalut: true,
    jarjestelma: true
  })

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Apufunktiot näkyvyyden arviointiin
  const isItemVisible = (item) => {
    const adminOnly = item.adminOnly && !isAdmin
    const moderatorOnly = item.moderatorOnly && !isModerator
    return !(adminOnly || moderatorOnly)
  }

  const toolItems = menuItems.filter(i => ['/dev','/admin','/admin-blog','/admin-testimonials'].includes(i.path))
  const canShowTools = toolItems.some(isItemVisible)

  // Tarkista admin- ja moderator-oikeudet
  useEffect(() => {
    const checkUserRoles = async () => {
      if (!user) return
      
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, company_id')
          .eq('auth_user_id', user.id)
          .single()

        if (!error && userData) {
          const isAdminUser = userData.role === 'admin' || userData.company_id === 1
          const isModeratorUser = userData.role === 'moderator' || isAdminUser
          
          setIsAdmin(isAdminUser)
          setIsModerator(isModeratorUser)
        }
      } catch (error) {
        console.error('Error checking user roles:', error)
      }
    }

    checkUserRoles()
  }, [user])

  const handleLogout = async () => {
    try {
      console.log('Kirjaudutaan ulos...')
      await signOut()
      console.log('Uloskirjautuminen valmis')
    } catch (error) {
      console.error('signOut error:', error)
    }
  }

  const setLanguage = (lang) => {
    if (lang !== 'fi' && lang !== 'en') return
    document.cookie = `rascal.lang=${encodeURIComponent(lang)}; path=/; max-age=31536000`
    i18n.changeLanguage(lang)
  }

  const menu = (
    <>
      <div className={styles['profile-section']}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
          <div className={styles['profile-avatar']}>
            <img src="/favicon.png" alt="Rascal AI" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className={styles['nav-link']} type="button" onClick={() => setLanguage('fi')}>{t('lang.shortFi')}</button>
            <span style={{ opacity: 0.6 }}>/</span>
            <button className={styles['nav-link']} type="button" onClick={() => setLanguage('en')}>{t('lang.shortEn')}</button>
          </div>
        </div>
        <span className={styles['profile-name']}>{user?.email || 'user@example.com'}</span>
        <div className={styles['notification-bell-wrapper']}>
          <NotificationBell />
        </div>
      </div>
      {/* Dashboard */}
      <ul className={styles['nav-menu']}>
        {menuItems.filter(i => i.path === '/dashboard').map(item => {
          const adminOnly = item.adminOnly && !isAdmin
          const moderatorOnly = item.moderatorOnly && !isModerator
          if (adminOnly || moderatorOnly) return null
          return (
            <li className={styles['nav-item']} key={item.path}>
              <button
                className={`${styles['nav-link']} ${location.pathname.startsWith(item.path) ? styles['active'] : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className={styles['nav-icon']}>{item.icon}</span>
                {t('sidebar.labels.dashboard')}
              </button>
            </li>
          )
        })}
      </ul>

      {/* Markkinointi */}
      <button className={styles['section-header']} onClick={() => toggleSection('markkinointi')} type="button">
        <span>{t('sidebar.sections.marketing')}</span>
        <span className={`${styles['chevron']} ${openSections.markkinointi ? styles['open'] : ''}`}>▾</span>
      </button>
      {openSections.markkinointi && (<ul className={styles['nav-menu']}>
        {menuItems.filter(i => ['/posts','/blog-newsletter','/strategy'].includes(i.path)).map(item => {
          const adminOnly = item.adminOnly && !isAdmin
          const moderatorOnly = item.moderatorOnly && !isModerator
          if (adminOnly || moderatorOnly) return null
          // Feature-gating: Markkinointi
          if (item.path === '/posts' && !hasFeature('Social Media')) return null
          if (item.path === '/blog-newsletter' && !hasFeature('Email marketing integration')) return null
          if (item.path === '/strategy' && !hasFeature('Marketing assistant')) return null
          return (
            <li className={styles['nav-item']} key={item.path}>
              <button
                className={`${styles['nav-link']} ${location.pathname.startsWith(item.path) ? styles['active'] : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className={styles['nav-icon']}>{item.icon}</span>
                {item.path === '/posts' ? t('sidebar.labels.posts') : item.path === '/blog-newsletter' ? t('sidebar.labels.blogNewsletter') : t('sidebar.labels.strategy')}
              </button>
            </li>
          )
        })}
      </ul>)}

      {/* Myynti */}
      <button className={styles['section-header']} onClick={() => toggleSection('myynti')} type="button">
        <span>{t('sidebar.sections.sales')}</span>
        <span className={`${styles['chevron']} ${openSections.myynti ? styles['open'] : ''}`}>▾</span>
      </button>
      {openSections.myynti && (<ul className={styles['nav-menu']}>
        {menuItems.filter(i => ['/campaigns','/segments','/calls','/ai-chat'].includes(i.path)).map(item => {
          const adminOnly = item.adminOnly && !isAdmin
          const moderatorOnly = item.moderatorOnly && !isModerator
          if (adminOnly || moderatorOnly) return null
          // Feature-gating: Myynti
          if (item.path === '/campaigns' && !hasFeature('Campaigns')) return null
          if (item.path === '/segments' && !hasFeature('Segments')) return null
          if (item.path === '/calls' && !hasFeature('Phone Calls')) return null
          if (item.path === '/ai-chat' && !hasFeature('Marketing assistant')) return null
          return (
            <li className={styles['nav-item']} key={item.path}>
              <button
                className={`${styles['nav-link']} ${location.pathname.startsWith(item.path) ? styles['active'] : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className={styles['nav-icon']}>{item.icon}</span>
                {item.path === '/campaigns' ? t('sidebar.labels.campaigns') : item.path === '/segments' ? t('sidebar.labels.segments') : item.path === '/calls' ? t('sidebar.labels.calls') : t('sidebar.labels.aiChat')}
              </button>
            </li>
          )
        })}
      </ul>)}

      {/* Työkalut */}
      {canShowTools && (
        <>
          <button className={styles['section-header']} onClick={() => toggleSection('tyokalut')} type="button">
            <span>{t('sidebar.sections.tools')}</span>
            <span className={`${styles['chevron']} ${openSections.tyokalut ? styles['open'] : ''}`}>▾</span>
          </button>
          {openSections.tyokalut && (
            <ul className={styles['nav-menu']}>
              {toolItems.filter(isItemVisible).map(item => {
                // Feature-gating Työkalut -osioon
                if (item.path === '/dev' && !hasFeature('Dev')) return null
                return (
                  <li className={styles['nav-item']} key={item.path}>
                    <button
                      className={`${styles['nav-link']} ${location.pathname.startsWith(item.path) ? styles['active'] : ''}`}
                      onClick={() => navigate(item.path)}
                    >
                      <span className={styles['nav-icon']}>{item.icon}</span>
                      {item.path === '/dev' ? t('sidebar.labels.dev') : item.path === '/admin' ? t('sidebar.labels.admin') : t('sidebar.labels.adminBlog')}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
      <div className={styles['settings-section']}>
        <button className={styles['nav-link']} onClick={() => navigate('/settings')}>
          <span className={styles['nav-icon']}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.257 9.77251 19.9887C9.5799 19.7204 9.31074 19.5206 9 19.41C8.69838 19.2994 8.36381 19.2818 8.03941 19.3594C7.71502 19.437 7.41471 19.6066 7.18 19.85L7.12 19.91C6.936 20.0937 6.71547 20.2401 6.47275 20.3398C6.23004 20.4395 5.97033 20.4903 5.708 20.49C5.44567 20.49 5.18596 20.4395 4.94325 20.3398C4.70053 20.2401 4.47997 20.0937 4.296 19.91C4.11233 19.7263 3.96588 19.5058 3.86619 19.2631C3.7665 19.0204 3.71567 18.7607 3.71567 18.498C3.71567 18.2353 3.7665 17.9756 3.86619 17.7329C3.96588 17.4902 4.11233 17.2697 4.296 17.086L4.356 17.026C4.5995 16.792 4.75437 16.4907 4.81243 16.1663C4.87049 15.8419 4.82912 15.5073 4.694 15.2C4.57403 14.9248 4.38131 14.6902 4.13438 14.5198C3.88745 14.3494 3.59556 14.2499 3.29 14.23H3C2.46957 14.23 1.96086 14.0193 1.58579 13.6442C1.21071 13.2691 1 12.7604 1 12.23C1 11.6996 1.21071 11.1909 1.58579 10.8158C1.96086 10.4407 2.46957 10.23 3 10.23H3.29C3.59556 10.2101 3.88745 10.1106 4.13438 9.94019C4.38131 9.76978 4.57403 9.53519 4.694 9.26C4.82912 8.95266 4.87049 8.61805 4.81243 8.29364C4.75437 7.96923 4.5995 7.66797 4.356 7.434L4.296 7.374C4.11233 7.19033 3.96588 6.9698 3.86619 6.7271C3.7665 6.48439 3.71567 6.22468 3.71567 5.962C3.71567 5.69932 3.7665 5.43961 3.86619 5.1969C3.96588 4.95419 4.11233 4.73366 4.296 4.55L4.356 4.49C4.5995 4.2565 4.75437 3.95523 4.81243 3.63082C4.87049 3.30641 4.82912 2.9718 4.694 2.664C4.57403 2.38878 4.38131 2.15418 4.13438 1.98378C3.88745 1.81337 3.59556 1.71387 3.29 1.694H3C2.46957 1.694 1.96086 1.48329 1.58579 1.10822C1.21071 0.733141 1 0.224428 1 0C1 0.530428 1.21071 1.03914 1.58579 1.41421C1.96086 1.78929 2.46957 2 3 2H3.29C3.59556 2.01987 3.88745 2.11937 4.13438 2.28978C4.38131 2.46018 4.57403 2.69478 4.694 2.97C4.82912 3.27734 4.87049 3.61195 4.81243 3.93636C4.75437 4.26077 4.5995 4.56203 4.356 4.796L4.296 4.856C4.11233 5.03967 3.96588 5.2602 3.86619 5.5029C3.7665 5.74561 3.71567 6.00532 3.71567 6.268C3.71567 6.53068 3.7665 6.79039 3.86619 7.0331C3.96588 7.2758 4.11233 7.49633 4.296 7.68L4.356 7.74C4.5995 7.9735 4.75437 8.27477 4.81243 8.59918C4.87049 8.92359 4.82912 9.2582 4.694 9.566C4.57403 9.84122 4.38131 10.0758 4.13438 10.2462C3.88745 10.4166 3.59556 10.5161 3.29 10.536H3C2.46957 10.536 1.96086 10.3253 1.58579 9.95021C1.21071 9.57514 1 9.06643 1 8.536C1 8.00557 1.21071 7.49686 1.58579 7.12179C1.96086 6.74671 2.46957 6.536 3 6.536H3.29C3.59556 6.55687 3.88745 6.65637 4.13438 6.82678C4.38131 6.99718 4.57403 7.23178 4.694 7.507C4.82912 7.81434 4.87049 8.14895 4.81243 8.47336C4.75437 8.79777 4.5995 9.09903 4.356 9.333L4.296 9.393C4.11233 9.57667 3.96588 9.7972 3.86619 10.0399C3.7665 10.2826 3.71567 10.5423 3.71567 10.805C3.71567 11.0677 3.7665 11.3274 3.86619 11.5701C3.96588 11.8128 4.11233 12.0333 4.296 12.217L4.356 12.277C4.5995 12.5105 4.75437 12.8118 4.81243 13.1362C4.87049 13.4606 4.82912 13.7952 4.694 14.103C4.57403 14.3782 4.38131 14.6128 4.13438 14.7832C3.88745 14.9536 3.59556 15.0531 3.29 15.073H3C2.46957 15.073 1.96086 14.8623 1.58579 14.4872C1.21071 14.1121 1 13.6034 1 13.073C1 12.5426 1.21071 12.0339 1.58579 11.6588C1.96086 11.2837 2.46957 11.073 3 11.073H3.29C3.59556 11.0939 3.88745 11.1934 4.13438 11.3638C4.38131 11.5342 4.57403 11.7688 4.694 12.044C4.82912 12.3513 4.87049 12.6859 4.81243 13.0103C4.75437 13.3347 4.5995 13.636 4.356 13.87L4.356 13.87Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {t('sidebar.settings')}
        </button>
        <button className={styles['nav-link']} onClick={() => navigate('/help')}>
          <span className={styles['nav-icon']}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {t('sidebar.helpCenter')}
        </button>
        <button 
          onClick={handleLogout} 
          className={styles['logout-btn']}
          type="button"
        >
          <span className={styles['nav-icon']}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {t('sidebar.logout')}
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