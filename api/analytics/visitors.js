import { withOrganization } from '../_middleware/with-organization.js'
import { sendToN8N } from '../_lib/n8n-client.js'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const ENCRYPTION_KEY = process.env.USER_SECRETS_ENCRYPTION_KEY

// N8N-webhook, josta kävijätiedot haetaan user_id:n perusteella
const N8N_GOOGLE_ANALYTICS_VISITORS_URL = process.env.N8N_GOOGLE_ANALYTICS_VISITORS_URL

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase envs in google-analytics-visitors')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/google-analytics-visitors
 * Hakee sivuston kävijätiedot N8N-workflow'lta user_id:n perusteella.
 * Näytetään vain jos Google Analytics -integraatio on aktiivinen.
 */
import { setCorsHeaders, handlePreflight } from '../_lib/cors.js'

async function handler(req, res) {
  setCorsHeaders(res, ['GET', 'OPTIONS'])
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const orgId = req.organization?.id
    if (!orgId) {
      return res.status(400).json({ error: 'Käyttäjän organisaatio ei löytynyt' })
    }

    // Tarkista onko Google Analytics -integraatio olemassa (refresh token talletettu)
    const { data: secret, error: secretError } = await supabaseAdmin
      .from('user_secrets')
      .select('id, metadata')
      .eq('user_id', orgId)
      .eq('secret_type', 'google_analytics_credentials')
      .eq('secret_name', 'Google Analytics Refresh Token')
      .eq('is_active', true)
      .maybeSingle()

    if (secretError) {
      console.error('Error checking Google Analytics connection:', secretError)
      return res.status(500).json({ error: 'Virhe tarkistettaessa Google Analytics -yhdistämistä' })
    }

    if (!secret) {
      // Google Analytics ei ole yhdistetty
      return res.status(200).json({ 
        connected: false,
        message: 'Google Analytics ei ole yhdistetty'
      })
    }

    if (!ENCRYPTION_KEY) {
      console.warn('USER_SECRETS_ENCRYPTION_KEY puuttuu – integraatio on kuitenkin merkitty yhdistetyksi')
    }

    if (!N8N_GOOGLE_ANALYTICS_VISITORS_URL) {
      console.warn('N8N_GOOGLE_ANALYTICS_VISITORS_URL ei ole asetettu – palautetaan tyhjät kävijätiedot')
      return res.status(200).json({
        connected: true,
        visitors: {
          total: 0,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          trend: 0
        },
        data: [],
        message: 'Google Analytics on yhdistetty. N8N-kävijädataa ei ole vielä konfiguroitu.'
      })
    }

    const days = parseInt(req.query.days || '30', 10)

    // Rakenna N8N-kutsu: user_id = orgId, days = aikajakso
    let n8nResponseData = null
    try {
      const safePayload = {
        user_id: String(orgId),
        days: Number(days),
        // Mahdollinen property_id voidaan välittää metadatasta
        property_id: secret.metadata?.property_id ? String(secret.metadata.property_id) : null
      }
      n8nResponseData = await sendToN8N(N8N_GOOGLE_ANALYTICS_VISITORS_URL, safePayload)
    } catch (n8nError) {
      // Ei kaadeta koko dashboardia, palautetaan tyhjät arvot
      return res.status(200).json({
        connected: true,
        visitors: {
          total: 0,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          trend: 0
        },
        data: [],
        message: 'N8N-kutsussa tapahtui virhe. Tarkista N8N-workflow.'
      })
    }

    // N8N palauttaa datan muodossa:
    // [
    //   {
    //     "data": [
    //       { "date": "20251126", "totalUsers": "8" },
    //       { "date": "20251125", "totalUsers": "6" },
    //       ...
    //     ]
    //   }
    // ]
    
    // Parsitaan data
    let rawData = []
    if (Array.isArray(n8nResponseData)) {
      // Jos vastaus on array, haetaan ensimmäisen objektin data
      const firstItem = n8nResponseData[0]
      if (firstItem && Array.isArray(firstItem.data)) {
        rawData = firstItem.data
      }
    } else if (n8nResponseData?.data && Array.isArray(n8nResponseData.data)) {
      // Jos vastaus on objekti jossa on data-array
      rawData = n8nResponseData.data
    }

    // Muunnetaan päivämäärät ja lasketaan kävijätiedot
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() + 1) // Maanantai
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Laske eri aikajaksojen summat
    let total = 0
    let todayCount = 0
    let thisWeekCount = 0
    let thisMonthCount = 0
    
    rawData.forEach(item => {
      const dateStr = item.date || item.Date || ''
      const users = parseInt(item.totalUsers || item.total_users || item.users || 0, 10) || 0
      
      if (!dateStr || dateStr.length !== 8) return
      
      // Muunna YYYYMMDD -> Date
      const year = parseInt(dateStr.substring(0, 4), 10)
      const month = parseInt(dateStr.substring(4, 6), 10) - 1 // JS kuukaudet ovat 0-11
      const day = parseInt(dateStr.substring(6, 8), 10)
      const itemDate = new Date(year, month, day)
      
      total += users
      
      // Tänään
      if (itemDate.getTime() === today.getTime()) {
        todayCount += users
      }
      
      // Tämä viikko (maanantai -> sunnuntai)
      if (itemDate >= weekStart && itemDate <= today) {
        thisWeekCount += users
      }
      
      // Tämä kuukausi
      if (itemDate >= monthStart && itemDate <= today) {
        thisMonthCount += users
      }
    })
    
    // Laske trend (tämän viikon vs. edellinen viikko)
    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(weekStart)
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)
    
    let lastWeekCount = 0
    rawData.forEach(item => {
      const dateStr = item.date || item.Date || ''
      if (!dateStr || dateStr.length !== 8) return
      
      const year = parseInt(dateStr.substring(0, 4), 10)
      const month = parseInt(dateStr.substring(4, 6), 10) - 1
      const day = parseInt(dateStr.substring(6, 8), 10)
      const itemDate = new Date(year, month, day)
      
      if (itemDate >= lastWeekStart && itemDate <= lastWeekEnd) {
        const users = parseInt(item.totalUsers || item.total_users || item.users || 0, 10) || 0
        lastWeekCount += users
      }
    })
    
    // Laske trend-prosentti
    let trend = 0
    if (lastWeekCount > 0) {
      trend = Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
    } else if (thisWeekCount > 0) {
      trend = 100 // Jos edellisellä viikolla ei ollut kävijöitä, trend on 100%
    }

    const visitors = {
      total,
      today: todayCount,
      thisWeek: thisWeekCount,
      thisMonth: thisMonthCount,
      trend
    }

    // Muunna rawData parempaan muotoon frontendille
    const detailData = rawData.map(item => ({
      date: item.date || item.Date || '',
      totalUsers: parseInt(item.totalUsers || item.total_users || item.users || 0, 10) || 0
    }))

    return res.status(200).json({
      connected: true,
      visitors,
      data: detailData
    })
  } catch (error) {
    console.error('Error in google-analytics-visitors:', error)
    return res.status(500).json({ error: 'Sisäinen palvelinvirhe', details: error.message })
  }
}

export default withOrganization(handler)

