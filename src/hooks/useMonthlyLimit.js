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

      // Hae kaikki käyttäjän strategiat (mukaan lukien target_month)
      const { data: strategies, error: strategyErr } = await supabase
        .from('content_strategy')
        .select('id, month, target_month')
        .eq('user_id', userId)

      if (strategyErr) {
        console.error('Error fetching strategies:', strategyErr)
      }

      // Etsi strategia joka vastaa nykyistä kuukautta
      // Ensin yritetään käyttää target_month-kenttää (päivämäärä)
      // Jos sitä ei ole, käytetään month-kenttää (kuukauden nimi)
      let currentStrategy = null
      if (strategies && strategies.length > 0) {
        const currentMonthName = englishMonthNames[currentMonth]
        const currentMonthNameFi = finnishMonthNames[currentMonth]
        
        // Laske kuukauden alku ja loppu vertailua varten
        const monthStart = new Date(currentYear, currentMonth, 1)
        const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)
        
        currentStrategy = strategies.find(s => {
          // Jos target_month on saatavilla, käytetään sitä (tarkempi)
          if (s.target_month) {
            const targetDate = new Date(s.target_month)
            return targetDate >= monthStart && targetDate <= monthEnd
          }
          
          // Muuten käytetään month-kenttää (kuukauden nimi)
          if (!s.month) return false
          const monthLower = s.month.toLowerCase()
          const hasCurrentMonth = monthLower.includes(currentMonthName) ||
                                  monthLower.includes(currentMonthNameFi)
          // Jos month-kentässä ei ole vuotta, hyväksytään jos kuukausi täsmää
          // (vanhat strategiat voivat olla ilman vuotta)
          return hasCurrentMonth
        })
        
        // Debug-logitus jos strategiaa ei löydy
        if (!currentStrategy) {
          console.warn('No strategy found for current month:', {
            currentMonth: currentMonthName,
            currentMonthFi: currentMonthNameFi,
            currentYear,
            currentMonthIndex: currentMonth,
            monthStart: monthStart.toISOString(),
            monthEnd: monthEnd.toISOString(),
            availableStrategies: strategies.map(s => ({
              id: s.id,
              month: s.month,
              target_month: s.target_month,
              monthLower: s.month?.toLowerCase()
            })),
            searchDetails: strategies.map(s => {
              if (s.target_month) {
                const targetDate = new Date(s.target_month)
                const matchesTargetMonth = targetDate >= monthStart && targetDate <= monthEnd
                return {
                  id: s.id,
                  month: s.month,
                  target_month: s.target_month,
                  matchesTargetMonth,
                  match: matchesTargetMonth
                }
              }
              if (!s.month) return { id: s.id, match: false, reason: 'no month field' }
              const monthLower = s.month.toLowerCase()
              const hasMonth = monthLower.includes(currentMonthName) || monthLower.includes(currentMonthNameFi)
              return {
                id: s.id,
                month: s.month,
                hasMonth,
                match: hasMonth
              }
            })
          })
        } else {
          console.log('Strategy found for current month:', {
            strategyId: currentStrategy.id,
            month: currentStrategy.month,
            target_month: currentStrategy.target_month
          })
        }
      } else {
        console.warn('No strategies found for user:', userId)
      }

      // Laske generoidut sisällöt strategian perusteella
      // Postaukset luodaan edellisen kuukauden aikana, mutta ne kuuluvat nykyisen kuukauden strategiaan
      // Joten laskenta tehdään strategy_id:n perusteella, ei created_at:n perusteella
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
          console.log('Generated content count for current month strategy:', {
            strategyId: currentStrategy.id,
            count: currentCount
          })
        }
      } else {
        // Jos strategiaa ei löydy, logataan varoitus mutta lasketaan silti 0
        // (tämä voi tapahtua jos strategiaa ei ole vielä luotu)
        console.warn('No strategy found for current month, count will be 0')
        currentCount = 0
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

