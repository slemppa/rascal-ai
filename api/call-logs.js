import axios from 'axios'

const N8N_CALL_LOGS_URL = process.env.N8N_CALL_LOGS_URL || 'https://samikiias.app.n8n.cloud/webhook/call-logs'
const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Tarkista että ympäristömuuttujat on asetettu
  if (!N8N_CALL_LOGS_URL) {
    console.error('Missing N8N_CALL_LOGS_URL environment variable')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const { companyId, sheetUrl, limit = 100 } = req.query
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId parameter is required' })
    }

    console.log('Fetching call logs for company:', companyId, 'sheetUrl:', sheetUrl)

    // Lähetä kutsu N8N webhookiin
    const response = await axios.get(N8N_CALL_LOGS_URL, {
      params: { 
        companyId,
        sheetUrl,
        limit
      },
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_SECRET_KEY
      }
    })

    // N8N palauttaa dataa items array:ssa tai suoraan
    const n8nData = response.data
    console.log('N8N call logs response structure:', Object.keys(n8nData))
    
    // Etsi items array N8N:n vastauksesta
    let items = []
    if (Array.isArray(n8nData)) {
      // Jos data on array, etsi items ensimmäisestä elementistä
      items = n8nData[0]?.items || n8nData
    } else if (n8nData.items) {
      // Jos data on objekti ja sisältää items
      items = n8nData.items
    } else {
      // Fallback: kokeile suoraan dataa
      items = Array.isArray(n8nData) ? n8nData : []
    }

    console.log('Call logs fetched successfully from N8N:', items.length, 'records')

    // Laske tilastot Google Sheets datasta
    const stats = {
      totalCount: items.length,
      successfulCount: items.filter(item => item.Onnistunut === 'Kyllä' || item.Onnistunut === 'kyllä' || item.Onnistunut === '1').length,
      failedCount: items.filter(item => item.Onnistunut === 'Ei' || item.Onnistunut === 'ei' || item.Onnistunut === '0').length,
      averageDuration: 0 // Google Sheets ei sisällä kestoja vielä
    }

    res.status(200).json({ 
      logs: items,
      stats: stats,
      message: 'Puheluloki haettu onnistuneesti'
    })
  } catch (error) {
    console.error('N8N webhook error:', error.response?.status, error.response?.statusText)
    console.error('Error details:', error.response?.data || error.message)
    
    res.status(error.response?.status || 500).json({ 
      error: `N8N webhook failed: ${error.response?.status || 500} ${error.response?.statusText || 'Internal Server Error'}`,
      details: error.response?.data || error.message
    })
  }
} 