import axios from 'axios'

const N8N_CALL_TYPES_URL = process.env.N8N_CALL_TYPES_URL || 'https://samikiias.app.n8n.cloud/webhook/call-types'
const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Tarkista että ympäristömuuttujat on asetettu
  if (!N8N_CALL_TYPES_URL) {
    console.error('Missing N8N_CALL_TYPES_URL environment variable')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const { companyId } = req.query
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId parameter is required' })
    }

    console.log('Fetching call types for company:', companyId)

    // Lähetä kutsu N8N webhookiin
    const response = await axios.get(N8N_CALL_TYPES_URL, {
      params: { companyId },
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_SECRET_KEY
      }
    })

    // N8N palauttaa dataa items array:ssa
    const n8nData = response.data
    console.log('N8N response structure:', Object.keys(n8nData))
    
    // Etsi items array N8N:n vastauksesta
    let items = []
    if (Array.isArray(n8nData)) {
      // Jos data on array, etsi items ensimmäisestä elementistä
      items = n8nData[0]?.items || []
    } else if (n8nData.items) {
      // Jos data on objekti ja sisältää items
      items = n8nData.items
    } else {
      // Fallback: kokeile suoraan dataa
      items = Array.isArray(n8nData) ? n8nData : []
    }

    console.log('Call types fetched successfully from N8N:', items.length, 'records')

    // Muunna N8N data Airtable-muotoon frontendin yhteensopivuutta varten
    const records = items.map(item => ({
      id: item.id,
      fields: {
        Name: item.Name,
        Company: item.Company,
        Identity: item.Identity,
        Style: item.Style,
        Guidelines: item.Guidelines,
        Goals: item.Goals,
        Intro: item.Intro,
        Questions: item.Questions,
        Outro: item.Outro,
        Notes: item.Notes,
        Version: item.Version,
        Status: item.Status,
        'Call ID': item['Call ID'],
        Created: item.Created,
        'Last Modified': item['Last Modified']
      }
    }))

    res.status(200).json({ 
      records: records,
      message: 'Puhelutyypit haettu onnistuneesti'
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