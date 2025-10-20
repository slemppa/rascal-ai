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

      // Laske seuraavan kuun päivämäärä (paikallinen YYYY-MM-01, vältä UTC-heittelyä)
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const pMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`
      
      // Käytä get_user_quota_status funktiota seuraavan kuun tietojen hakemiseen
      const { data, error } = await supabase
        .rpc('get_user_quota_status', {
          p_user_id: userData.id,
          p_month: pMonth
        })

      if (error) {
        console.error('Error fetching next month quota:', error)
        throw error
      }

      const fallback = {
        subscription_status: userData.subscription_status || 'free',
        monthly_limit: 30,
        ai_generated_count: 0,
        remaining_quota: 30
      }
      const quotaInfoRaw = Array.isArray(data) ? (data && data[0]) : data
      const quotaInfo = quotaInfoRaw && typeof quotaInfoRaw === 'object' ? quotaInfoRaw : fallback

      // Määritä rajat subscription statusin mukaan
      const subscriptionStatus = String(quotaInfo.subscription_status || 'free').toLowerCase()
      let monthlyLimit = 30
      switch (subscriptionStatus) {
        case 'pro':
          monthlyLimit = 100
          break
        case 'enterprise':
          monthlyLimit = 999999
          break
        default:
          monthlyLimit = 30
      }

      const nextMonthCount = Number(quotaInfo.ai_generated_count) || 0
      const nextMonthRemaining = Math.max(0, monthlyLimit - nextMonthCount)

      setQuotaData({
        nextMonthCount,
        nextMonthLimit: monthlyLimit,
        nextMonthRemaining,
        subscriptionStatus,
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
