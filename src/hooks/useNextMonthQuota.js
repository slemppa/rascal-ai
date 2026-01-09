import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserOrgId } from '../lib/getUserOrgId'

export const useNextMonthQuota = () => {
  const [quotaData, setQuotaData] = useState({
    nextMonthCount: 0,
    nextMonthLimit: 30,
    nextMonthRemaining: 30,
    subscriptionStatus: 'free',
    isUnlimited: false,
    loading: false,
    error: null
  })
  
  const { user } = useAuth()

  const checkNextMonthQuota = async () => {
    if (!user?.id) return

    setQuotaData(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id)
      
      if (!userId) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      // Hae käyttäjän tilaustaso
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('id', userId)
        .single()
      
      if (userError || !userData) {
        throw new Error('Käyttäjän tietoja ei löytynyt')
      }

      // Määritä kuukausiraja tilauksen perusteella
      const subscriptionStatus = String(userData.subscription_status || 'free').toLowerCase()
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

      // Laske seuraavan kuukauden generoidut sisällöt päivämäärän perusteella
      const now = new Date()
      const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const lastDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999)

      const { count, error: cntErr } = await supabase
        .from('content')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_generated', true)
        .gte('created_at', firstDayOfNextMonth.toISOString())
        .lte('created_at', lastDayOfNextMonth.toISOString())

      let nextMonthCount = 0
      if (cntErr) {
        console.error('Error counting next month generated content:', cntErr)
      } else {
        nextMonthCount = count || 0
      }

      const isUnlimited = monthlyLimit >= 999999
      const nextMonthRemaining = isUnlimited ? Infinity : Math.max(0, monthlyLimit - nextMonthCount)

      setQuotaData({
        nextMonthCount,
        nextMonthLimit: monthlyLimit,
        nextMonthRemaining,
        subscriptionStatus,
        isUnlimited,
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
