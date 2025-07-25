import { createClient } from '@supabase/supabase-js'

const N8N_STRATEGY_URL = process.env.N8N_GET_STRATEGY_URL
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Luo Supabase client vain jos service key on saatavilla
let supabase = null
if (supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey)
}

export default async function handler(req, res) {
  console.log('=== STRATEGY API CALLED ===')
  console.log('Method:', req.method)
  console.log('Query:', req.query)
  console.log('Headers:', req.headers)
  
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request handled')
    return res.status(200).end()
  }

  // Tarkista ympäristömuuttujat
  console.log('N8N_GET_STRATEGY_URL:', process.env.N8N_GET_STRATEGY_URL)
  console.log('N8N_SECRET_KEY exists:', !!process.env.N8N_SECRET_KEY)

  const companyId = req.query.companyId

  if (!companyId) {
    console.log('No company_id provided')
    return res.status(400).json({ error: 'company_id puuttuu' })
  }

  console.log('Company ID received:', companyId)

  // Kutsu N8N:ää GET:llä ja companyId query-parametrina
  const N8N_STRATEGY_URL = process.env.N8N_GET_STRATEGY_URL
  if (N8N_STRATEGY_URL) {
    const url = `${N8N_STRATEGY_URL}?companyId=${companyId}`
    console.log('Calling N8N URL:', url)
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': process.env.N8N_SECRET_KEY
        }
      })
      console.log('N8N response status:', response.status)
      
      if (response.ok) {
        const responseText = await response.text()
        console.log('N8N response text:', responseText)
        
        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.log('JSON parse error:', parseError)
          throw new Error('Invalid JSON response from N8N')
        }
        
        console.log('N8N response data:', data)
        
        // Muunna N8N:n data oikeaan muotoon
        if (Array.isArray(data) && data.length > 0) {
          const n8nData = data[0]
          const strategies = n8nData.strategyAndMonth?.map(item => ({
            id: item.recordId,
            name: `${item.Month} strategia`,
            description: item.Strategy,
            month: item.Month,
            strategy: item.Strategy,
            company_id: companyId,
            created_at: new Date().toISOString()
          })) || []
          
          const transformedData = {
            strategies: strategies,
            icpSummary: n8nData.icpSummary || []
          }
          
          console.log('Transformed data:', transformedData)
          return res.status(200).json(transformedData)
        }
        
        return res.status(200).json(data)
      } else {
        console.log('N8N returned error, using mock data')
      }
    } catch (e) {
      console.log('Error calling N8N:', e.message)
    }
  }

  // Palauta mock data jos N8N ei vastaa tai URL puuttuu
  const mockData = {
    strategies: [
      {
        id: 1,
        name: "Kesäkuu strategia",
        description: "Kesäkuun sisältöstrategia keskittyy sosiaalisen median kampanjoihin ja brändin rakentamiseen.",
        month: "Kesäkuu",
        strategy: "Kesäkuun sisältöstrategia keskittyy sosiaalisen median kampanjoihin ja brändin rakentamiseen. Suunnittelemme 3-4 viikoittaisen sisällön, joka sisältää käytännön vinkkejä, case-studies ja trendejä.",
        company_id: companyId,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: "Heinäkuu strategia", 
        description: "Heinäkuun strategia painottaa video-sisältöä ja live-tapahtumia.",
        month: "Heinäkuu",
        strategy: "Heinäkuun strategia painottaa video-sisältöä ja live-tapahtumia. Suunnittelemme 2-3 viikoittaisen videosisällön sekä yhden live-webinaarin kuukaudessa.",
        company_id: companyId,
        created_at: new Date().toISOString()
      }
    ],
    icpSummary: [
      "Suomalaiset yrittäjät ja pienet yritykset, jotka haluavat parantaa digitaalista läsnäoloa",
      "Ikäryhmä 25-45, teknologia-innostuneet mutta aikarajoitteiset",
      "Haluavat käytännön vinkkejä ja todistettuja strategioita markkinointiin"
    ]
  }

  console.log('Returning mock data:', mockData)
  res.status(200).json(mockData)
} 