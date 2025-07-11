import axios from 'axios'

const N8N_CALL_LOG_DETAIL_URL = process.env.N8N_CALL_LOG_DETAIL_URL || 'https://samikiias.app.n8n.cloud/webhook/call-log-detail'
const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Tarkista että ympäristömuuttujat on asetettu
  if (!N8N_CALL_LOG_DETAIL_URL) {
    console.error('Missing N8N_CALL_LOG_DETAIL_URL environment variable')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const { companyId, callId, rowId } = req.query
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId parameter is required' })
    }

    if (!callId && !rowId) {
      return res.status(400).json({ error: 'Either callId or rowId parameter is required' })
    }

    console.log('Fetching call log detail for company:', companyId, 'callId:', callId, 'rowId:', rowId)

    // Lähetä kutsu N8N webhookiin
    const response = await axios.get(N8N_CALL_LOG_DETAIL_URL, {
      params: { 
        companyId,
        callId,
        rowId
      },
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_SECRET_KEY
      }
    })

    const detailData = response.data
    console.log('Call log detail fetched successfully from N8N')

    res.status(200).json({ 
      detail: detailData,
      message: 'Puhelun yksityiskohdat haettu onnistuneesti'
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