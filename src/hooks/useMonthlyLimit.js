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

      // Määritä nykyinen kuukausi (englanniksi kuten tietokannassa)
      const now = new Date()
      const englishMonthNames = [
        'january','february','march','april','may','june','july','august','september','october','november','december'
      ]
      const targetMonthName = englishMonthNames[now.getMonth()]

      // Hae käyttäjän strategia tälle kuulle
      const { data: strategyRow, error: strategyErr } = await supabase
        .from('content_strategy')
        .select('id, month')
        .eq('user_id', userId)
        .ilike('month', `%${targetMonthName}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (strategyErr) {
        console.error('Error fetching current month strategy:', strategyErr)
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

      // Laske tälle kuulle generoidut sisällöt (strategian perusteella, jos löytyy)
      let currentCount = 0
      if (strategyRow?.id) {
        const { count, error: cntErr } = await supabase
          .from('content')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('strategy_id', strategyRow.id)
          .eq('is_generated', true)

        if (cntErr) {
          console.error('Error counting current month generated content:', cntErr)
        } else {
          currentCount = count || 0
        }
      }

      const remaining = Math.max(0, monthlyLimit - currentCount)

      setLimitData(prev => ({
        ...prev,
        currentCount,
        monthlyLimit,
        remaining,
        canCreate: currentCount < monthlyLimit,
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

