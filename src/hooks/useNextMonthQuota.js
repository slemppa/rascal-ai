import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export const useNextMonthQuota = () => {
  const [quotaData, setQuotaData] = useState({
    nextMonthCount: 0,
    nextMonthLimit: 30,
    nextMonthRemaining: 30,
    subscriptionStatus: 'free',
    loading: false,
    error: null
  })
  
  const { user } = useAuth()

  const checkNextMonthQuota = async () => {
    if (!user?.id) return

    setQuotaData(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Hae käyttäjän user_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, subscription_status')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userError || !userData?.id) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      // Laske seuraavan kuun päivämäärä
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      
      // Käytä get_user_quota_status funktiota seuraavan kuun tietojen hakemiseen
      const { data, error } = await supabase
        .rpc('get_user_quota_status', {
          p_user_id: userData.id,
          p_month: nextMonth.toISOString().split('T')[0]
        })

      if (error) {
        console.error('Error fetching next month quota:', error)
        throw error
      }

      const quotaInfo = data && data.length > 0 ? data[0] : {
        subscription_status: userData.subscription_status || 'free',
        monthly_limit: 30,
        ai_generated_count: 0,
        remaining_quota: 30
      }

      // Määritä rajat subscription statusin mukaan
      let monthlyLimit = 30
      switch (quotaInfo.subscription_status) {
        case 'pro':
          monthlyLimit = 100
          break
        case 'enterprise':
          monthlyLimit = 999999
          break
        default:
          monthlyLimit = 30
      }

      const nextMonthCount = quotaInfo.ai_generated_count || 0
      const nextMonthRemaining = Math.max(0, monthlyLimit - nextMonthCount)

      setQuotaData({
        nextMonthCount,
        nextMonthLimit: monthlyLimit,
        nextMonthRemaining,
        subscriptionStatus: quotaInfo.subscription_status,
        loading: false,
        error: null
      })

    } catch (error) {
      console.error('Error checking next month quota:', error)
      setQuotaData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }

  useEffect(() => {
    checkNextMonthQuota()
  }, [user?.id])

  return {
    ...quotaData,
    refresh: checkNextMonthQuota
  }
}
