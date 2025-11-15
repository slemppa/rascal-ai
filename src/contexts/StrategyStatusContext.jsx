import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { getUserOrgId } from '../lib/getUserOrgId'

const StrategyStatusContext = createContext({})

export const useStrategyStatus = () => {
  const context = useContext(StrategyStatusContext)
  if (!context) {
    throw new Error('useStrategyStatus must be used within a StrategyStatusProvider')
  }
  return context
}

export const StrategyStatusProvider = ({ children }) => {
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

  // Hae käyttäjän status
  const fetchUserStatus = async () => {
    if (!user?.id) {
      return
    }

    try {
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id)
      
      if (!userId) {
        console.error('StrategyStatus: User ID not found')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('status, strategy_approved_at')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('StrategyStatus: Error fetching user status:', error)
        return
      }

      setUserStatus(data?.status)
      
      // Näytä modal jos status on Pending JA emme ole blacklist-sivulla
      if (data?.status === 'Pending' && !isOnBlockedPage()) {
        setShowStrategyModal(true)
        // FORCE: Dispatch custom event DOM:iin
        setTimeout(() => {
          const event = new CustomEvent('strategy-modal-should-open', { detail: { reason: 'status-pending' } })
          window.dispatchEvent(event)
        }, 100)
      }
    } catch (error) {
      console.error('StrategyStatus: Error fetching user status:', error)
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
        alert('Sisäänkirjautuminen puuttuu. Kirjaudu uudelleen sisään.')
        return
      }

      const response = await fetch('/api/strategy-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setUserStatus('Approved')
        setShowStrategyModal(false)
      } else {
        const errorData = await response.json()
        console.error('StrategyStatus: Approval failed:', errorData)
        alert('Strategian vahvistaminen epäonnistui. Yritä uudelleen.')
      }
    } catch (error) {
      console.error('StrategyStatus: Approval error:', error)
      alert('Virhe strategian vahvistamisessa. Yritä uudelleen.')
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

  // Hae status kun käyttäjä muuttuu
  useEffect(() => {
    if (user?.id) {
      fetchUserStatus()
    }
  }, [user?.id])

  // Kuuntele realtime-päivityksiä user statukseen
  useEffect(() => {
    if (!user?.id) return


    // Luo Supabase realtime channel
    const channel = supabase
      .channel('user-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `auth_user_id=eq.${user.id}`
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

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel)
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
