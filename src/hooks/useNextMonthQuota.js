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

      // Hae seuraavan kuukauden strategia
      const now = new Date()
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const nextMonth = nextMonthDate.getMonth()
      const nextYear = nextMonthDate.getFullYear()

      const englishMonthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ]
      const finnishMonthNames = [
        'tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu',
        'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'
      ]

      // Hae kaikki käyttäjän strategiat
      const { data: strategies, error: strategyErr } = await supabase
        .from('content_strategy')
        .select('id, month')
        .eq('user_id', userId)

      if (strategyErr) {
        console.error('Error fetching strategies:', strategyErr)
      }

      // Etsi strategia joka vastaa seuraavaa kuukautta ja vuotta
      let nextMonthStrategy = null
      if (strategies) {
        nextMonthStrategy = strategies.find(s => {
          if (!s.month) return false
          const monthLower = s.month.toLowerCase()
          const hasNextMonth = monthLower.includes(englishMonthNames[nextMonth]) ||
                               monthLower.includes(finnishMonthNames[nextMonth])
          const hasNextYear = monthLower.includes(String(nextYear))
          return hasNextMonth && hasNextYear
        })
      }

      // Laske generoidut sisällöt strategian perusteella
      let nextMonthCount = 0
      if (nextMonthStrategy?.id) {
        const { count, error: cntErr } = await supabase
          .from('content')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('strategy_id', nextMonthStrategy.id)
          .eq('is_generated', true)

        if (cntErr) {
          console.error('Error counting next month generated content:', cntErr)
        } else {
          nextMonthCount = count || 0
        }
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
