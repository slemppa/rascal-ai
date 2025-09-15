import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export const useMonthlyLimit = () => {
  const [limitData, setLimitData] = useState({
    currentCount: 0,
    monthlyLimit: 30,
    remaining: 30,
    canCreate: true,
    loading: false,
    error: null
  })
  
  const { user } = useAuth()

  const checkLimit = async () => {
    if (!user?.id) return

    setLimitData(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Hae token ja pyydä tiedot user-features endpointista (palauttaa monthly_content_count)
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) {
        throw new Error('Missing auth token')
      }

      const response = await fetch('/api/user-features', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to check monthly limit')
      }

      const data = await response.json()
      const currentCount = Number(data?.monthly_content_count || 0)
      const monthlyLimit = 30
      const remaining = Math.max(0, monthlyLimit - currentCount)

      setLimitData(prev => ({
        ...prev,
        currentCount,
        monthlyLimit,
        remaining,
        canCreate: currentCount < monthlyLimit,
        loading: false
      }))
    } catch (error) {
      console.error('Error checking monthly limit:', error)
      setLimitData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }

  useEffect(() => {
    checkLimit()
  }, [user?.id])

  return {
    ...limitData,
    refresh: checkLimit
  }
}

