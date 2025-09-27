import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

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

  console.log('StrategyStatusProvider: Rendered with user:', user?.id, 'location:', location.pathname)

  // Hae käyttäjän status
  const fetchUserStatus = async () => {
    if (!user?.id) {
      console.log('StrategyStatus: No user ID, skipping status check')
      return
    }

    try {
      console.log('StrategyStatus: Fetching user status for user:', user.id)
      const { data, error } = await supabase
        .from('users')
        .select('status, strategy_approved_at')
        .eq('auth_user_id', user.id)
        .single()

      if (error) {
        console.error('StrategyStatus: Error fetching user status:', error)
        return
      }

      console.log('StrategyStatus: User status:', data?.status)
      setUserStatus(data?.status)
      
      // Näytä modal jos status on Pending JA emme ole strategia-sivulla
      if (data?.status === 'Pending' && !location.pathname.includes('/strategy')) {
        console.log('StrategyStatus: Showing modal for Pending status')
        setShowStrategyModal(true)
      } else if (data?.status === 'Pending' && location.pathname.includes('/strategy')) {
        console.log('StrategyStatus: Pending status but on strategy page, not showing modal')
      }
    } catch (error) {
      console.error('StrategyStatus: Error fetching user status:', error)
    }
  }

  // Vahvista strategia
  const approveStrategy = async () => {
    if (!user?.id) {
      console.log('StrategyStatus: No user ID for approval')
      return
    }

    console.log('StrategyStatus: Approving strategy for user:', user.id)
    setLoading(true)
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      
      if (!token) {
        console.error('StrategyStatus: No access token')
        alert('Sisäänkirjautuminen puuttuu. Kirjaudu uudelleen sisään.')
        return
      }

      console.log('StrategyStatus: Sending approval request')
      const response = await fetch('/api/strategy-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        console.log('StrategyStatus: Approval successful')
        setUserStatus('Approved')
        setShowStrategyModal(false)
        console.log('Strategy approved successfully')
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

  // Sulje modal kun mennään strategia-sivulle
  useEffect(() => {
    if (location.pathname.includes('/strategy')) {
      console.log('StrategyStatus: On strategy page, closing modal')
      setShowStrategyModal(false)
    }
  }, [location.pathname])

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
