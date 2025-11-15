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

      // Selvitä seuraavan kuun strategia ja laske generoidut sisällöt strategy_id:n perusteella
      const now = new Date()
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const englishMonthNames = [
        'january','february','march','april','may','june','july','august','september','october','november','december'
      ]
      const targetMonthName = englishMonthNames[nextMonthDate.getMonth()]

      // Hae käyttäjän strategia, jonka month vastaa seuraavaa kuukautta (DB:ssä kuukaudet englanniksi)
      const { data: strategyRow, error: strategyErr } = await supabase
        .from('content_strategy')
        .select('id, month')
        .eq('user_id', userId)
        .ilike('month', `%${targetMonthName}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (strategyErr) {
        console.error('Error fetching next month strategy:', strategyErr)
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

      let nextMonthCount = 0
      if (strategyRow?.id) {
        // Laske content-riveistä tälle strategialle generoidut sisällöt
        const { count, error: cntErr } = await supabase
          .from('content')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('strategy_id', strategyRow.id)
          .eq('is_generated', true)

        if (cntErr) {
          console.error('Error counting next month generated content:', cntErr)
        } else {
          nextMonthCount = count || 0
        }
      }

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
