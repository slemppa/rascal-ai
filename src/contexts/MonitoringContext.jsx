import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const MonitoringContext = createContext({})

export const useMonitoring = () => {
  const context = useContext(MonitoringContext)
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider')
  }
  return context
}

export const MonitoringProvider = ({ children }) => {
  const { user } = useAuth()
  const [hasMonitoring, setHasMonitoring] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Tarkista mediaseuranta-status API-endpointin kautta (käyttää withOrganization middlewarea)
  const checkMonitoringStatus = useCallback(async () => {
    if (!user?.id) {
      setHasMonitoring(false)
      setInitialized(true)
      return
    }

    try {
      setLoading(true)
      
      // Hae access token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('MonitoringContext: No access token')
        setHasMonitoring(false)
        setInitialized(true)
        return
      }

      // Käytä API-endpointtia joka käyttää withOrganization middlewarea
      const response = await axios.get('/api/monitoring/check-status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 200 && response.data) {
        setHasMonitoring(response.data.hasMonitoring || false)
      } else {
        setHasMonitoring(false)
      }
    } catch (err) {
      console.error('Error checking monitoring status:', err)
      setHasMonitoring(false)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [user?.id])

  // Alusta status kun käyttäjä vaihtuu
  useEffect(() => {
    if (user) {
      checkMonitoringStatus()
    } else {
      setHasMonitoring(false)
      setInitialized(true)
    }
  }, [user, checkMonitoringStatus])

  // Päivitä status manuaalisesti (kutsutaan kun mediaseuranta aloitetaan)
  const refreshMonitoringStatus = useCallback(() => {
    return checkMonitoringStatus()
  }, [checkMonitoringStatus])

  const value = {
    hasMonitoring,
    loading,
    initialized,
    refreshMonitoringStatus
  }

  return (
    <MonitoringContext.Provider value={value}>
      {children}
    </MonitoringContext.Provider>
  )
}
