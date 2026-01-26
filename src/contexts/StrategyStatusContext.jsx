import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import axios from 'axios'

const StrategyStatusContext = createContext({})

export const useStrategyStatus = () => {
  const context = useContext(StrategyStatusContext)
  if (!context) {
    throw new Error('useStrategyStatus must be used within a StrategyStatusProvider')
  }
  return context
}

export const StrategyStatusProvider = ({ children }) => {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const location = useLocation()
  const [showStrategyModal, setShowStrategyModal] = useState(false)
  const [userStatus, setUserStatus] = useState(null)
  const [loading, setLoading] = useState(false)


  // Sivut joilla strategia-modal EI saa avautua (kriittiset toiminnot)
  const MODAL_BLACKLIST = [
    '/',           // Etusivu / kirjautumissivu
    '/strategy',   // Strategia-sivu (käyttäjä jo käsittelee strategiaa)
    '/settings',   // Asetukset (salasanan vaihto, kriittiset asetukset)
    '/signin',     // Kirjautuminen
    '/signup',     // Rekisteröityminen
    '/reset-password',  // Salasanan resetointi
    '/forgot-password', // Salasanan palautus
    '/admin',      // Admin-sivu
  ]

  // Tarkista onko nykyinen sivu blacklistillä
  const isOnBlockedPage = () => {
    return MODAL_BLACKLIST.some(path => {
      // Tarkkailtu "/" erikseen, jotta se ei osu kaikkiin polkuihin
      if (path === '/') {
        return location.pathname === '/'
      }
      return location.pathname === path || location.pathname.startsWith(path + '/')
    })
  }

  // Hae käyttäjän status API-endpointin kautta (käyttää middlewarea)
  const fetchUserStatus = async () => {
    if (!user?.id) {
      return
    }

    try {
      // Hae access token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('StrategyStatus: No access token')
        return
      }

      // Käytä API-endpointtia joka käyttää withOrganization middlewarea
      const response = await axios.get('/api/strategy/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 200 && response.data) {
        const status = response.data.status
        setUserStatus(status)
        
        console.log('🔍 StrategyStatus: Status check', {
          status: status,
          isBlockedPage: isOnBlockedPage(),
          pathname: location.pathname,
          shouldShowModal: status === 'Pending' && !isOnBlockedPage()
        })
        
        // Tarkista onko modaali minimoitu localStorageen (käytä auth_user_id:ta)
        const skipped = localStorage.getItem(`strategy_modal_skipped_${user.id}`)
        if (skipped === 'true') {
          console.log('⏸️ StrategyStatus: Modal on minimoitu, ei avata')
          // Älä avaa modaalia jos se on minimoitu
          return
        }
        
        // Näytä modal jos status on Pending JA emme ole blacklist-sivulla
        if (status === 'Pending' && !isOnBlockedPage()) {
          console.log('✅ StrategyStatus: Opening modal')
          setShowStrategyModal(true)
          // FORCE: Dispatch custom event DOM:iin
          setTimeout(() => {
            const event = new CustomEvent('strategy-modal-should-open', { detail: { reason: 'status-pending' } })
            window.dispatchEvent(event)
          }, 100)
        } else {
          console.log('❌ StrategyStatus: NOT opening modal', {
            status: status,
            isBlocked: isOnBlockedPage()
          })
        }
      }
    } catch (error) {
      console.error('StrategyStatus: Error fetching user status:', error)
      // Älä näytä virhettä käyttäjälle, koska tämä on taustaprosessi
    }
  }

  // Vahvista strategia
  const approveStrategy = async () => {
    if (!user?.id) {
      return
    }

    setLoading(true)
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      
      if (!token) {
        console.error('StrategyStatus: No access token')
        alert(t('alerts.error.loginRequired'))
        return
      }

      const response = await fetch('/api/strategy/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setUserStatus('Approved')
        setShowStrategyModal(false)
        // Tyhjennä minimoitu-lippu kun strategia on vahvistettu
        if (user?.id) {
          localStorage.removeItem(`strategy_modal_skipped_${user.id}`)
        }
      } else {
        const errorData = await response.json()
        console.error('StrategyStatus: Approval failed:', errorData)
        alert(t('alerts.error.strategyApprovalFailed'))
      }
    } catch (error) {
      console.error('StrategyStatus: Approval error:', error)
      alert(t('alerts.error.strategyError'))
    } finally {
      setLoading(false)
    }
  }

  // Pyydä strategian päivitystä
  const requestStrategyUpdate = () => {
    // Sulje modal ensin
    setShowStrategyModal(false)
    // Ohjaa strategia-sivulle
    window.location.href = '/strategy'
  }

  // Sulje modal
  const closeModal = () => {
    setShowStrategyModal(false)
  }

  // Hae status kun käyttäjä muuttuu tai sivu muuttuu
  useEffect(() => {
    if (user?.id) {
      fetchUserStatus()
    }
  }, [user?.id, location.pathname])

  // Kuuntele realtime-päivityksiä user statukseen
  // HUOM: Realtime vaatii edelleen userId:n, mutta käytetään API-endpointtia
  // saamaan oikea ID middlewarea käyttäen
  useEffect(() => {
    if (!user?.id) return

    let channel = null

    // Hae organisaation ID API-endpointin kautta (käyttää middlewarea)
    const setupRealtime = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        // Hae status API:sta saadaksemme oikean userId:n middlewarea käyttäen
        const response = await axios.get('/api/strategy/status', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.status === 200 && response.data) {
          // Hae userId käyttäen API/users/me endpointtia joka palauttaa oikean ID:n
          const meResponse = await axios.get('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          })

          const userId = meResponse.data?.id
          if (!userId) return

          // Luo Supabase realtime channel
          channel = supabase
            .channel('user-status-changes')
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'users',
                filter: `id=eq.${userId}`
              },
              (payload) => {
                const newStatus = payload.new?.status
                
                if (newStatus) {
                  setUserStatus(newStatus)
                  
                  // Näytä modal jos status muuttui Pending:ksi JA emme ole blacklist-sivulla
                  if (newStatus === 'Pending' && !isOnBlockedPage()) {
                    setShowStrategyModal(true)
                  }
                }
              }
            )
            .subscribe()
        }
      } catch (error) {
        console.error('StrategyStatus: Error setting up realtime:', error)
      }
    }

    setupRealtime()

    // Cleanup subscription
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [user?.id, location.pathname])

  // Sulje modal kun mennään blacklist-sivulle
  useEffect(() => {
    if (isOnBlockedPage()) {
      setShowStrategyModal(false)
    }
  }, [location.pathname])

  // DEBUG: Kuuntele custom event joka pakottaa modalin auki
  useEffect(() => {
    const handleForceOpen = () => {
      setShowStrategyModal(true)
    }
    
    window.addEventListener('force-strategy-modal-open', handleForceOpen)
    return () => {
      window.removeEventListener('force-strategy-modal-open', handleForceOpen)
    }
  }, [])

  const value = {
    showStrategyModal,
    userStatus,
    loading,
    approveStrategy,
    requestStrategyUpdate,
    closeModal,
    refreshUserStatus: fetchUserStatus
  }

  return (
    <StrategyStatusContext.Provider value={value}>
      {children}
    </StrategyStatusContext.Provider>
  )
}
