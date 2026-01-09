import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserOrgId } from '../lib/getUserOrgId'

export const useMonthlyLimit = () => {
  const [limitData, setLimitData] = useState({
    currentCount: 0,
    monthlyLimit: 30,
    remaining: 30,
    canCreate: true,
    isUnlimited: false,
    loading: false,
    error: null
  })
  
  const { user } = useAuth()

  const checkLimit = async () => {
    if (!user?.id) return

    setLimitData(prev => ({ ...prev, loading: true, error: null }))

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

      // Hae nykyisen kuukauden strategia
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

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

      // Etsi strategia joka vastaa nykyistä kuukautta ja vuotta
      let currentStrategy = null
      if (strategies) {
        currentStrategy = strategies.find(s => {
          if (!s.month) return false
          const monthLower = s.month.toLowerCase()
          const hasCurrentMonth = monthLower.includes(englishMonthNames[currentMonth]) ||
                                  monthLower.includes(finnishMonthNames[currentMonth])
          const hasCurrentYear = monthLower.includes(String(currentYear))
          return hasCurrentMonth && hasCurrentYear
        })
      }

      // Laske generoidut sisällöt strategian perusteella
      let currentCount = 0
      if (currentStrategy?.id) {
        const { count, error: cntErr } = await supabase
          .from('content')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('strategy_id', currentStrategy.id)
          .eq('is_generated', true)

        if (cntErr) {
          console.error('Error counting current month generated content:', cntErr)
        } else {
          currentCount = count || 0
        }
      }

      const isUnlimited = monthlyLimit >= 999999
      const remaining = isUnlimited ? Infinity : Math.max(0, monthlyLimit - currentCount)

      setLimitData(prev => ({
        ...prev,
        currentCount,
        monthlyLimit,
        remaining,
        canCreate: isUnlimited || currentCount < monthlyLimit,
        isUnlimited,
        loading: false,
        error: null
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

