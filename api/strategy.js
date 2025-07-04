const N8N_STRATEGY_URL = process.env.N8N_GET_STRATEGY || 'https://samikiias.app.n8n.cloud/webhook/strategy-89777321'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()
  
  const { companyId } = req.query
  
  console.log('Strategy API called:', { method: req.method, companyId })
  console.log('Using webhook URL:', N8N_STRATEGY_URL)
  console.log('N8N_SECRET_KEY available:', !!process.env.N8N_SECRET_KEY)
  
  try {
    if (req.method === 'GET') {
      // GET: Hae strategia
      console.log('Sending GET request to webhook with companyId:', companyId || null)
      
      const url = companyId 
        ? `${N8N_STRATEGY_URL}?companyId=${companyId}`
        : N8N_STRATEGY_URL
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': process.env.N8N_SECRET_KEY
        }
      })
      
      console.log('Webhook response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Webhook error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }
      
      const webhookData = await response.json()
      console.log('Webhook response data:', webhookData)
      
      // Muunna webhookin data ContentStrategyPage:n odottamaan muotoon
      const transformedData = []
      
      webhookData.forEach((item, index) => {
        // Uusi webhook-formaatti: {icpSummary: [...], strategyAndMonth: [...]}
        const icpSummary = item.icpSummary?.[0] || ''
        const strategies = item.strategyAndMonth || []
        const timestamp = Date.now()
        
        // ICP-kortti
        if (icpSummary) {
          transformedData.push({
            id: companyId || `icp_${timestamp}_${index}`,
            recordId: companyId,
            createdTime: new Date().toISOString(),
            Month: strategies[0]?.Month || 'Kesäkuu',
            Companies: companyId ? [companyId] : [],
            Strategy: '', // Tyhjä strategia ICP-kortissa
            ICP: {
              summary: icpSummary
            }
          })
        }
        
        // Strategy-kortit
        strategies.forEach((strategy, strategyIndex) => {
          if (strategy.Strategy) {
            transformedData.push({
              id: `strategy_${timestamp}_${index}_${strategyIndex}`,
              recordId: `strategy_${timestamp}_${index}_${strategyIndex}`,
              createdTime: new Date().toISOString(),
              Month: strategy.Month || 'Kesäkuu',
              Companies: companyId ? [companyId] : [],
              Strategy: strategy.Strategy,
              ICP: null // Ei ICP:tä strategy-kortissa
            })
          }
        })
      })
      
      console.log('Transformed data:', transformedData)
      res.status(200).json(transformedData)
    } else if (req.method === 'POST') {
      // POST: Tallenna strategia
      const payload = req.body
      console.log('Sending POST request to webhook with payload:', payload)
      
      const response = await fetch(N8N_STRATEGY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.N8N_SECRET_KEY
        },
        body: JSON.stringify({
          ...payload,
          companyId: companyId || payload.companyId || null
        })
      })
      
      console.log('Webhook response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Webhook error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Webhook response data:', data)
      res.status(200).json(data)
    }
  } catch (e) {
    console.error('Strategy API error:', e)
    res.status(500).json({ error: 'Virhe strategian haussa', details: e.message })
  }
} 