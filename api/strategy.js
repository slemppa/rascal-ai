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
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const companyId = req.query.companyId

  if (!companyId) {
    return res.status(400).json({ error: 'company_id puuttuu' })
  }

  // Kutsu N8N:ää GET:llä ja companyId query-parametrina
  const N8N_STRATEGY_URL = process.env.N8N_GET_STRATEGY_URL
  if (N8N_STRATEGY_URL) {
    const url = `${N8N_STRATEGY_URL}?companyId=${companyId}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': process.env.N8N_SECRET_KEY
        }
      })
      
      if (response.ok) {
        const responseText = await response.text()
        
        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          throw new Error('Invalid JSON response from N8N')
        }
        
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
            icpSummary: n8nData.icpSummary || [],
            kpi: n8nData.kpi || [],
            companySummary: n8nData.summary || n8nData.companySummary || ''
          }
          
          return res.status(200).json(transformedData)
        }
        
        return res.status(200).json(data)
      }
    } catch (e) {
      // N8N error - käytetään mock dataa
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
    ],
    kpi: [
      "Kasvata organista liikennettä 30% seuraavassa 6 kuukaudessa",
      "Paranna lead quality scorea 25%",
      "Lisää sosiaalisen median engagementia 40%",
      "Kasvata newsletter-tilaajia 50%"
    ],
    companySummary: "Rascal AI on suomalainen teknologia-alan yritys, joka tarjoaa AI-pohjaisia markkinointiratkaisuja pienille ja keskisuurille yrityksille. Yritys on erikoistunut automaattiseen sisältöluontiin, asiakashankintaan ja digitaalisen markkinoinnin optimointiin. Rascal AI:n tavoitteena on tehdä edistyksellisestä teknologiasta helposti käytettävää ja kustannustehokasta suomalaisille yrittäjille."
  }

  res.status(200).json(mockData)
} 