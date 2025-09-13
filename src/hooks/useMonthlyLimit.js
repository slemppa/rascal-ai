import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

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
      const response = await fetch('/api/check-monthly-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_user_id: user.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to check monthly limit')
      }

      const data = await response.json()
      setLimitData(prev => ({
        ...prev,
        ...data,
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

